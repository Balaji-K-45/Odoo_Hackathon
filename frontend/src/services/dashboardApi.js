// ──────────────────────────────────────────────────────────
// src/services/dashboardApi.js — Dashboard API service
// ──────────────────────────────────────────────────────────

import { apiGet } from "./api";
import { mockDashboardKPIs, mockRecentActivity, mockWarehouses, mockCategories } from "../mock/dashboard";

const USE_MOCK = true;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getDashboardKPIs() {
  if (USE_MOCK) {
    await delay(400);
    return { success: true, data: mockDashboardKPIs };
  }
  return apiGet("/api/dashboard");
}

export async function getRecentActivity() {
  if (USE_MOCK) {
    await delay(300);
    return { success: true, data: mockRecentActivity };
  }
  return apiGet("/api/dashboard/activity");
}

export async function getWarehouses() {
  if (USE_MOCK) {
    await delay(200);
    return { success: true, data: mockWarehouses };
  }
  return apiGet("/api/warehouses");
}

export async function getCategories() {
  if (USE_MOCK) {
    await delay(200);
    return { success: true, data: mockCategories };
  }
  return apiGet("/api/categories");
}
