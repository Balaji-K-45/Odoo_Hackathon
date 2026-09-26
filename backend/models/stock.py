"""
models/stock.py  —  MySQL version
"""

from database import get_db


def get_stock(product_id, location_id):
    """Return current quantity of a product at a location. 0.0 if no row yet."""
    db = get_db()
    with db.cursor() as cur:
        cur.execute(
            "SELECT quantity FROM stock WHERE product_id=%s AND location_id=%s",
            (product_id, location_id)
        )
        row = cur.fetchone()
    return float(row["quantity"]) if row else 0.0


def upsert_stock(product_id, location_id, quantity):
    """
    Insert or update the quantity for (product, location).
    Uses MySQL's INSERT ... ON DUPLICATE KEY UPDATE.
    Note: caller must call db.commit() after all changes.
    """
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO stock (product_id, location_id, quantity)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
        """, (product_id, location_id, quantity))


def get_stock_for_product(product_id):
    """All location-level stock rows for a product."""
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            SELECT s.location_id, l.name AS location_name,
                   w.id AS warehouse_id, w.name AS warehouse_name,
                   s.quantity
            FROM stock s
            JOIN locations  l ON l.id = s.location_id
            JOIN warehouses w ON w.id = l.warehouse_id
            WHERE s.product_id = %s
            ORDER BY w.name, l.name
        """, (product_id,))
        return cur.fetchall()


def get_total_stock_for_product(product_id):
    """Total quantity of a product across all locations."""
    db = get_db()
    with db.cursor() as cur:
        cur.execute(
            "SELECT COALESCE(SUM(quantity), 0) AS total FROM stock WHERE product_id=%s",
            (product_id,)
        )
        row = cur.fetchone()
    return float(row["total"]) if row else 0.0
