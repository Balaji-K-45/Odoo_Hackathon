"""Manager-only inventory analysis endpoints."""

from flask import Blueprint, jsonify
from middleware.auth import INVENTORY_MANAGER, login_required, roles_required
from services.analysis_service import get_inventory_analysis

analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/api/analysis", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER)
def analysis():
    return jsonify({
        "success": True,
        "message": "Inventory analysis loaded",
        "data": get_inventory_analysis(),
    }), 200