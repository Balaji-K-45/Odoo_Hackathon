from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  # reads values from a .env file, if one exists

app = Flask(__name__)

# Allow the React dev server to call this backend
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "success", "message": "Backend is running"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)