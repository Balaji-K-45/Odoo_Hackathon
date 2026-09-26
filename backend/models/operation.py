"""
models/operation.py  —  MySQL version
"""

from database import get_db


# ── Operations ──────────────────────────────────────────────────────────────

def create_operation(operation_type, reference=None, notes=None, user_id=None):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO operations (operation_type, status, reference, notes, user_id)
            VALUES (%s, 'done', %s, %s, %s)
        """, (operation_type, reference, notes, user_id))
        return cur.lastrowid


def create_operation_item(operation_id, product_id,
                          source_location_id, destination_location_id, quantity):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO operation_items
                (operation_id, product_id, source_location_id,
                 destination_location_id, quantity)
            VALUES (%s, %s, %s, %s, %s)
        """, (operation_id, product_id,
              source_location_id, destination_location_id, quantity))


def add_ledger_entry(product_id, operation_id, operation_type,
                     location_id, quantity_change, reference=None, user_id=None):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO stock_ledger
                (product_id, operation_id, operation_type, location_id,
                 quantity_change, reference, user_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (product_id, operation_id, operation_type,
              location_id, quantity_change, reference, user_id))


def get_operations_by_type(operation_type, limit=50):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            SELECT o.id, o.operation_type, o.status, o.reference,
                   o.notes, o.user_id, o.created_at,
                   oi.product_id, oi.quantity,
                   oi.source_location_id, oi.destination_location_id,
                   p.name  AS product_name, p.sku,
                   sl.name AS source_location_name,
                   dl.name AS destination_location_name
            FROM operations o
            JOIN operation_items oi ON oi.operation_id = o.id
            JOIN products        p  ON p.id  = oi.product_id
            LEFT JOIN locations sl  ON sl.id = oi.source_location_id
            LEFT JOIN locations dl  ON dl.id = oi.destination_location_id
            WHERE o.operation_type = %s
            ORDER BY o.created_at DESC
            LIMIT %s
        """, (operation_type, limit))
        return cur.fetchall()


def get_operation_by_id(operation_id):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("SELECT * FROM operations WHERE id=%s", (operation_id,))
        op = cur.fetchone()
    if not op:
        return None
    with db.cursor() as cur:
        cur.execute("""
            SELECT oi.*, p.name AS product_name, p.sku,
                   sl.name AS source_location_name,
                   dl.name AS destination_location_name
            FROM operation_items oi
            JOIN products       p  ON p.id  = oi.product_id
            LEFT JOIN locations sl ON sl.id = oi.source_location_id
            LEFT JOIN locations dl ON dl.id = oi.destination_location_id
            WHERE oi.operation_id=%s
        """, (operation_id,))
        op["items"] = cur.fetchall()
    return op
