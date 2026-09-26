"""
routes/receipt_routes.py
-------------------------
Both INVENTORY_MANAGER and WAREHOUSE_STAFF can:
  POST /api/receipts          → receive stock
  GET  /api/receipts          → list receipts
  GET  /api/receipts/<id>     → single receipt

user_id is taken from the JWT token (g.current_user_id), NOT from the request body.
This prevents a user from faking another user's ID.
"""

from flask import Blueprint, request, jsonify, g
from middleware.auth import (
    login_required, roles_required,
    INVENTORY_MANAGER, WAREHOUSE_STAFF,
)
from services.stock_service import process_receipt
from models.operation import get_operations_by_type, get_operation_by_id

receipt_bp = Blueprint("receipts", __name__)


@receipt_bp.route("/api/receipts", methods=["POST"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def create_receipt():
    data = request.get_json() or {}

    result, error = process_receipt(
        product_id  = data.get("product_id"),
        location_id = data.get("location_id"),
        quantity    = data.get("quantity"),
        reference   = data.get("reference"),
        notes       = data.get("notes"),
        user_id     = g.current_user_id,   # ← from token, not request body
    )
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({
        "success": True,
        "message": "Stock received successfully",
        "data": result,
    }), 201


@receipt_bp.route("/api/receipts", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def list_receipts():
    receipts = get_operations_by_type("RECEIPT")
    return jsonify({"success": True, "data": receipts}), 200


@receipt_bp.route("/api/receipts/<int:operation_id>", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def get_receipt(operation_id):
    op = get_operation_by_id(operation_id)
    if not op or op.get("operation_type") != "RECEIPT":
        return jsonify({"success": False, "message": "Receipt not found"}), 404
    return jsonify({"success": True, "data": op}), 200
