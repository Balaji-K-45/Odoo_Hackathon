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


def increase_stock(product_id, location_id, quantity):
    """Atomically add quantity, including when the stock row does not exist."""
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO stock (product_id, location_id, quantity)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        """, (product_id, location_id, quantity))


def decrease_stock_if_available(product_id, location_id, quantity):
    """Subtract only if enough stock remains; return the new quantity or None."""
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            UPDATE stock
            SET quantity = quantity - %s
            WHERE product_id = %s AND location_id = %s AND quantity >= %s
        """, (quantity, product_id, location_id, quantity))
        if cur.rowcount == 0:
            return None
        cur.execute(
            "SELECT quantity FROM stock WHERE product_id=%s AND location_id=%s",
            (product_id, location_id),
        )
        return float(cur.fetchone()["quantity"])


def get_stock_rows_for_update(product_id, location_ids):
    """Lock existing stock rows in stable location order for a transfer."""
    ordered_ids = sorted(set(location_ids))
    placeholders = ", ".join(["%s"] * len(ordered_ids))
    db = get_db()
    with db.cursor() as cur:
        cur.execute(f"""
            SELECT location_id, quantity
            FROM stock
            WHERE product_id = %s AND location_id IN ({placeholders})
            ORDER BY location_id
            FOR UPDATE
        """, [product_id, *ordered_ids])
        return {row["location_id"]: float(row["quantity"]) for row in cur.fetchall()}


def lock_stock_row(product_id, location_id):
    """Create a zero-quantity row if needed, then lock and return its quantity."""
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            INSERT IGNORE INTO stock (product_id, location_id, quantity)
            VALUES (%s, %s, 0)
        """, (product_id, location_id))
        cur.execute("""
            SELECT quantity FROM stock
            WHERE product_id=%s AND location_id=%s
            FOR UPDATE
        """, (product_id, location_id))
        return float(cur.fetchone()["quantity"])


def set_stock_quantity(product_id, location_id, quantity):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            UPDATE stock SET quantity=%s
            WHERE product_id=%s AND location_id=%s
        """, (quantity, product_id, location_id))


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


def get_all_stock(product_id=None, location_id=None, warehouse_id=None,
                  category_id=None):
    """List recorded stock balances with their product and location details."""
    query = """
        SELECT s.product_id, p.name AS product_name, p.sku, p.category_id,
               c.name AS category_name, p.uom, p.reorder_level,
               s.location_id, l.name AS location_name,
               w.id AS warehouse_id, w.name AS warehouse_name, s.quantity,
               s.updated_at
        FROM stock s
        JOIN products p ON p.id = s.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        JOIN locations l ON l.id = s.location_id
        JOIN warehouses w ON w.id = l.warehouse_id
        WHERE 1=1
    """
    params = []
    for column, value in (
        ("s.product_id", product_id),
        ("s.location_id", location_id),
        ("w.id", warehouse_id),
        ("p.category_id", category_id),
    ):
        if value:
            query += f" AND {column} = %s"
            params.append(value)
    query += " ORDER BY p.name, w.name, l.name"

    db = get_db()
    with db.cursor() as cur:
        cur.execute(query, params)
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
