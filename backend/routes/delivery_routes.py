"""
routes/delivery_routes.py
--------------------------
Both roles can create and view deliveries.
user_id sourced from JWT token (g.current_user_id).
"""

from flask import Blueprint, request, jsonify, g
from middleware.auth import (
    login_required, roles_required,
    INVENTORY_MANAGER, WAREHOUSE_STAFF,
)
from services.stock_service import process_delivery
from models.operation import get_operations_by_type, get_operation_by_id

delivery_bp = Blueprint("deliveries", __name__)


@delivery_bp.route("/api/deliveries", methods=["POST"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def create_delivery():
    data = request.get_json() or {}

    result, error = process_delivery(
        product_id  = data.get("product_id"),
        location_id = data.get("location_id"),
        quantity    = data.get("quantity"),
        reference   = data.get("reference"),
        notes       = data.get("notes"),
        user_id     = g.current_user_id,   # ← from token
    )
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({
        "success": True,
        "message": "Delivery processed successfully",
        "data": result,
    }), 201


@delivery_bp.route("/api/deliveries", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def list_deliveries():
    deliveries = get_operations_by_type("DELIVERY")
    return jsonify({"success": True, "data": deliveries}), 200


@delivery_bp.route("/api/deliveries/<int:operation_id>", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def get_delivery(operation_id):
    op = get_operation_by_id(operation_id)
    if not op or op.get("operation_type") != "DELIVERY":
        return jsonify({"success": False, "message": "Delivery not found"}), 404
    return jsonify({"success": True, "data": op}), 200
