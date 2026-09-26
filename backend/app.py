"""
app.py
------
StockSense Flask application entry point.

Responsibilities:
  - Create the Flask app
  - Load environment variables
  - Configure CORS for the React frontend
  - Initialise the database
  - Register all route blueprints
  - Provide the /api/health check
"""

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from decimal import Decimal
import os

from flask.json.provider import DefaultJSONProvider


class StockSenseJSONProvider(DefaultJSONProvider):
    def default(self, value):
        if isinstance(value, Decimal):
            return float(value)
        return super().default(value)

# Load .env values (SECRET_KEY, etc.) before anything else
load_dotenv()

# ── Local imports ──────────────────────────────────────────────────────────
import database

# ── Create Flask app ───────────────────────────────────────────────────────
app = Flask(__name__)
app.json = StockSenseJSONProvider(app)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-change-me")

# ── CORS: allow the React dev server to call this backend ──────────────────
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    supports_credentials=True,
)

# ── Wire the database teardown into the app lifecycle ──────────────────────
database.init_app(app)

# ── Register blueprints (we'll uncomment each as we build them) ────────────
from routes.product_routes    import product_bp
from routes.category_routes   import category_bp
from routes.warehouse_routes  import warehouse_bp
from routes.receipt_routes    import receipt_bp
from routes.delivery_routes   import delivery_bp
from routes.transfer_routes   import transfer_bp
from routes.adjustment_routes import adjustment_bp
from routes.ledger_routes     import ledger_bp
from routes.dashboard_routes  import dashboard_bp
from routes.auth_routes       import auth_bp
from routes.stock_routes      import stock_bp
from routes.analysis_routes   import analysis_bp

app.register_blueprint(product_bp)
app.register_blueprint(category_bp)
app.register_blueprint(warehouse_bp)
app.register_blueprint(receipt_bp)
app.register_blueprint(delivery_bp)
app.register_blueprint(transfer_bp)
app.register_blueprint(adjustment_bp)
app.register_blueprint(ledger_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(stock_bp)
app.register_blueprint(analysis_bp)

# ── Health check ───────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status":  "success",
        "message": "StockSense backend is running",
    })


# ── Start ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Initialise DB tables on first run
    database.init_db()
    app.run(host="127.0.0.1", port=5000, debug=True)