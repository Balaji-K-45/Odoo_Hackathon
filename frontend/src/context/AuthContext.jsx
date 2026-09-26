// ──────────────────────────────────────────────────────────
// src/context/AuthContext.jsx — Authentication state & role context
// ──────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from "react";
import { DEMO_ACCOUNTS, ROLES } from "../services/authApi";

const AuthContext = createContext(null);

const STORAGE_KEY_TOKEN = "stocksense_token";
const STORAGE_KEY_USER  = "stocksense_user";

/**
 * Normalizes any role representation from backend/mock
 * to standard ROLES.INVENTORY_MANAGER or ROLES.WAREHOUSE_STAFF.
 */
export function normalizeRole(role) {
  if (!role) return "";
  const r = String(role).toUpperCase().replace(/[\s-]/g, "_");
  if (r.includes("MANAGER")) return ROLES.INVENTORY_MANAGER;
  if (r.includes("STAFF")) return ROLES.WAREHOUSE_STAFF;
  return r;
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUser  = localStorage.getItem(STORAGE_KEY_USER);
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error restoring user session", e);
      }
    }
    setLoading(false);
  }, []);

  function loginUser(token, userData) {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  }

  function logoutUser() {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    setToken(null);
    setUser(null);
  }

  // Quick switch role utility (handy during hackathon demo)
  function switchRole(targetRole) {
    const norm = normalizeRole(targetRole);
    const isStaff = norm === ROLES.WAREHOUSE_STAFF;
    const newProfile = isStaff ? DEMO_ACCOUNTS.staff : DEMO_ACCOUNTS.manager;
    loginUser(token || "mock-jwt-token-stocksense", newProfile);
  }

  const isAuthenticated = !!token;
  const role = normalizeRole(user?.role);
  const isManager = role === ROLES.INVENTORY_MANAGER;
  const isStaff = role === ROLES.WAREHOUSE_STAFF;

  // Frontend permissions (for UI rendering only — backend remains final authority)
  const canManageProducts = isManager;
  const canManageSettings = isManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isManager,
        isStaff,
        canManageProducts,
        canManageSettings,
        loading,
        loginUser,
        logoutUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
