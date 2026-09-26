// ──────────────────────────────────────────────────────────
// src/services/dashboardApi.js — Dashboard API service
// ──────────────────────────────────────────────────────────

import { apiGet, USE_MOCKS } from "./api";
import { mockDashboardKPIs, mockRecentActivity, mockWarehouses, mockCategories } from "../mock/dashboard";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getDashboardKPIs() {
  if (USE_MOCKS) {
    await delay(400);
    return { success: true, data: mockDashboardKPIs };
  }
  const response = await apiGet("/api/dashboard");
  const dashboard = response.data;
  return {
    ...response,
    data: {
      totalProducts: dashboard.total_products,
      totalStock: dashboard.total_stock,
      lowStock: dashboard.low_stock_items,
      outOfStock: dashboard.out_of_stock_items,
      pendingReceipts: dashboard.pending_receipts,
      pendingDeliveries: dashboard.pending_deliveries,
      scheduledTransfers: dashboard.pending_transfers,
    },
  };
}

export async function getRecentActivity() {
  if (USE_MOCKS) {
    await delay(300);
    return { success: true, data: mockRecentActivity };
  }
  return apiGet("/api/ledger?limit=10").then((response) => ({
    ...response,
    data: response.data.map((entry) => ({
      id: entry.id,
      date: entry.created_at,
      product: entry.product_name,
      operation: entry.operation_type.toLowerCase(),
      type: entry.operation_type.toLowerCase(),
      reference: entry.reference || `OP-${entry.operation_id}`,
      location: entry.location_name,
      warehouse: entry.warehouse_name,
      category: entry.category_name,
      status: entry.status || "done",
      qty: Number(entry.quantity_change),
      change: Number(entry.quantity_change) > 0 ? `+${entry.quantity_change}` : `${entry.quantity_change}`,
    })),
  }));
}

export async function getWarehouses() {
  if (USE_MOCKS) {
    await delay(200);
    return { success: true, data: mockWarehouses };
  }
  return apiGet("/api/warehouses");
}

export async function getCategories() {
  if (USE_MOCKS) {
    await delay(200);
    return { success: true, data: mockCategories };
  }
  return apiGet("/api/categories");
}
