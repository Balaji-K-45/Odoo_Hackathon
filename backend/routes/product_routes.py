"""
routes/product_routes.py
-------------------------
REST API for product management.

GET    /api/products          → list all products (with optional ?search= & ?category_id=)
POST   /api/products          → create a product
GET    /api/products/<id>     → get single product (with location-wise stock)
PUT    /api/products/<id>     → update a product
DELETE /api/products/<id>     → delete a product
"""

from flask import Blueprint, request, jsonify
from services.product_service import (
    list_products, get_product, create_new_product,
    edit_product, remove_product,
)

product_bp = Blueprint("products", __name__)


@product_bp.route("/api/products", methods=["GET"])
def get_products():
    search      = request.args.get("search")
    category_id = request.args.get("category_id")
    products = list_products(search=search, category_id=category_id)
    return jsonify({"success": True, "data": products}), 200


@product_bp.route("/api/products", methods=["POST"])
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
def get_single_product(product_id):
    product, error = get_product(product_id)
    if error:
        return jsonify({"success": False, "message": error}), 404
    return jsonify({"success": True, "data": product}), 200


@product_bp.route("/api/products/<int:product_id>", methods=["PUT"])
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
def delete_product(product_id):
    ok, error = remove_product(product_id)
    if not ok:
        return jsonify({"success": False, "message": error}), 404
    return jsonify({"success": True, "message": "Product deleted"}), 200
