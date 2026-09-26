"""
routes/transfer_routes.py
--------------------------
POST /api/transfers        → move stock between locations
GET  /api/transfers        → list all transfers
GET  /api/transfers/<id>   → single transfer detail
"""

from flask import Blueprint, request, jsonify
from services.stock_service import process_transfer
from models.operation import get_operations_by_type, get_operation_by_id

transfer_bp = Blueprint("transfers", __name__)


@transfer_bp.route("/api/transfers", methods=["POST"])
def create_transfer():
    data = request.get_json() or {}

    result, error = process_transfer(
        product_id              = data.get("product_id"),
        source_location_id      = data.get("source_location_id"),
        destination_location_id = data.get("destination_location_id"),
        quantity                = data.get("quantity"),
        reference               = data.get("reference"),
        notes                   = data.get("notes"),
        user_id                 = data.get("user_id"),
    )
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({
        "success": True,
        "message": "Transfer completed successfully",
        "data": result,
    }), 201


@transfer_bp.route("/api/transfers", methods=["GET"])
def list_transfers():
    transfers = get_operations_by_type("TRANSFER")
    return jsonify({"success": True, "data": transfers}), 200


@transfer_bp.route("/api/transfers/<int:operation_id>", methods=["GET"])
def get_transfer(operation_id):
    op = get_operation_by_id(operation_id)
    if not op or op.get("operation_type") != "TRANSFER":
        return jsonify({"success": False, "message": "Transfer not found"}), 404
    return jsonify({"success": True, "data": op}), 200
