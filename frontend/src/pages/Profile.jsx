// ──────────────────────────────────────────────────────────
// src/pages/Profile.jsx — User profile & role specifications
// ──────────────────────────────────────────────────────────

import { useAuth } from "../context/AuthContext";
import "./Operations.css";

export default function Profile() {
  const { user, isStaff, isManager, switchRole } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Profile &amp; Role Details</h1>
          <p className="page-header-subtitle">Target persona configuration and system permissions</p>
        </div>
      </div>

      <div className="section-card" style={{ maxWidth: 560 }}>
        <div className="profile-header">
          <div className="profile-avatar">
            {isStaff ? "👷" : "👨‍💼"}
          </div>
          <div>
            <h2 className="profile-name">{user?.name || "User"}</h2>
            <span className="profile-role">
              {user?.role || "Inventory Manager"}
            </span>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-row">
            <span className="profile-label">Full Name</span>
            <span className="profile-value">{user?.name || "—"}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user?.email || "—"}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Target Role</span>
            <span className="profile-value" style={{ fontWeight: 600 }}>
              {user?.role || "—"}
            </span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Role Scope</span>
            <span className="profile-value">
              {isStaff
                ? "Transfers, Picking, Shelving, Physical Inventory Counting"
                : "Incoming & Outgoing Stock, Supplier Receipts, Delivery Orders, Product Catalog"}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--border-color)" }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>Role Description</h4>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px" }}>
            {isStaff
              ? "As Warehouse Staff, you are on the floor moving physical goods. You execute internal warehouse transfers (relocating goods between aisles/shelves), pick items for outgoing orders, stock new items on shelves, and perform cycle counts."
              : "As an Inventory Manager, you maintain operational oversight over the entire supply chain. You monitor stock levels, process incoming receipts from suppliers, validate customer delivery orders, set minimum stock rules, and manage warehouse locations."}
          </p>

          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => switchRole(isStaff ? "Inventory Manager" : "Warehouse Staff")}
          >
            Switch to {isStaff ? "Inventory Manager" : "Warehouse Staff"} Persona ⇄
          </button>
        </div>
      </div>
    </div>
  );
}
