"""
services/ledger_service.py  —  MySQL version
"""

from database import get_db


def get_ledger(product_id=None, operation_type=None,
               location_id=None, limit=100):
    db = get_db()
    query = """
        SELECT
            sl.id,
            sl.created_at,
            p.name          AS product_name,
            p.sku,
            p.uom,
            sl.operation_type,
            sl.quantity_change,
            sl.reference,
            l.name          AS location_name,
            w.name          AS warehouse_name,
            c.name          AS category_name,
            o.status,
            u.name          AS user_name,
            sl.operation_id
        FROM stock_ledger sl
        JOIN products   p  ON p.id = sl.product_id
        JOIN locations  l  ON l.id = sl.location_id
        JOIN warehouses w  ON w.id = l.warehouse_id
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN operations o ON o.id = sl.operation_id
        LEFT JOIN users u  ON u.id = sl.user_id
        WHERE 1=1
    """
    params = []
    if product_id:
        query += " AND sl.product_id = %s"
        params.append(product_id)
    if operation_type:
        query += " AND sl.operation_type = %s"
        params.append(operation_type.upper())
    if location_id:
        query += " AND sl.location_id = %s"
        params.append(location_id)
    query += " ORDER BY sl.created_at DESC LIMIT %s"
    params.append(int(limit))

    with db.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()
