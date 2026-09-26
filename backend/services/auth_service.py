"""
services/auth_service.py
-------------------------
Signup, login, OTP-based password reset.

Password hashing uses werkzeug (already a Flask dependency — no extra install).
Password-reset OTPs are delivered through the configured SMTP service and are
never included in API responses.
"""

import secrets
from datetime import datetime, timedelta
import logging
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os

from models.user import (
    get_user_by_email, create_user, update_password,
    save_otp, get_valid_otp, mark_otp_used, get_user_by_id,
    invalidate_otps,
)
from services.email_service import is_configured, send_email

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
TOKEN_EXPIRY_HOURS = 24


# ── Public signup role ───────────────────────────────────────────────────────
WAREHOUSE_STAFF = "WAREHOUSE_STAFF"


# ── Signup ───────────────────────────────────────────────────────────────────

def signup(name, email, password):
    name  = (name or "").strip()
    email = (email or "").strip().lower()

    if not name:
        return None, "Name is required"
    if not email or "@" not in email:
        return None, "Valid email is required"
    if not password or len(password) < 6:
        return None, "Password must be at least 6 characters"
    # Public registration must never grant elevated privileges.
    role = WAREHOUSE_STAFF

    if get_user_by_email(email):
        return None, "Email already registered"

    hashed = generate_password_hash(password)
    user_id = create_user(name, email, hashed, role)
    token = _make_token(user_id, email, role)
    return {"token": token, "user": {"id": user_id, "name": name,
                                      "email": email, "role": role}}, None


# ── Login ────────────────────────────────────────────────────────────────────

def login(email, password):
    email = (email or "").strip().lower()
    if not email or not password:
        return None, "Email and password are required"

    user = get_user_by_email(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return None, "Invalid email or password"

    token = _make_token(user["id"], user["email"], user["role"])
    return {
        "token": token,
        "user": {
            "id":    user["id"],
            "name":  user["name"],
            "email": user["email"],
            "role":  user["role"],
        }
    }, None


# ── Forgot password (send OTP) ────────────────────────────────────────────────

def send_otp(email):
    email = (email or "").strip().lower()
    if not email:
        return None, "Email is required"

    development_code = os.getenv("DEV_OTP_CODE", "")
    if (
        os.getenv("APP_ENV", "production").lower() == "development"
        and len(development_code) == 6
        and development_code.isdigit()
    ):
        user = get_user_by_email(email)
        if not user:
            return {"message": "If this email is registered, a reset code has been sent."}, None
        if user["role"] == WAREHOUSE_STAFF:
            save_otp(email, development_code)
            return {
                "message": "Development sign-in code created.",
                "development_otp": development_code,
            }, None

    if not is_configured():
        return None, "Email delivery is not configured on this server"

    user = get_user_by_email(email)
    if not user:
        # Security: don't reveal whether email is registered
        return {"message": "If this email is registered, an OTP has been sent"}, None

    otp = f"{secrets.randbelow(1_000_000):06d}"
    save_otp(email, otp)
    try:
        send_email(
            email,
            "StockSense password reset code",
            f"Your StockSense password reset code is {otp}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.",
        )
    except Exception:
        invalidate_otps(email)
        logging.getLogger(__name__).exception("Password reset email delivery failed")
        return {"message": "If this email is registered, a reset code has been sent."}, None

    return {"message": "If this email is registered, a reset code has been sent."}, None


# ── Verify OTP ────────────────────────────────────────────────────────────────

def verify_otp(email, otp):
    email = (email or "").strip().lower()
    row = get_valid_otp(email, otp)
    if not row:
        return None, "Invalid or expired OTP"
    # Don't mark used yet — user still needs to reset password
    return {"valid": True, "email": email}, None


def login_with_otp(email, otp):
    email = (email or "").strip().lower()
    user = get_user_by_email(email)
    row = get_valid_otp(email, otp)
    if not user or not row or user["role"] != WAREHOUSE_STAFF:
        return None, "Invalid or expired sign-in code"

    mark_otp_used(row["id"])
    token = _make_token(user["id"], user["email"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }, None


# ── Reset password ────────────────────────────────────────────────────────────

def reset_password(email, otp, new_password):
    email = (email or "").strip().lower()
    if not new_password or len(new_password) < 6:
        return None, "Password must be at least 6 characters"

    row = get_valid_otp(email, otp)
    if not row:
        return None, "Invalid or expired OTP"

    mark_otp_used(row["id"])
    hashed = generate_password_hash(new_password)
    update_password(email, hashed)
    return {"message": "Password reset successfully"}, None


def change_password(email, current_password, new_password):
    email = (email or "").strip().lower()
    if not current_password or not new_password:
        return None, "Current and new passwords are required"
    if len(new_password) < 8:
        return None, "New password must be at least 8 characters"

    user = get_user_by_email(email)
    if not user or not check_password_hash(user["password_hash"], current_password):
        return None, "Current password is incorrect"
    update_password(email, generate_password_hash(new_password))
    return {"message": "Password changed successfully"}, None


# ── Token helpers ─────────────────────────────────────────────────────────────

def _make_token(user_id, email, role):
    payload = {
        "user_id": user_id,
        "email":   email,
        "role":    role,
        "exp":     datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token):
    """Returns the payload dict or raises jwt.ExpiredSignatureError / jwt.InvalidTokenError."""
    return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
