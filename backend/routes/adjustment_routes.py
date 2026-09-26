"""
routes/adjustment_routes.py
----------------------------
POST /api/adjustments      → physical stock count adjustment
GET  /api/adjustments      → list all adjustments
"""

from flask import Blueprint, request, jsonify
from services.stock_service import process_adjustment
from models.operation import get_operations_by_type

adjustment_bp = Blueprint("adjustments", __name__)


@adjustment_bp.route("/api/adjustments", methods=["POST"])
def create_adjustment():
    data = request.get_json() or {}

    result, error = process_adjustment(
        product_id     = data.get("product_id"),
        location_id    = data.get("location_id"),
        physical_count = data.get("physical_count"),
        reference      = data.get("reference"),
        notes          = data.get("notes"),
        user_id        = data.get("user_id"),
    )
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({
        "success": True,
        "message": "Inventory adjusted successfully",
        "data": result,
    }), 201


@adjustment_bp.route("/api/adjustments", methods=["GET"])
def list_adjustments():
    adjustments = get_operations_by_type("ADJUSTMENT")
    return jsonify({"success": True, "data": adjustments}), 200
