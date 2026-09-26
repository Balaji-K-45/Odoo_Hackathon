"""
routes/warehouse_routes.py
---------------------------
GET  /api/warehouses   → Both roles (staff needs to see warehouse names)
POST /api/warehouses   → INVENTORY_MANAGER only
GET  /api/locations    → Both roles (staff must pick location for operations)
POST /api/locations    → INVENTORY_MANAGER only
"""

from flask import Blueprint, request, jsonify
from middleware.auth import (
    login_required, roles_required,
    INVENTORY_MANAGER, WAREHOUSE_STAFF,
)
from models.warehouse import (
    get_all_warehouses, get_warehouse_by_id, create_warehouse,
    get_all_locations, get_location_by_id, create_location,
)

warehouse_bp = Blueprint("warehouses", __name__)


# ── Warehouses ──────────────────────────────────────────────────────────────

@warehouse_bp.route("/api/warehouses", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def get_warehouses():
    return jsonify({"success": True, "data": get_all_warehouses()}), 200


@warehouse_bp.route("/api/warehouses", methods=["POST"])
@login_required
@roles_required(INVENTORY_MANAGER)
def add_warehouse():
    data = request.get_json()
    name = (data.get("name") or "").strip() if data else ""
    if not name:
        return jsonify({"success": False, "message": "Warehouse name is required"}), 400
    try:
        wh_id = create_warehouse(name)
    except Exception:
        return jsonify({"success": False, "message": "Warehouse already exists"}), 409
    return jsonify({
        "success": True,
        "message": "Warehouse created",
        "data": get_warehouse_by_id(wh_id),
    }), 201


# ── Locations ───────────────────────────────────────────────────────────────

@warehouse_bp.route("/api/locations", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def get_locations():
    warehouse_id = request.args.get("warehouse_id")
    locations = get_all_locations(warehouse_id=warehouse_id)
    return jsonify({"success": True, "data": locations}), 200


@warehouse_bp.route("/api/locations", methods=["POST"])
@login_required
@roles_required(INVENTORY_MANAGER)
def add_location():
    data         = request.get_json() or {}
    warehouse_id = data.get("warehouse_id")
    name         = (data.get("name") or "").strip()
    if not warehouse_id or not name:
        return jsonify({
            "success": False,
            "message": "warehouse_id and name are required",
        }), 400
    if not get_warehouse_by_id(warehouse_id):
        return jsonify({"success": False, "message": "Warehouse not found"}), 404
    loc_id = create_location(warehouse_id, name)
    return jsonify({
        "success": True,
        "message": "Location created",
        "data": get_location_by_id(loc_id),
    }), 201
