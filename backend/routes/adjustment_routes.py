"""
routes/adjustment_routes.py
----------------------------
Both roles can create and view adjustments.
user_id sourced from JWT token (g.current_user_id).
"""

from flask import Blueprint, request, jsonify, g
from middleware.auth import (
    login_required, roles_required,
    INVENTORY_MANAGER, WAREHOUSE_STAFF,
)
from services.stock_service import process_adjustment
from models.operation import get_operations_by_type

adjustment_bp = Blueprint("adjustments", __name__)


@adjustment_bp.route("/api/adjustments", methods=["POST"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def create_adjustment():
    data = request.get_json() or {}

    result, error = process_adjustment(
        product_id     = data.get("product_id"),
        location_id    = data.get("location_id"),
        physical_count = data.get("physical_count"),
        reference      = data.get("reference"),
        notes          = data.get("notes"),
        user_id        = g.current_user_id,   # ← from token
    )
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({
        "success": True,
        "message": "Inventory adjusted successfully",
        "data": result,
    }), 201


@adjustment_bp.route("/api/adjustments", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def list_adjustments():
    adjustments = get_operations_by_type("ADJUSTMENT")
    return jsonify({"success": True, "data": adjustments}), 200
