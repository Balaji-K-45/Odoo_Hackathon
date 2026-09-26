"""Aggregated inventory analysis for manager reporting."""

from database import get_db


def _fetchall(sql, params=()):
    db = get_db()
    with db.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def get_inventory_analysis():
    monthly_operations = _fetchall("""
        SELECT DATE_FORMAT(created_at, '%%Y-%%m') AS month,
               SUM(operation_type='RECEIPT') AS receipts,
               SUM(operation_type='DELIVERY') AS deliveries,
               SUM(operation_type='TRANSFER') AS transfers,
               SUM(operation_type='ADJUSTMENT') AS adjustments
        FROM operations
        WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%%Y-%%m-01')
        GROUP BY DATE_FORMAT(created_at, '%%Y-%%m')
        ORDER BY month
    """)

    operation_types = _fetchall("""
        SELECT operation_type AS type, COUNT(*) AS count
        FROM operations
        GROUP BY operation_type
        ORDER BY operation_type
    """)

    stock_status = _fetchall("""
        SELECT
            COUNT(*) AS total_products,
            SUM(total_quantity = 0) AS out_of_stock,
            SUM(total_quantity > 0 AND total_quantity <= reorder_level) AS low_stock,
            SUM(total_quantity > reorder_level) AS healthy_stock
        FROM (
            SELECT p.id, p.reorder_level, COALESCE(SUM(s.quantity), 0) AS total_quantity
            FROM products p
            LEFT JOIN stock s ON s.product_id = p.id
            GROUP BY p.id, p.reorder_level
        ) AS product_balances
    """)[0]

    stock_by_product = _fetchall("""
        SELECT p.id, p.name, p.sku, p.uom, p.reorder_level,
               COALESCE(SUM(s.quantity), 0) AS quantity
        FROM products p
        LEFT JOIN stock s ON s.product_id = p.id
        GROUP BY p.id, p.name, p.sku, p.uom, p.reorder_level
        ORDER BY quantity DESC, p.name
        LIMIT 10
    """)

    most_delivered = _fetchall("""
        SELECT p.id, p.name, p.sku, p.uom,
               SUM(oi.quantity) AS quantity_delivered,
               COUNT(DISTINCT o.id) AS delivery_count
        FROM operations o
        JOIN operation_items oi ON oi.operation_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE o.operation_type = 'DELIVERY'
          AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        GROUP BY p.id, p.name, p.sku, p.uom
        ORDER BY quantity_delivered DESC, p.name
        LIMIT 10
    """)

    recent_activity = _fetchall("""
         SELECT sl.id, sl.created_at, sl.operation_type, sl.quantity_change,
             sl.reference, p.name AS product_name, p.sku, p.uom,
               l.name AS location_name, w.name AS warehouse_name,
               u.name AS user_name
        FROM stock_ledger sl
        JOIN products p ON p.id = sl.product_id
        JOIN locations l ON l.id = sl.location_id
        JOIN warehouses w ON w.id = l.warehouse_id
        LEFT JOIN users u ON u.id = sl.user_id
        WHERE sl.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
        ORDER BY sl.created_at DESC
        LIMIT 100
    """)

    return {
        "monthly_operations": monthly_operations,
        "operation_types": operation_types,
        "stock_status": stock_status,
        "stock_by_product": stock_by_product,
        "most_delivered": most_delivered,
        "recent_activity": recent_activity,
    }