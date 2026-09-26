"""
services/product_service.py
----------------------------
Business logic for product management.
Calls models — never talks to Flask directly.
"""

from models.product import (
    get_all_products, get_product_by_id, get_product_by_sku,
    create_product, update_product, delete_product,
)
from models.stock import get_stock_for_product, get_total_stock_for_product


def list_products(search=None, category_id=None):
    products = get_all_products(search=search, category_id=category_id)
    for p in products:
        total = get_total_stock_for_product(p["id"])
        p["total_stock"] = total
        p["location"] = p.pop("location_names", None) or ""
        p["stock_status"] = _stock_status(total, p["reorder_level"])
    return products


def get_product(product_id):
    product = get_product_by_id(product_id)
    if not product:
        return None, "Product not found"
    total = get_total_stock_for_product(product["id"])
    product["total_stock"] = total
    product["stock_status"] = _stock_status(total, product["reorder_level"])
    product["locations"] = get_stock_for_product(product["id"])
    return product, None


def create_new_product(data):
    name          = (data.get("name") or "").strip()
    sku           = (data.get("sku") or "").strip().upper()
    category_id   = data.get("category_id")
    uom           = (data.get("uom") or "units").strip()
    reorder_level = data.get("reorder_level", 0)

    if not name:
        return None, "Product name is required"
    if not sku:
        return None, "SKU is required"

    try:
        reorder_level = float(reorder_level)
    except (TypeError, ValueError):
        return None, "reorder_level must be a number"

    if get_product_by_sku(sku):
        return None, f"SKU '{sku}' already exists"

    product_id = create_product(name, sku, category_id, uom, reorder_level)
    product, _ = get_product(product_id)
    return product, None


def edit_product(product_id, data):
    existing = get_product_by_id(product_id)
    if not existing:
        return None, "Product not found"

    name          = (data.get("name") or existing["name"]).strip()
    sku           = (data.get("sku") or existing["sku"]).strip().upper()
    category_id   = data.get("category_id", existing["category_id"])
    uom           = (data.get("uom") or existing["uom"]).strip()
    reorder_level = data.get("reorder_level", existing["reorder_level"])

    try:
        reorder_level = float(reorder_level)
    except (TypeError, ValueError):
        return None, "reorder_level must be a number"

    # Check SKU conflict only if it changed
    if sku != existing["sku"]:
        if get_product_by_sku(sku):
            return None, f"SKU '{sku}' already exists"

    update_product(product_id, name, sku, category_id, uom, reorder_level)
    product, _ = get_product(product_id)
    return product, None


def remove_product(product_id):
    existing = get_product_by_id(product_id)
    if not existing:
        return False, "Product not found"
    delete_product(product_id)
    return True, None


# ── Internal helper ─────────────────────────────────────────────────────────
def _stock_status(quantity, reorder_level):
    if quantity == 0:
        return "out_of_stock"
    if quantity <= reorder_level:
        return "low_stock"
    return "in_stock"
