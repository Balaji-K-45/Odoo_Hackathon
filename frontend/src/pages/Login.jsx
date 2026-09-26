// ──────────────────────────────────────────────────────────
// src/pages/Login.jsx — Dual-Persona Login (Manager & Staff)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login, DEMO_ACCOUNTS } from "../services/authApi";
import { USE_MOCKS } from "../services/api";
import "./Auth.css";

export default function Login() {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [selectedRole, setSelectedRole] = useState("Inventory Manager");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const { loginUser }                 = useAuth();
  const navigate                      = useNavigate();

  // Instant one-click demo login for either target audience
  async function handleQuickLogin(accountKey) {
    setError("");
    setLoading(true);
    try {
      const demoAccount = DEMO_ACCOUNTS[accountKey];
      setEmail(demoAccount.email);
      setPassword(demoAccount.password);
      setSelectedRole(demoAccount.role);

      const res = await login(demoAccount.email, demoAccount.password, demoAccount.role);
      loginUser(res.token, res.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password, selectedRole);
      loginUser(res.token, res.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-brand">
          <span className="auth-logo">◈</span>
          <h1>StockSense</h1>
          <p>Inventory Management System</p>
        </div>

        <div className="auth-content">
          {USE_MOCKS && <>
          {/* Target Audience Quick Login Banner */}
          <div className="demo-roles-section">
            <div className="demo-roles-header">
              <span className="demo-roles-badge">⚡ Quick Demo Login</span>
              <p className="demo-roles-desc">Select a target audience role to test the workflow:</p>
            </div>

            <div className="demo-role-cards">
              {/* Persona 1: Inventory Manager */}
              <button
                type="button"
                className={`demo-role-card ${selectedRole === "Inventory Manager" ? "demo-role-card--active" : ""}`}
                onClick={() => handleQuickLogin("manager")}
                disabled={loading}
              >
                <div className="demo-role-top">
                  <span className="demo-role-avatar">👨‍💼</span>
                  <div className="demo-role-meta">
                    <strong className="demo-role-title">Inventory Manager</strong>
                    <span className="badge badge--primary">Incoming &amp; Outgoing</span>
                  </div>
                </div>
                <p className="demo-role-text">
                  Manage incoming receipts, outgoing delivery orders, and overall stock catalog.
                </p>
                <span className="demo-role-action">Sign In as Manager →</span>
              </button>

              {/* Persona 2: Warehouse Staff */}
              <button
                type="button"
                className={`demo-role-card ${selectedRole === "Warehouse Staff" ? "demo-role-card--active" : ""}`}
                onClick={() => handleQuickLogin("staff")}
                disabled={loading}
              >
                <div className="demo-role-top">
                  <span className="demo-role-avatar">👷</span>
                  <div className="demo-role-meta">
                    <strong className="demo-role-title">Warehouse Staff</strong>
                    <span className="badge badge--success">Floor Operations</span>
                  </div>
                </div>
                <p className="demo-role-text">
                  Perform internal transfers, picking, shelving, and inventory counts.
                </p>
                <span className="demo-role-action">Sign In as Staff →</span>
              </button>
            </div>
          </div>

          <div className="auth-divider">
            <span>or sign in with credentials</span>
          </div>
          </>}

          {/* Standard Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            {USE_MOCKS && <div className="form-group">
              <label className="form-label">Role</label>
              <div className="role-toggle-group">
                <button
                  type="button"
                  className={`role-toggle-btn ${selectedRole === "Inventory Manager" ? "active" : ""}`}
                  onClick={() => setSelectedRole("Inventory Manager")}
                >
                  👨‍💼 Inventory Manager
                </button>
                <button
                  type="button"
                  className={`role-toggle-btn ${selectedRole === "Warehouse Staff" ? "active" : ""}`}
                  onClick={() => setSelectedRole("Warehouse Staff")}
                >
                  👷 Warehouse Staff
                </button>
              </div>
            </div>}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  selectedRole === "Inventory Manager"
                    ? "manager@stocksense.com"
                    : "staff@stocksense.com"
                }
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="auth-extras">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn--primary btn--lg auth-submit" disabled={loading}>
              {loading ? "Signing in..." : USE_MOCKS ? `Sign In as ${selectedRole}` : "Sign In"}
            </button>

            <p className="auth-switch">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
