"""
models/warehouse.py  —  MySQL version
"""

from database import get_db


# ── Warehouses ──────────────────────────────────────────────────────────────

def get_all_warehouses():
    db = get_db()
    with db.cursor() as cur:
        cur.execute("SELECT * FROM warehouses ORDER BY name")
        return cur.fetchall()


def get_warehouse_by_id(warehouse_id):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("SELECT * FROM warehouses WHERE id=%s", (warehouse_id,))
        return cur.fetchone()


def create_warehouse(name):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("INSERT INTO warehouses (name) VALUES (%s)", (name,))
        new_id = cur.lastrowid
    db.commit()
    return new_id


# ── Locations ───────────────────────────────────────────────────────────────

def get_all_locations(warehouse_id=None):
    db = get_db()
    with db.cursor() as cur:
        if warehouse_id:
            cur.execute("""
                SELECT l.*, w.name AS warehouse_name
                FROM locations l
                JOIN warehouses w ON w.id = l.warehouse_id
                WHERE l.warehouse_id=%s
                ORDER BY w.name, l.name
            """, (warehouse_id,))
        else:
            cur.execute("""
                SELECT l.*, w.name AS warehouse_name
                FROM locations l
                JOIN warehouses w ON w.id = l.warehouse_id
                ORDER BY w.name, l.name
            """)
        return cur.fetchall()


def get_location_by_id(location_id):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            SELECT l.*, w.name AS warehouse_name
            FROM locations l
            JOIN warehouses w ON w.id = l.warehouse_id
            WHERE l.id=%s
        """, (location_id,))
        return cur.fetchone()


def create_location(warehouse_id, name):
    db = get_db()
    with db.cursor() as cur:
        cur.execute(
            "INSERT INTO locations (warehouse_id, name) VALUES (%s, %s)",
            (warehouse_id, name)
        )
        new_id = cur.lastrowid
    db.commit()
    return new_id
