// ──────────────────────────────────────────────────────────
// src/pages/ForgotPassword.jsx — OTP-based password reset to mail
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, verifyOtp } from "../services/authApi";
import { loginWithOtp } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function ForgotPassword() {
  const [step, setStep]       = useState("email"); // email | otp
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your registered email address");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    if (!otp) {
      setError("Please enter the 6-digit OTP code");
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithOtp(email, otp);
      loginUser(result.token, result.user);
      navigate("/dashboard");
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
          <p>Secure Account Recovery</p>
        </div>

        {step === "email" ? (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <h2>Reset Password</h2>
            <p className="auth-desc">
              Enter the email address used for your account to continue to code verification.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@stocksense.com"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--lg auth-submit"
              disabled={loading}
            >
              {loading ? "Dispatching OTP to Mail..." : "Send OTP to Mail"}
            </button>

            <p className="auth-switch">
              <Link to="/login">← Back to Sign In</Link>
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <h2>Enter Verification Code</h2>
            <p className="auth-desc">
              Enter the 6-digit code for <strong>{email}</strong> to sign in.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">6-Digit Code</label>
              <input
                type="text"
                className="form-input otp-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--lg auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Verify Code & Sign In"}
            </button>

            <button
              type="button"
              className="auth-link-btn"
              disabled={loading}
              onClick={async () => {
                setError("");
                setLoading(true);
                try {
                  await verifyOtp(email, otp);
                  navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
                } catch (err) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Set a new password instead
            </button>

            <div className="auth-extras" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => setStep("email")}
              >
                ← Change Email or Resend
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
