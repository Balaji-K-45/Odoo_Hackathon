// ──────────────────────────────────────────────────────────
// src/pages/Signup.jsx — Sign-up page with target audience roles
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/authApi";
import "./Auth.css";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Warehouse Staff",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: form.name,
        email: form.email,
        role: form.role,
        password: form.password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">◈</span>
          <h1>StockSense</h1>
          <p>Create your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Sign Up</h2>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Alex Rivera"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Role</label>
            <div className="role-toggle-group">
              <button
                type="button"
                className={`role-toggle-btn ${form.role === "Inventory Manager" ? "active" : ""}`}
                onClick={() => update("role", "Inventory Manager")}
              >
                👨‍💼 Manager
              </button>
              <button
                type="button"
                className={`role-toggle-btn ${form.role === "Warehouse Staff" ? "active" : ""}`}
                onClick={() => update("role", "Warehouse Staff")}
              >
                👷 Warehouse Staff
              </button>
            </div>
            <span className="form-help-text">
              {form.role === "Inventory Manager"
                ? "Oversee receipts, deliveries, inventory valuation and catalog."
                : "Execute transfers, picking, shelving, and physical stock counts."}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@company.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn--primary btn--lg auth-submit" disabled={loading}>
            {loading ? "Creating account..." : `Sign Up as ${form.role}`}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
