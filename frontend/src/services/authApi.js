// ──────────────────────────────────────────────────────────
// src/services/authApi.js — Authentication API service
// ──────────────────────────────────────────────────────────

import { apiPost, apiGet } from "./api";

// ── Flag: set to false once the backend auth endpoints are ready ──
const USE_MOCK = true;

// ── Role Constants ───────────────────────────────────────
export const ROLES = {
  INVENTORY_MANAGER: "INVENTORY_MANAGER",
  WAREHOUSE_STAFF: "WAREHOUSE_STAFF",
};

// ── Mock helpers ─────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const DEMO_ACCOUNTS = {
  manager: {
    id: 1,
    name: "Balaji K",
    email: "manager@stocksense.com",
    password: "password123",
    role: ROLES.INVENTORY_MANAGER,
    displayRole: "Inventory Manager",
    badge: "Manager",
    badgeColor: "primary",
    tagline: "Manage incoming & outgoing stock",
    scope: "Products CRUD, Receipts, Deliveries, Warehouse Settings",
    avatar: "👨‍💼",
  },
  staff: {
    id: 2,
    name: "Alex Rivera",
    email: "staff@stocksense.com",
    password: "password123",
    role: ROLES.WAREHOUSE_STAFF,
    displayRole: "Warehouse Staff",
    badge: "Warehouse Staff",
    badgeColor: "success",
    tagline: "Perform transfers, picking, shelving & counting",
    scope: "Dashboard, View-only Products, Receipts, Deliveries, Transfers, Adjustments, History",
    avatar: "👷",
  },
};

const MOCK_TOKEN = "mock-jwt-token-stocksense";

// ── Public API ───────────────────────────────────────────

export async function login(email, password, roleHint) {
  if (USE_MOCK) {
    await delay(450);
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedHint = (roleHint || "").toUpperCase().replace(/[\s-]/g, "_");

    // Check if matching predefined demo accounts
    if (
      normalizedEmail.includes("staff") ||
      normalizedHint === ROLES.WAREHOUSE_STAFF ||
      roleHint === "Warehouse Staff"
    ) {
      return {
        success: true,
        token: `${MOCK_TOKEN}-staff`,
        user: DEMO_ACCOUNTS.staff,
      };
    }

    if (
      normalizedEmail.includes("manager") ||
      normalizedEmail.includes("balaji") ||
      normalizedHint === ROLES.INVENTORY_MANAGER ||
      roleHint === "Inventory Manager"
    ) {
      return {
        success: true,
        token: `${MOCK_TOKEN}-manager`,
        user: DEMO_ACCOUNTS.manager,
      };
    }

    // Default if any valid email and password provided
    if (email && password) {
      const isStaff =
        normalizedEmail.includes("staff") ||
        normalizedHint === ROLES.WAREHOUSE_STAFF ||
        roleHint === "Warehouse Staff";

      const baseAccount = isStaff ? DEMO_ACCOUNTS.staff : DEMO_ACCOUNTS.manager;
      return {
        success: true,
        token: MOCK_TOKEN,
        user: {
          ...baseAccount,
          email: normalizedEmail,
          name: email.split("@")[0],
        },
      };
    }

    throw new Error("Invalid email or password");
  }

  return apiPost("/api/auth/login", { email, password });
}

export async function signup(data) {
  if (USE_MOCK) {
    await delay(500);
    const isStaff =
      (data.role || "").toUpperCase().includes("STAFF") || data.role === "Warehouse Staff";
    return {
      success: true,
      message: "Account created successfully",
      user: {
        id: Date.now(),
        name: data.name,
        email: data.email,
        role: isStaff ? ROLES.WAREHOUSE_STAFF : ROLES.INVENTORY_MANAGER,
        displayRole: isStaff ? "Warehouse Staff" : "Inventory Manager",
      },
    };
  }
  return apiPost("/api/auth/signup", data);
}

export async function forgotPassword(email) {
  if (USE_MOCK) {
    await delay(400);
    return { success: true, message: "OTP sent to your email" };
  }
  return apiPost("/api/auth/forgot-password", { email });
}

export async function verifyOtp(email, otp) {
  if (USE_MOCK) {
    await delay(400);
    if (otp === "123456") {
      return { success: true, message: "OTP verified" };
    }
    throw new Error("Invalid OTP (use 123456 for demo)");
  }
  return apiPost("/api/auth/verify-otp", { email, otp });
}

export async function resetPassword(email, otp, newPassword) {
  if (USE_MOCK) {
    await delay(400);
    return { success: true, message: "Password reset successfully" };
  }
  return apiPost("/api/auth/reset-password", { email, otp, new_password: newPassword });
}

export async function getProfile() {
  if (USE_MOCK) {
    await delay(200);
    return { success: true, user: DEMO_ACCOUNTS.manager };
  }
  return apiGet("/api/auth/me");
}

export async function getMe() {
  return getProfile();
}
