// ──────────────────────────────────────────────────────────
// App.jsx — Main app component with backend health check
// ──────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { getHealth } from "./services/api";
import "./App.css";

function App() {
  // ── State ──────────────────────────────────────────────
  // "status" tracks where we are: loading → connected / error
  const [status, setStatus] = useState("loading");
  // "message" stores the text from the backend (or an error hint)
  const [message, setMessage] = useState("");

  // ── Effect: runs ONCE when the page first loads ────────
  useEffect(() => {
    getHealth()
      .then((data) => {
        // Success! The backend responded with JSON like:
        // { status: "success", message: "Backend is running" }
        setStatus("connected");
        setMessage(data.message);
      })
      .catch((err) => {
        // Something went wrong (backend not running, CORS error, etc.)
        setStatus("error");
        setMessage(err.message);
      });
  }, []); // ← empty array = run only once, not on every re-render

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Odoo Hackathon</h1>
        <p className="subtitle">Frontend ↔ Backend Connection Status</p>
      </header>

      <main className="status-card">
        {/* Loading state */}
        {status === "loading" && (
          <div className="status status-loading">
            <span className="status-icon spinner">⏳</span>
            <h2>Checking backend...</h2>
            <p>Trying to reach the Flask server</p>
          </div>
        )}

        {/* Connected state */}
        {status === "connected" && (
          <div className="status status-connected">
            <span className="status-icon">✅</span>
            <h2>Backend is connected</h2>
            <p className="backend-message">{message}</p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="status status-error">
            <span className="status-icon">❌</span>
            <h2>Backend is NOT connected</h2>
            <p className="error-message">{message}</p>
            <div className="hint">
              <h3>💡 How to fix:</h3>
              <ol>
                <li>Open a <strong>separate</strong> terminal</li>
                <li>Navigate to the backend folder</li>
                <li>
                  Run: <code>python app.py</code>
                </li>
                <li>
                  Check:{" "}
                  <a
                    href="http://localhost:5000/api/health"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    http://localhost:5000/api/health
                  </a>
                </li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Frontend: <code>localhost:5173</code> &nbsp;|&nbsp; Backend:{" "}
          <code>localhost:5000</code>
        </p>
      </footer>
    </div>
  );
}

export default App;
