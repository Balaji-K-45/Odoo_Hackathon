"""
services/dashboard_service.py  —  MySQL version
Uses DATE_SUB(NOW(), INTERVAL 30 DAY) instead of SQLite's datetime('now','-30 days').
"""

from database import get_db


def _scalar(sql, params=()):
    """Run a query that returns exactly one row with one column."""
    db = get_db()
    with db.cursor() as cur:
        cur.execute(sql, params)
        row = cur.fetchone()
    # row is a dict like {"cnt": 5}
    return list(row.values())[0] if row else 0


def get_dashboard_kpis():
    total_products = _scalar("SELECT COUNT(*) AS cnt FROM products")

    low_stock = _scalar("""
        SELECT COUNT(DISTINCT s.product_id) AS cnt
        FROM stock s
        JOIN products p ON p.id = s.product_id
        WHERE s.quantity > 0 AND s.quantity <= p.reorder_level
    """)

    out_of_stock = _scalar("""
        SELECT COUNT(*) AS cnt FROM (
            SELECT product_id
            FROM stock
            GROUP BY product_id
            HAVING SUM(quantity) = 0
        ) AS sub
    """)

    pending_receipts = _scalar("""
        SELECT COUNT(*) AS cnt FROM operations
        WHERE operation_type='RECEIPT' AND status != 'done'
    """)

    pending_deliveries = _scalar("""
        SELECT COUNT(*) AS cnt FROM operations
        WHERE operation_type='DELIVERY' AND status != 'done'
    """)

    pending_transfers = _scalar("""
        SELECT COUNT(*) AS cnt FROM operations
        WHERE operation_type='TRANSFER' AND status != 'done'
    """)

    recent_receipts = _scalar("""
        SELECT COUNT(*) AS cnt FROM operations
        WHERE operation_type='RECEIPT'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    """)

    recent_deliveries = _scalar("""
        SELECT COUNT(*) AS cnt FROM operations
        WHERE operation_type='DELIVERY'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    """)

    recent_transfers = _scalar("""
        SELECT COUNT(*) AS cnt FROM operations
        WHERE operation_type='TRANSFER'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    """)

    recent_adjustments = _scalar("""
        SELECT COUNT(*) AS cnt FROM operations
        WHERE operation_type='ADJUSTMENT'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    """)

    return {
        "total_products":     total_products,
        "low_stock_items":    low_stock,
        "out_of_stock_items": out_of_stock,
        "pending_receipts":   pending_receipts,
        "pending_deliveries": pending_deliveries,
        "pending_transfers":  pending_transfers,
        "recent_activity": {
            "receipts":    recent_receipts,
            "deliveries":  recent_deliveries,
            "transfers":   recent_transfers,
            "adjustments": recent_adjustments,
        }
    }
