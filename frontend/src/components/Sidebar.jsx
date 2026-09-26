// ──────────────────────────────────────────────────────────
// src/components/Sidebar.jsx — Role-based navigation sidebar
// ──────────────────────────────────────────────────────────

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { USE_MOCKS } from "../services/api";
import "./Sidebar.css";

export default function Sidebar({ isOpen, onClose }) {
  const { user, isStaff, canManageSettings, switchRole } = useAuth();

  // Navigation items per role specification:
  // Both roles see Dashboard, Products, Receipts, Deliveries, Transfers, Adjustments, Move History.
  // Warehouse Settings is visible ONLY to INVENTORY_MANAGER and hidden for WAREHOUSE_STAFF.
  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    {
      label: "Products",
      path: "/products",
      icon: "📦",
      badge: isStaff ? "View-only" : null,
    },
    ...(canManageSettings ? [{ label: "Analysis", path: "/analysis", icon: "📈" }] : []),

    { type: "divider", label: "Operations" },

    { label: "Receipts", path: "/operations/receipts", icon: "📥" },
    { label: "Deliveries", path: "/operations/deliveries", icon: "📤" },
    { label: "Transfers", path: "/operations/transfers", icon: "🔄" },
    { label: "Adjustments", path: "/operations/adjustments", icon: "📋" },
    { label: "Move History", path: "/operations/history", icon: "📜" },

    // Warehouse Settings: Show for INVENTORY_MANAGER, HIDE for WAREHOUSE_STAFF
    ...(canManageSettings
      ? [
          { type: "divider", label: "Administration" },
          { label: "Warehouse Settings", path: "/settings/warehouse", icon: "⚙️" },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <span className="sidebar-logo">◈</span>
          <div className="sidebar-brand-text">
            <h2 className="sidebar-title">StockSense</h2>
          </div>
        </div>

        {/* Current Active Persona Banner */}
        <div className={`sidebar-role-banner ${isStaff ? "role--staff" : "role--manager"}`}>
          <div className="role-banner-top">
            <span className="role-banner-avatar">{isStaff ? "👷" : "👨‍💼"}</span>
            <div className="role-banner-info">
              <span className="role-banner-label">Active Role</span>
              <strong className="role-banner-name">
                {isStaff ? "Warehouse Staff" : "Inventory Manager"}
              </strong>
            </div>
          </div>
          <p className="role-banner-scope">
            {isStaff
              ? "Transfers, Picking, Shelving & Physical Counting (View-only Catalog)"
              : "Incoming & Outgoing Stock, Full Product CRUD, Warehouse Settings"}
          </p>

          {/* Quick Demo Switcher button */}
          {USE_MOCKS && <button
            type="button"
            className="sidebar-role-switch-btn"
            onClick={() =>
              switchRole(isStaff ? "INVENTORY_MANAGER" : "WAREHOUSE_STAFF")
            }
            title="Click to quickly switch target user during demo"
          >
            Switch to {isStaff ? "Inventory Manager" : "Warehouse Staff"} ⇄
          </button>}
        </div>

        {/* Nav Links */}
        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.type === "divider" ? (
              <div key={i} className="sidebar-divider">
                <span>{item.label}</span>
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
                }
                onClick={onClose}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-label">{item.label}</span>
                {item.badge && (
                  <span className="sidebar-link-badge">{item.badge}</span>
                )}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-user">
            <span className="sidebar-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
            <div className="sidebar-user-text">
              <span className="sidebar-user-name">{user?.name || "Balaji K"}</span>
              <span className="sidebar-user-email">
                {user?.email || (isStaff ? "staff@stocksense.com" : "manager@stocksense.com")}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
