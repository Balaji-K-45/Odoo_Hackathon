// ──────────────────────────────────────────────────────────
// src/services/warehouseApi.js — Warehouses & Locations API service
// ──────────────────────────────────────────────────────────

import { apiGet, apiPost } from "./api";
import { mockWarehouses, mockLocations } from "../mock/dashboard";

const USE_MOCK = true;
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
  if (USE_MOCK) {
    await delay(300);
    return { success: true, data: [..._warehouses] };
  }
  return apiGet("/api/warehouses");
}

/**
 * Register a new warehouse (Manager only).
 */
export async function createWarehouse(data) {
  if (USE_MOCK) {
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
  return apiPost("/api/warehouses", data);
}

/**
 * Fetch all storage locations.
 */
export async function getLocations() {
  if (USE_MOCK) {
    await delay(300);
    return { success: true, data: [..._locations] };
  }
  return apiGet("/api/locations");
}

/**
 * Register a new storage location rack / shelf (Manager only).
 */
export async function createLocation(data) {
  if (USE_MOCK) {
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
  return apiPost("/api/locations", data);
}
