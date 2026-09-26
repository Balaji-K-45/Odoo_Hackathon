"""
routes/delivery_routes.py
--------------------------
POST /api/deliveries          → process a delivery (subtract stock, validates availability)
GET  /api/deliveries          → list all deliveries
GET  /api/deliveries/<id>     → single delivery detail
"""

from flask import Blueprint, request, jsonify
from services.stock_service import process_delivery
from models.operation import get_operations_by_type, get_operation_by_id

delivery_bp = Blueprint("deliveries", __name__)


@delivery_bp.route("/api/deliveries", methods=["POST"])
def create_delivery():
    data = request.get_json() or {}

    result, error = process_delivery(
        product_id  = data.get("product_id"),
        location_id = data.get("location_id"),
        quantity    = data.get("quantity"),
        reference   = data.get("reference"),
        notes       = data.get("notes"),
        user_id     = data.get("user_id"),
    )
    if error:
        # 400 for validation errors, but specifically flag insufficient stock
        status = 400 if "Insufficient" not in error else 400
        return jsonify({"success": False, "message": error}), status
    return jsonify({
        "success": True,
        "message": "Delivery processed successfully",
        "data": result,
    }), 201


@delivery_bp.route("/api/deliveries", methods=["GET"])
def list_deliveries():
    deliveries = get_operations_by_type("DELIVERY")
    return jsonify({"success": True, "data": deliveries}), 200


@delivery_bp.route("/api/deliveries/<int:operation_id>", methods=["GET"])
def get_delivery(operation_id):
    op = get_operation_by_id(operation_id)
    if not op or op.get("operation_type") != "DELIVERY":
        return jsonify({"success": False, "message": "Delivery not found"}), 404
    return jsonify({"success": True, "data": op}), 200
