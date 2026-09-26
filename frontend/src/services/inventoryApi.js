// ──────────────────────────────────────────────────────────
// src/services/inventoryApi.js — Operations API service
// (Receipts, Deliveries, Transfers, Adjustments, Ledger)
// ──────────────────────────────────────────────────────────

import { apiGet, apiPost } from "./api";
import { mockReceipts, mockDeliveries, mockTransfers, mockAdjustments } from "../mock/operations";
import { mockLedger } from "../mock/ledger";

const USE_MOCK = true;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ── In-memory stores for demo ────────────────────────────
let _receipts    = [...mockReceipts];
let _deliveries  = [...mockDeliveries];
let _transfers   = [...mockTransfers];
let _adjustments = [...mockAdjustments];
let _ledger      = [...mockLedger];
let _recId  = _receipts.length + 1;
let _delId  = _deliveries.length + 1;
let _trfId  = _transfers.length + 1;
let _adjId  = _adjustments.length + 1;
let _ledId  = _ledger.length + 1;

// ── Receipts ─────────────────────────────────────────────
export async function getReceipts() {
  if (USE_MOCK) { await delay(400); return { success: true, data: [..._receipts] }; }
  return apiGet("/api/receipts");
}

export async function createReceipt(data) {
  if (USE_MOCK) {
    await delay(500);
    const rec = {
      id: `REC-${String(_recId++).padStart(3, "0")}`,
      ...data,
      status: "done",
      date: new Date().toISOString().slice(0, 10),
    };
    _receipts.unshift(rec);
    _ledger.unshift({
      id: _ledId++,
      date: new Date().toISOString(),
      product: data.product,
      product_id: data.product_id,
      operation: "receipt",
      source: `Supplier: ${data.supplier}`,
      destination: data.warehouse,
      quantity: data.quantity,
      change: `+${data.quantity}`,
      reference: rec.id,
      user: "Balaji K",
    });
    return { success: true, data: rec };
  }
  return apiPost("/api/receipts", data);
}

// ── Deliveries ───────────────────────────────────────────
export async function getDeliveries() {
  if (USE_MOCK) { await delay(400); return { success: true, data: [..._deliveries] }; }
  return apiGet("/api/deliveries");
}

export async function createDelivery(data) {
  if (USE_MOCK) {
    await delay(500);
    const del = {
      id: `DEL-${String(_delId++).padStart(3, "0")}`,
      ...data,
      status: "done",
      date: new Date().toISOString().slice(0, 10),
    };
    _deliveries.unshift(del);
    _ledger.unshift({
      id: _ledId++,
      date: new Date().toISOString(),
      product: data.product,
      product_id: data.product_id,
      operation: "delivery",
      source: data.warehouse,
      destination: `Customer: ${data.customer}`,
      quantity: data.quantity,
      change: `-${data.quantity}`,
      reference: del.id,
      user: "Balaji K",
    });
    return { success: true, data: del };
  }
  return apiPost("/api/deliveries", data);
}

export async function updateDeliveryStatus(id, newStatus) {
  if (USE_MOCK) {
    await delay(350);
    const del = _deliveries.find((d) => d.id === id);
    if (!del) throw new Error("Delivery order not found");
    del.status = newStatus;
    return { success: true, data: del };
  }
  return apiPost(`/api/deliveries/${id}/status`, { status: newStatus });
}


// ── Transfers ────────────────────────────────────────────
export async function getTransfers() {
  if (USE_MOCK) { await delay(400); return { success: true, data: [..._transfers] }; }
  return apiGet("/api/transfers");
}

export async function createTransfer(data) {
  if (USE_MOCK) {
    await delay(500);
    const trf = {
      id: `TRF-${String(_trfId++).padStart(3, "0")}`,
      ...data,
      status: "done",
      date: new Date().toISOString().slice(0, 10),
    };
    _transfers.unshift(trf);
    // Two ledger entries: source -qty, destination +qty
    _ledger.unshift(
      {
        id: _ledId++,
        date: new Date().toISOString(),
        product: data.product,
        product_id: data.product_id,
        operation: "transfer",
        source: data.source,
        destination: data.destination,
        quantity: data.quantity,
        change: `-${data.quantity}`,
        reference: trf.id,
        user: "Balaji K",
      },
      {
        id: _ledId++,
        date: new Date().toISOString(),
        product: data.product,
        product_id: data.product_id,
        operation: "transfer",
        source: data.source,
        destination: data.destination,
        quantity: data.quantity,
        change: `+${data.quantity}`,
        reference: trf.id,
        user: "Balaji K",
      }
    );
    return { success: true, data: trf };
  }
  return apiPost("/api/transfers", data);
}

// ── Adjustments ──────────────────────────────────────────
export async function getAdjustments() {
  if (USE_MOCK) { await delay(400); return { success: true, data: [..._adjustments] }; }
  return apiGet("/api/adjustments");
}

export async function createAdjustment(data) {
  if (USE_MOCK) {
    await delay(500);
    const diff = data.physical_qty - data.system_qty;
    const adj = {
      id: `ADJ-${String(_adjId++).padStart(3, "0")}`,
      ...data,
      difference: diff,
      status: "done",
      date: new Date().toISOString().slice(0, 10),
    };
    _adjustments.unshift(adj);
    _ledger.unshift({
      id: _ledId++,
      date: new Date().toISOString(),
      product: data.product,
      product_id: data.product_id,
      operation: "adjustment",
      source: data.location,
      destination: "—",
      quantity: Math.abs(diff),
      change: `${diff >= 0 ? "+" : ""}${diff}`,
      reference: adj.id,
      user: "Balaji K",
    });
    return { success: true, data: adj };
  }
  return apiPost("/api/adjustments", data);
}

// ── Single item getters and Stock endpoint ───────────────
export async function getReceipt(id) {
  if (USE_MOCK) {
    await delay(300);
    const rec = _receipts.find((r) => r.id === id);
    if (!rec) throw new Error("Receipt not found");
    return { success: true, data: rec };
  }
  return apiGet(`/api/receipts/${id}`);
}

export async function getDelivery(id) {
  if (USE_MOCK) {
    await delay(300);
    const del = _deliveries.find((d) => d.id === id);
    if (!del) throw new Error("Delivery order not found");
    return { success: true, data: del };
  }
  return apiGet(`/api/deliveries/${id}`);
}

export async function getTransfer(id) {
  if (USE_MOCK) {
    await delay(300);
    const trf = _transfers.find((t) => t.id === id);
    if (!trf) throw new Error("Transfer not found");
    return { success: true, data: trf };
  }
  return apiGet(`/api/transfers/${id}`);
}

export async function getStock() {
  if (USE_MOCK) {
    await delay(300);
    return { success: true, data: _ledger };
  }
  return apiGet("/api/stock");
}

// ── Stock Ledger / Move History ──────────────────────────
export async function getLedger() {
  if (USE_MOCK) { await delay(400); return { success: true, data: [..._ledger] }; }
  return apiGet("/api/ledger");
}

