"""
services/auth_service.py
-------------------------
Signup, login, OTP-based password reset.

Password hashing uses werkzeug (already a Flask dependency — no extra install).
OTP is a 6-digit number. In a real app you'd email it; for the hackathon MVP
the API returns it directly so the frontend can display/test it.
"""

import random
import string
from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os

from models.user import (
    get_user_by_email, create_user, update_password,
    save_otp, get_valid_otp, mark_otp_used, get_user_by_id,
)

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

    user = get_user_by_email(email)
    if not user:
        # Security: don't reveal whether email is registered
        return {"message": "If this email is registered, an OTP has been sent"}, None

    otp = "".join(random.choices(string.digits, k=6))
    expires_at = (datetime.utcnow() + timedelta(minutes=10)).strftime(
        "%Y-%m-%d %H:%M:%S"
    )
    save_otp(email, otp, expires_at)

    # In production: send email. For hackathon: return OTP in response.
    return {"message": "OTP sent", "otp": otp,
            "note": "In production this would be emailed. Shown here for demo."}, None


# ── Verify OTP ────────────────────────────────────────────────────────────────

def verify_otp(email, otp):
    email = (email or "").strip().lower()
    row = get_valid_otp(email, otp)
    if not row:
        return None, "Invalid or expired OTP"
    # Don't mark used yet — user still needs to reset password
    return {"valid": True, "email": email}, None


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
