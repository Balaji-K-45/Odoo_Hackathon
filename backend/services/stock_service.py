"""
services/stock_service.py
--------------------------
Core stock engine — the most important business logic in StockSense.

All stock-changing operations flow through here:
  receipt    → add stock
  delivery   → subtract stock (with validation)
  transfer   → move stock between locations
  adjustment → set stock to physical count

After changing stock, each function creates:
  1. An operation record
  2. An operation_item record (the line)
  3. Stock ledger entries (the audit trail)
"""

from database import get_db
from models.stock     import get_stock, upsert_stock
from models.operation import (
    create_operation, create_operation_item, add_ledger_entry
)
from models.product   import get_product_by_id
from models.warehouse import get_location_by_id


# ── RECEIPT ─────────────────────────────────────────────────────────────────

def process_receipt(product_id, location_id, quantity,
                    reference=None, notes=None, user_id=None):
    """
    Receive stock at a location.
    Increases quantity, records ledger entry.
    """
    error = _validate_inputs(product_id, location_id, quantity)
    if error:
        return None, error

    db = get_db()
    current = get_stock(product_id, location_id)
    new_qty  = current + quantity

    op_id = create_operation("RECEIPT", reference, notes, user_id)
    create_operation_item(op_id, product_id, None, location_id, quantity)
    upsert_stock(product_id, location_id, new_qty)
    add_ledger_entry(product_id, op_id, "RECEIPT", location_id,
                     +quantity, reference, user_id)
    db.commit()

    return _build_result(op_id, product_id, location_id, new_qty), None


# ── DELIVERY ─────────────────────────────────────────────────────────────────

def process_delivery(product_id, location_id, quantity,
                     reference=None, notes=None, user_id=None):
    """
    Deliver stock from a location.
    Fails if stock is insufficient.
    """
    error = _validate_inputs(product_id, location_id, quantity)
    if error:
        return None, error

    db = get_db()
    current = get_stock(product_id, location_id)
    if current < quantity:
        return None, (
            f"Insufficient stock. Available: {current}, Requested: {quantity}"
        )

    new_qty = current - quantity

    op_id = create_operation("DELIVERY", reference, notes, user_id)
    create_operation_item(op_id, product_id, location_id, None, quantity)
    upsert_stock(product_id, location_id, new_qty)
    add_ledger_entry(product_id, op_id, "DELIVERY", location_id,
                     -quantity, reference, user_id)
    db.commit()

    return _build_result(op_id, product_id, location_id, new_qty), None


# ── TRANSFER ─────────────────────────────────────────────────────────────────

def process_transfer(product_id, source_location_id, destination_location_id,
                     quantity, reference=None, notes=None, user_id=None):
    """
    Move stock from source to destination.
    Validates both locations exist and source has enough stock.
    Total stock is unchanged.
    """
    if not product_id or not source_location_id or not destination_location_id:
        return None, "product_id, source_location_id, destination_location_id are required"
    if source_location_id == destination_location_id:
        return None, "Source and destination must be different"

    error = _validate_quantity(quantity)
    if error:
        return None, error

    if not get_product_by_id(product_id):
        return None, "Product not found"
    if not get_location_by_id(source_location_id):
        return None, "Source location not found"
    if not get_location_by_id(destination_location_id):
        return None, "Destination location not found"

    db = get_db()
    src_qty = get_stock(product_id, source_location_id)
    if src_qty < quantity:
        return None, (
            f"Insufficient stock at source. Available: {src_qty}, Requested: {quantity}"
        )

    dst_qty = get_stock(product_id, destination_location_id)
    new_src = src_qty - quantity
    new_dst = dst_qty + quantity

    op_id = create_operation("TRANSFER", reference, notes, user_id)
    create_operation_item(op_id, product_id,
                          source_location_id, destination_location_id, quantity)

    upsert_stock(product_id, source_location_id, new_src)
    upsert_stock(product_id, destination_location_id, new_dst)

    # Two ledger entries — one negative (source), one positive (destination)
    add_ledger_entry(product_id, op_id, "TRANSFER", source_location_id,
                     -quantity, reference, user_id)
    add_ledger_entry(product_id, op_id, "TRANSFER", destination_location_id,
                     +quantity, reference, user_id)
    db.commit()

    return {
        "operation_id":           op_id,
        "product_id":             product_id,
        "source_location_id":     source_location_id,
        "destination_location_id": destination_location_id,
        "quantity_moved":         quantity,
        "source_new_quantity":    new_src,
        "destination_new_quantity": new_dst,
    }, None


# ── ADJUSTMENT ───────────────────────────────────────────────────────────────

def process_adjustment(product_id, location_id, physical_count,
                       reference=None, notes=None, user_id=None):
    """
    Adjust stock to match a physical count.
    Difference (positive or negative) is recorded in the ledger.
    """
    error = _validate_inputs(product_id, location_id, physical_count,
                              allow_zero=True)
    if error:
        return None, error

    db = get_db()
    current    = get_stock(product_id, location_id)
    difference = physical_count - current

    op_id = create_operation("ADJUSTMENT", reference, notes, user_id)
    create_operation_item(op_id, product_id, location_id, location_id,
                          physical_count)
    upsert_stock(product_id, location_id, physical_count)
    add_ledger_entry(product_id, op_id, "ADJUSTMENT", location_id,
                     difference, reference, user_id)
    db.commit()

    return {
        "operation_id":    op_id,
        "product_id":      product_id,
        "location_id":     location_id,
        "previous_stock":  current,
        "physical_count":  physical_count,
        "difference":      difference,
        "new_stock":       physical_count,
    }, None


# ── Private helpers ──────────────────────────────────────────────────────────

def _validate_inputs(product_id, location_id, quantity, allow_zero=False):
    if not product_id:
        return "product_id is required"
    if not location_id:
        return "location_id is required"
    error = _validate_quantity(quantity, allow_zero)
    if error:
        return error
    if not get_product_by_id(product_id):
        return "Product not found"
    if not get_location_by_id(location_id):
        return "Location not found"
    return None


def _validate_quantity(quantity, allow_zero=False):
    try:
        q = float(quantity)
    except (TypeError, ValueError):
        return "quantity must be a number"
    if not allow_zero and q <= 0:
        return "quantity must be greater than 0"
    if allow_zero and q < 0:
        return "quantity cannot be negative"
    return None


def _build_result(op_id, product_id, location_id, new_qty):
    return {
        "operation_id": op_id,
        "product_id":   product_id,
        "location_id":  location_id,
        "new_quantity": new_qty,
    }
