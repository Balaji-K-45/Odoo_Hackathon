"""
routes/dashboard_routes.py
---------------------------
Both roles can view the dashboard.
GET /api/dashboard   → all KPIs for the inventory dashboard
"""

from flask import Blueprint, jsonify
from middleware.auth import (
    login_required, roles_required,
    INVENTORY_MANAGER, WAREHOUSE_STAFF,
)
from services.dashboard_service import get_dashboard_kpis

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def dashboard():
    kpis = get_dashboard_kpis()
    return jsonify({"success": True, "data": kpis}), 200
