// ──────────────────────────────────────────────────────────
// src/components/Navbar.jsx — Top navigation bar with persona indicator
// ──────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar({ onMenuToggle }) {
  const { user, isStaff, isManager, switchRole, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    logoutUser();
    navigate("/login");
  }

  function handleToggleRole() {
    switchRole(isStaff ? "Inventory Manager" : "Warehouse Staff");
    setDropdownOpen(false);
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <span className="navbar-menu-icon">☰</span>
        </button>
        <div className="navbar-title-group">
          <h1 className="navbar-page-title">StockSense</h1>
          <span className={`navbar-role-pill ${isStaff ? "pill--staff" : "pill--manager"}`}>
            {isStaff ? "👷 Warehouse Staff" : "👨‍💼 Inventory Manager"}
          </span>
        </div>
      </div>

      <div className="navbar-right" ref={dropdownRef}>
        <div
          className="navbar-profile"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          role="button"
          tabIndex={0}
        >
          <div className={`navbar-avatar ${isStaff ? "avatar--staff" : "avatar--manager"}`}>
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.name || "User"}</span>
            <span className="navbar-user-role">{user?.role || "Staff"}</span>
          </div>
          <span className="navbar-chevron">▾</span>
        </div>

        {dropdownOpen && (
          <div className="navbar-dropdown">
            <div className="navbar-dropdown-header">
              <div className="dropdown-user-name">{user?.name}</div>
              <div className="dropdown-user-email">{user?.email}</div>
              <div className="dropdown-role-desc">
                {isStaff
                  ? "Transfers, Picking, Shelving & Counting"
                  : "Incoming/Outgoing Stock & Catalog"}
              </div>
            </div>

            <div className="navbar-dropdown-divider" />

            {/* Quick Demo Role Switcher */}
            <button
              className="navbar-dropdown-item navbar-dropdown-item--switch"
              onClick={handleToggleRole}
            >
              <span>⇄</span> Switch to {isStaff ? "Inventory Manager" : "Warehouse Staff"}
            </button>

            <button
              className="navbar-dropdown-item"
              onClick={() => {
                navigate("/profile");
                setDropdownOpen(false);
              }}
            >
              👤 My Profile
            </button>

            <div className="navbar-dropdown-divider" />

            <button
              className="navbar-dropdown-item navbar-dropdown-item--danger"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
