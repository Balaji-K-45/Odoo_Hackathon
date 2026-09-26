"""
middleware/auth.py
------------------
Role-Based Access Control (RBAC) for StockSense.

HOW IT WORKS
============
Two decorators are provided:

  @login_required
      - Reads the JWT from the Authorization header
      - Validates it and loads the user from the DB
      - Stores the user on Flask's `g` for the rest of the request
      - Returns 401 if token is missing, expired, or invalid

  @roles_required(INVENTORY_MANAGER)           ← one role
  @roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)  ← either role allowed
      - Must be placed BELOW @login_required
      - Checks g.current_user["role"] against allowed roles
      - Returns 403 if the user's role is not in the allowed list

USAGE IN ROUTES
===============

  from middleware.auth import login_required, roles_required
  from middleware.auth import INVENTORY_MANAGER, WAREHOUSE_STAFF

  # Both roles allowed
  @bp.route("/api/receipts", methods=["GET"])
  @login_required
  @roles_required(INVENTORY_MANAGER, WAREHOUSE_STAFF)
  def list_receipts():
      user = g.current_user        # full user dict
      user_id = g.current_user_id  # int shortcut
      ...

  # Manager only
  @bp.route("/api/products", methods=["POST"])
  @login_required
  @roles_required(INVENTORY_MANAGER)
  def create_product():
      ...

ACCESSING THE CURRENT USER INSIDE A ROUTE
==========================================
After @login_required runs successfully:

  g.current_user      → full dict: { id, name, email, role, created_at }
  g.current_user_id   → int  (shortcut for user["id"])
  g.current_user_role → str  (shortcut for user["role"])
"""

from functools import wraps
from flask import g, request, jsonify
import jwt
import os

from models.user import get_user_by_id

# ── Role constants ────────────────────────────────────────────────────────────
INVENTORY_MANAGER = "INVENTORY_MANAGER"
WAREHOUSE_STAFF   = "WAREHOUSE_STAFF"
ALL_ROLES         = (INVENTORY_MANAGER, WAREHOUSE_STAFF)

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")


# ── Decorator 1: login_required ───────────────────────────────────────────────

def login_required(f):
    """
    Validates the JWT token in the Authorization header.
    Populates g.current_user, g.current_user_id, g.current_user_role.
    Returns 401 if the token is missing, expired, or invalid.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({
                "success": False,
                "message": "Authentication required. Send: Authorization: Bearer <token>"
            }), 401

        token = auth_header.split(" ", 1)[1].strip()

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({
                "success": False,
                "message": "Session expired. Please login again."
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "success": False,
                "message": "Invalid token. Please login again."
            }), 401

        # Load fresh user data from DB (catches deleted/deactivated users)
        user = get_user_by_id(payload.get("user_id"))
        if not user:
            return jsonify({
                "success": False,
                "message": "User account not found."
            }), 401

        # Attach user to Flask's request context
        g.current_user      = user
        g.current_user_id   = user["id"]
        g.current_user_role = user["role"]

        return f(*args, **kwargs)
    return decorated


# ── Decorator 2: roles_required ───────────────────────────────────────────────

def roles_required(*allowed_roles):
    """
    Restricts the route to users whose role is in allowed_roles.
    MUST be stacked below @login_required.
    Returns 403 Forbidden if the role check fails.

    Example:
        @login_required
        @roles_required(INVENTORY_MANAGER)
        def manager_only_view(): ...
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # g.current_user_role is set by @login_required
            if not hasattr(g, "current_user_role"):
                return jsonify({
                    "success": False,
                    "message": "Authentication required."
                }), 401

            if g.current_user_role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": (
                        f"Access denied. Your role '{g.current_user_role}' does not have "
                        f"permission for this action."
                    )
                }), 403

            return f(*args, **kwargs)
        return decorated
    return decorator
