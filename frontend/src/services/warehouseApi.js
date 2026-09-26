// ──────────────────────────────────────────────────────────
// src/services/warehouseApi.js — Warehouses & Locations API service
// ──────────────────────────────────────────────────────────

import { apiGet, apiPost, apiDelete, USE_MOCKS } from "./api";
import { mockWarehouses, mockLocations } from "../mock/dashboard";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// In-memory mock store for demo
let _warehouses = [...mockWarehouses];
let _locations  = [...mockLocations];
let _nextWhId   = _warehouses.length + 1;
let _nextLocId  = _locations.length + 1;

/**
 * Fetch all warehouses.
 */
export async function getWarehouses() {
  if (USE_MOCKS) {
    await delay(300);
    return { success: true, data: [..._warehouses] };
  }
  return apiGet("/api/warehouses");
}

/**
 * Register a new warehouse (Manager only).
 */
export async function createWarehouse(data) {
  if (USE_MOCKS) {
    await delay(400);
    const newWh = {
      id: _nextWhId++,
      name: data.name,
      code: data.code || `WH-${_nextWhId}`,
      address: data.address || "",
    };
    _warehouses.push(newWh);
    return { success: true, data: newWh };
  }
  return apiPost("/api/warehouses", { name: data.name });
}

export async function deleteWarehouse(id) {
  if (USE_MOCKS) {
    await delay(300);
    _warehouses = _warehouses.filter((warehouse) => warehouse.id !== Number(id));
    _locations = _locations.filter((location) => location.warehouseId !== Number(id));
    return { success: true, message: "Warehouse deleted" };
  }
  return apiDelete(`/api/warehouses/${id}`);
}

/**
 * Fetch all storage locations.
 */
export async function getLocations() {
  if (USE_MOCKS) {
    await delay(300);
    return { success: true, data: [..._locations] };
  }
  const response = await apiGet("/api/locations");
  return {
    ...response,
    data: response.data.map((location) => ({
      ...location,
      warehouseId: location.warehouse_id,
    })),
  };
}

/**
 * Register a new storage location rack / shelf (Manager only).
 */
export async function createLocation(data) {
  if (USE_MOCKS) {
    await delay(400);
    const newLoc = {
      id: _nextLocId++,
      name: data.name,
      warehouseId: Number(data.warehouseId),
      type: data.type || "internal",
    };
    _locations.push(newLoc);
    return { success: true, data: newLoc };
  }
  return apiPost("/api/locations", {
    name: data.name,
    warehouse_id: Number(data.warehouseId),
  });
}
