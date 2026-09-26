"""
routes/category_routes.py
--------------------------
GET  /api/categories     → list all categories
POST /api/categories     → create a category
"""

from flask import Blueprint, request, jsonify
from models.category import get_all_categories, get_category_by_id, create_category

category_bp = Blueprint("categories", __name__)


@category_bp.route("/api/categories", methods=["GET"])
def get_categories():
    cats = get_all_categories()
    return jsonify({"success": True, "data": cats}), 200


@category_bp.route("/api/categories", methods=["POST"])
def add_category():
    data = request.get_json()
    name = (data.get("name") or "").strip() if data else ""
    if not name:
        return jsonify({"success": False, "message": "Category name is required"}), 400
    try:
        cat_id = create_category(name)
    except Exception:
        return jsonify({"success": False, "message": "Category already exists"}), 409
    cat = get_category_by_id(cat_id)
    return jsonify({
        "success": True,
        "message": "Category created",
        "data": cat,
    }), 201
