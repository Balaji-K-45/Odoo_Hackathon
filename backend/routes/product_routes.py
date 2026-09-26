"""
routes/product_routes.py
-------------------------
GET    /api/products          → Both roles (view products)
POST   /api/products          → INVENTORY_MANAGER only
GET    /api/products/<id>     → Both roles
PUT    /api/products/<id>     → INVENTORY_MANAGER only
DELETE /api/products/<id>     → INVENTORY_MANAGER only
"""

from flask import Blueprint, request, jsonify
from middleware.auth import (
    login_required, roles_required,
    INVENTORY_MANAGER, WAREHOUSE_STAFF,
)
from services.product_service import (
    list_products, get_product, create_new_product,
    edit_product, remove_product,
)

product_bp = Blueprint("products", __name__)


@product_bp.route("/api/products", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def get_products():
    search      = request.args.get("search")
    category_id = request.args.get("category_id")
    products = list_products(search=search, category_id=category_id)
    return jsonify({"success": True, "data": products}), 200


@product_bp.route("/api/products", methods=["POST"])
@login_required
@roles_required(INVENTORY_MANAGER)
def add_product():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Request body is required"}), 400
    product, error = create_new_product(data)
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({
        "success": True,
        "message": "Product created successfully",
        "data": product,
    }), 201


@product_bp.route("/api/products/<int:product_id>", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def get_single_product(product_id):
    product, error = get_product(product_id)
    if error:
        return jsonify({"success": False, "message": error}), 404
    return jsonify({"success": True, "data": product}), 200


@product_bp.route("/api/products/<int:product_id>", methods=["PUT"])
@login_required
@roles_required(INVENTORY_MANAGER)
def update_product(product_id):
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Request body is required"}), 400
    product, error = edit_product(product_id, data)
    if error:
        status = 404 if "not found" in error else 400
        return jsonify({"success": False, "message": error}), status
    return jsonify({
        "success": True,
        "message": "Product updated successfully",
        "data": product,
    }), 200


@product_bp.route("/api/products/<int:product_id>", methods=["DELETE"])
@login_required
@roles_required(INVENTORY_MANAGER)
def delete_product(product_id):
    ok, error = remove_product(product_id)
    if not ok:
        return jsonify({"success": False, "message": error}), 404
    return jsonify({"success": True, "message": "Product deleted"}), 200
