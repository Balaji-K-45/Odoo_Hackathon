"""
routes/dashboard_routes.py
---------------------------
GET /api/dashboard   → all KPIs for the inventory dashboard
"""

from flask import Blueprint, jsonify
from services.dashboard_service import get_dashboard_kpis

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
def dashboard():
    kpis = get_dashboard_kpis()
    return jsonify({"success": True, "data": kpis}), 200
