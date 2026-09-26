"""
models/category.py  —  MySQL version
"""

from database import get_db


def get_all_categories():
    db = get_db()
    with db.cursor() as cur:
        cur.execute("SELECT * FROM categories ORDER BY name")
        return cur.fetchall()


def get_category_by_id(category_id):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("SELECT * FROM categories WHERE id=%s", (category_id,))
        return cur.fetchone()


def create_category(name):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("INSERT INTO categories (name) VALUES (%s)", (name,))
        new_id = cur.lastrowid
    db.commit()
    return new_id
