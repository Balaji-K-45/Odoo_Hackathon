"""
routes/auth_routes.py
----------------------
POST /api/auth/signup          → create account
POST /api/auth/login           → get JWT token
POST /api/auth/forgot-password → request OTP
POST /api/auth/verify-otp      → check OTP validity
POST /api/auth/reset-password  → set new password with OTP
GET  /api/auth/profile         → get logged-in user info (requires token)
"""

from flask import Blueprint, request, jsonify
from services.auth_service import (
    signup, login, send_otp, verify_otp, reset_password, decode_token
)
from models.user import get_user_by_id
import jwt

auth_bp = Blueprint("auth", __name__)


# ── Signup ───────────────────────────────────────────────────────────────────

@auth_bp.route("/api/auth/signup", methods=["POST"])
def do_signup():
    data = request.get_json() or {}
    result, error = signup(
        name     = data.get("name"),
        email    = data.get("email"),
        password = data.get("password"),
        role     = data.get("role", "staff"),
    )
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({
        "success": True,
        "message": "Account created successfully",
        "data": result,
    }), 201


# ── Login ────────────────────────────────────────────────────────────────────

@auth_bp.route("/api/auth/login", methods=["POST"])
def do_login():
    data = request.get_json() or {}
    result, error = login(
        email    = data.get("email"),
        password = data.get("password"),
    )
    if error:
        return jsonify({"success": False, "message": error}), 401
    return jsonify({
        "success": True,
        "message": "Login successful",
        "data": result,
    }), 200


# ── Forgot Password ───────────────────────────────────────────────────────────

@auth_bp.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    result, error = send_otp(email=data.get("email"))
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({"success": True, "data": result}), 200


# ── Verify OTP ───────────────────────────────────────────────────────────────

@auth_bp.route("/api/auth/verify-otp", methods=["POST"])
def do_verify_otp():
    data = request.get_json() or {}
    result, error = verify_otp(
        email = data.get("email"),
        otp   = data.get("otp"),
    )
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({"success": True, "data": result}), 200


# ── Reset Password ────────────────────────────────────────────────────────────

@auth_bp.route("/api/auth/reset-password", methods=["POST"])
def do_reset_password():
    data = request.get_json() or {}
    result, error = reset_password(
        email        = data.get("email"),
        otp          = data.get("otp"),
        new_password = data.get("new_password"),
    )
    if error:
        return jsonify({"success": False, "message": error}), 400
    return jsonify({"success": True, "data": result}), 200


# ── Profile (protected) ───────────────────────────────────────────────────────

@auth_bp.route("/api/auth/profile", methods=["GET"])
def profile():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"success": False, "message": "Token required"}), 401
    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "message": "Invalid token"}), 401

    user = get_user_by_id(payload["user_id"])
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    return jsonify({"success": True, "data": user}), 200
