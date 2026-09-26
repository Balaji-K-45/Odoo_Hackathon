"""Stock balance read endpoints."""

from flask import Blueprint, jsonify, request
from middleware.auth import (
    INVENTORY_MANAGER, WAREHOUSE_STAFF, login_required, roles_required,
)
from services.stock_service import list_stock

stock_bp = Blueprint("stock", __name__)


@stock_bp.route("/api/stock", methods=["GET"])
@login_required
@roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
def get_stock_balances():
    stock = list_stock(
        product_id=request.args.get("product_id"),
        location_id=request.args.get("location_id"),
        warehouse_id=request.args.get("warehouse_id"),
        category_id=request.args.get("category_id"),
    )
    return jsonify({"success": True, "data": stock}), 200