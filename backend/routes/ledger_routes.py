"""
routes/ledger_routes.py
------------------------
GET /api/ledger   → audit trail of all stock movements
  Optional query params:
    ?product_id=
    ?operation_type=RECEIPT|DELIVERY|TRANSFER|ADJUSTMENT
    ?location_id=
    ?limit=100
"""

from flask import Blueprint, request, jsonify
from services.ledger_service import get_ledger

ledger_bp = Blueprint("ledger", __name__)


@ledger_bp.route("/api/ledger", methods=["GET"])
def get_stock_ledger():
    product_id     = request.args.get("product_id")
    operation_type = request.args.get("operation_type")
    location_id    = request.args.get("location_id")
    limit          = request.args.get("limit", 100)

    try:
        limit = int(limit)
    except (ValueError, TypeError):
        limit = 100

    entries = get_ledger(
        product_id=product_id,
        operation_type=operation_type,
        location_id=location_id,
        limit=limit,
    )
    return jsonify({"success": True, "data": entries}), 200
