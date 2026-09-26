// ──────────────────────────────────────────────────────────
// src/components/DemoFlowGuide.jsx — Interactive Hackathon Demo Flow Checklist
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./DemoFlowGuide.css";

const DEMO_STEPS = [
  {
    step: 1,
    title: "Create Product: Steel Rod",
    desc: "Register product with SKU 'STL001' and category 'Raw Material'.",
    path: "/products",
    badge: "Products",
  },
  {
    step: 2,
    title: "Receive 100 kg Stock",
    desc: "Create incoming receipt from supplier → Stock increases to 100.",
    path: "/operations/receipts",
    badge: "Receipts",
  },
  {
    step: 3,
    title: "Transfer 30 kg Internal",
    desc: "Move 30 kg from Main Warehouse (70) to Production Rack (30).",
    path: "/operations/transfers",
    badge: "Transfers",
  },
  {
    step: 4,
    title: "Deliver 10 kg (Pick → Pack → Validate)",
    desc: "Fulfill customer order from Production Rack (20 remaining).",
    path: "/operations/deliveries",
    badge: "Deliveries",
  },
  {
    step: 5,
    title: "Physical Count: 18 kg (Diff: -2)",
    desc: "Audit count reveals 18 kg. Post adjustment for -2 kg difference.",
    path: "/operations/adjustments",
    badge: "Adjustments",
  },
  {
    step: 6,
    title: "Verify Stock Ledger in Move History",
    desc: "Inspect full double-entry ledger of all transactions.",
    path: "/operations/history",
    badge: "Ledger",
  },
];

export default function DemoFlowGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([1, 2, 3, 4, 5, 6]);
  const navigate = useNavigate();
  const location = useLocation();

  function toggleStep(stepNum, e) {
    e.stopPropagation();
    setCompletedSteps((prev) =>
      prev.includes(stepNum) ? prev.filter((s) => s !== stepNum) : [...prev, stepNum]
    );
  }

  function handleNavigate(path) {
    navigate(path);
  }

  return (
    <div className="demo-guide-container">
      {isOpen ? (
        <div className="demo-guide-card">
          <div className="demo-guide-header">
            <div className="demo-guide-title-row">
              <span className="demo-guide-icon">🎯</span>
              <div>
                <strong className="demo-guide-title">Hackathon Demo Flow</strong>
                <span className="demo-guide-subtitle">Section 20 Live Presentation Guide</span>
              </div>
            </div>
            <button
              className="demo-guide-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close Guide"
            >
              ✕
            </button>
          </div>

          <div className="demo-guide-steps">
            {DEMO_STEPS.map((s) => {
              const isCurrent = location.pathname === s.path;
              const isDone = completedSteps.includes(s.step);

              return (
                <div
                  key={s.step}
                  className={`demo-guide-step ${isCurrent ? "current" : ""} ${
                    isDone ? "done" : ""
                  }`}
                  onClick={() => handleNavigate(s.path)}
                >
                  <button
                    type="button"
                    className={`step-checkbox ${isDone ? "checked" : ""}`}
                    onClick={(e) => toggleStep(s.step, e)}
                    title="Toggle completed"
                  >
                    {isDone ? "✓" : s.step}
                  </button>

                  <div className="step-content">
                    <div className="step-header">
                      <span className="step-name">{s.title}</span>
                      <span className="step-badge">{s.badge}</span>
                    </div>
                    <p className="step-desc">{s.desc}</p>
                  </div>

                  {isCurrent && <span className="step-active-dot" title="Current Screen" />}
                </div>
              );
            })}
          </div>

          <div className="demo-guide-footer">
            <small>Click any step to instantly navigate to that page.</small>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="demo-guide-trigger"
          onClick={() => setIsOpen(true)}
          title="Open Hackathon Demo Flow Checklist"
        >
          <span className="trigger-icon">🎯</span>
          <span className="trigger-text">Demo Flow Guide</span>
          <span className="trigger-progress">6/6</span>
        </button>
      )}
    </div>
  );
}
