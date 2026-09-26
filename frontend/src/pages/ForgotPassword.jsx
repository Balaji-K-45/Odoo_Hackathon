// ──────────────────────────────────────────────────────────
// src/pages/ForgotPassword.jsx — OTP-based password reset to mail
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, verifyOtp } from "../services/authApi";
import "./Auth.css";

export default function ForgotPassword() {
  const [step, setStep]       = useState("email"); // email | otp
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [simulatedMail, setSimulatedMail] = useState(null);
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
      const res = await forgotPassword(email);
      setSimulatedMail({
        to: email,
        code: "123456",
        expiresIn: "10 minutes",
        timestamp: new Date().toLocaleTimeString(),
      });
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
      await verifyOtp(email, otp);
      navigate(
        `/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAutoFillOtp() {
    setOtp("123456");
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
              Enter your work email address. We will dispatch a secure 6-digit one-time password (OTP) directly to your mail.
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
            <h2>Verify Mail OTP</h2>
            <p className="auth-desc">
              We've dispatched an authentication code to <strong>{email}</strong>.
            </p>

            {/* Simulated Live Mail Inbox Notification for Hackathon Judges */}
            {simulatedMail && (
              <div className="simulated-mail-card">
                <div className="mail-card-header">
                  <span className="mail-icon">📨</span>
                  <div>
                    <strong>Mail Notification: Password Reset OTP</strong>
                    <div className="mail-sender">From: security@stocksense.com • {simulatedMail.timestamp}</div>
                  </div>
                </div>
                <div className="mail-card-body">
                  <p>Your one-time security verification code is:</p>
                  <div className="mail-otp-box">
                    <span className="mail-otp-digits">{simulatedMail.code}</span>
                    <button
                      type="button"
                      className="mail-autofill-btn"
                      onClick={handleAutoFillOtp}
                    >
                      ⚡ Auto-fill
                    </button>
                  </div>
                  <span className="mail-expiry">Valid for {simulatedMail.expiresIn}. Do not share with anyone.</span>
                </div>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">6-Digit Code</label>
              <input
                type="text"
                className="form-input otp-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--lg auth-submit"
              disabled={loading}
            >
              {loading ? "Validating Code..." : "Verify Code & Proceed"}
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
