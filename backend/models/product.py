"""
models/product.py  —  MySQL version
All queries use %s placeholders (MySQL style).
Rows are plain dicts thanks to DictCursor in database.py.
"""

from database import get_db


def _exec(sql, params=()):
    db = get_db()
    with db.cursor() as cur:
        cur.execute(sql, params)
        return cur


def _fetchall(sql, params=()):
    db = get_db()
    with db.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()   # list of dicts


def _fetchone(sql, params=()):
    db = get_db()
    with db.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchone()   # dict or None


# ── Queries ──────────────────────────────────────────────────────────────────

def get_all_products(search=None, category_id=None):
    query = """
        SELECT p.id, p.name, p.sku, p.category_id,
               c.name AS category_name,
             p.uom, p.reorder_level, p.created_at, p.updated_at,
             stock_locations.location_names
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN (
             SELECT s.product_id,
                 GROUP_CONCAT(
                  DISTINCT CONCAT(w.name, ' / ', l.name)
                  ORDER BY w.name, l.name SEPARATOR ', '
                 ) AS location_names
             FROM stock s
             JOIN locations l ON l.id = s.location_id
             JOIN warehouses w ON w.id = l.warehouse_id
             GROUP BY s.product_id
         ) AS stock_locations ON stock_locations.product_id = p.id
        WHERE 1=1
    """
    params = []
    if search:
        query += " AND (p.name LIKE %s OR p.sku LIKE %s)"
        params += [f"%{search}%", f"%{search}%"]
    if category_id:
        query += " AND p.category_id = %s"
        params.append(category_id)
    query += " ORDER BY p.created_at DESC"
    return _fetchall(query, params)


def get_product_by_id(product_id):
    return _fetchone("""
        SELECT p.id, p.name, p.sku, p.category_id,
               c.name AS category_name,
               p.uom, p.reorder_level, p.created_at, p.updated_at
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = %s
    """, (product_id,))


def get_product_by_sku(sku):
    return _fetchone("SELECT * FROM products WHERE sku = %s", (sku,))


def create_product(name, sku, category_id, uom, reorder_level):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO products (name, sku, category_id, uom, reorder_level)
            VALUES (%s, %s, %s, %s, %s)
        """, (name, sku, category_id, uom, reorder_level))
        new_id = cur.lastrowid
    db.commit()
    return new_id


def update_product(product_id, name, sku, category_id, uom, reorder_level):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            UPDATE products
            SET name=%s, sku=%s, category_id=%s, uom=%s, reorder_level=%s
            WHERE id=%s
        """, (name, sku, category_id, uom, reorder_level, product_id))
    db.commit()


def delete_product(product_id):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
    db.commit()
