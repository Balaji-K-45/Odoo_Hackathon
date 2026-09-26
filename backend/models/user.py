"""
models/user.py  —  MySQL version
"""

from database import get_db


def get_user_by_email(email):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE email=%s", (email,))
        return cur.fetchone()


def get_user_by_id(user_id):
    db = get_db()
    with db.cursor() as cur:
        cur.execute(
            "SELECT id, name, email, role, created_at FROM users WHERE id=%s",
            (user_id,)
        )
        return cur.fetchone()


def create_user(name, email, password_hash, role="WAREHOUSE_STAFF"):
    db = get_db()
    with db.cursor() as cur:
        cur.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (%s,%s,%s,%s)",
            (name, email, password_hash, role)
        )
        new_id = cur.lastrowid
    db.commit()
    return new_id


def update_password(email, new_hash):
    db = get_db()
    with db.cursor() as cur:
        cur.execute(
            "UPDATE users SET password_hash=%s WHERE email=%s",
            (new_hash, email)
        )
    db.commit()


# ── OTP helpers ─────────────────────────────────────────────────────────────

def save_otp(email, otp):
    db = get_db()
    with db.cursor() as cur:
        cur.execute(
            "UPDATE otp_tokens SET used=1 WHERE email=%s", (email,)
        )
        cur.execute(
            """
            INSERT INTO otp_tokens (email, otp, expires_at)
            VALUES (%s, %s, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
            """,
            (email, otp)
        )
    db.commit()


def get_valid_otp(email, otp):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            SELECT * FROM otp_tokens
            WHERE email=%s AND otp=%s AND used=0
              AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        """, (email, otp))
        return cur.fetchone()


def mark_otp_used(otp_id):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("UPDATE otp_tokens SET used=1 WHERE id=%s", (otp_id,))
    db.commit()


def invalidate_otps(email):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("UPDATE otp_tokens SET used=1 WHERE email=%s AND used=0", (email,))
    db.commit()
