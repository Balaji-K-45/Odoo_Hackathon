// ──────────────────────────────────────────────────────────
// src/services/inventoryApi.js — Operations API service
// (Receipts, Deliveries, Transfers, Adjustments, Ledger)
// ──────────────────────────────────────────────────────────

import { apiGet, apiPost, USE_MOCKS } from "./api";
import { mockReceipts, mockDeliveries, mockTransfers, mockAdjustments } from "../mock/operations";
import { mockLedger } from "../mock/ledger";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function mapOperation(operation) {
  const item = operation.items?.[0] || {};
  const type = operation.operation_type?.toLowerCase() || operation.type || operation.operation;
  const location = operation.destination_location_name || operation.source_location_name || operation.location_name || "";
  const quantityChange = Number(operation.quantity_change ?? 0);
  const notes = operation.notes || "";
  const labelValue = (label) => notes.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"))?.[1] || "";
  return {
    ...operation,
    id: String(operation.id),
    operation_id: operation.operation_id ?? operation.id,
    operation: type,
    type,
    date: operation.created_at || operation.date,
    product: operation.product_name || item.product_name || operation.product || "",
    uom: operation.uom || item.uom || "",
    location,
    warehouse: operation.warehouse_name || location,
    source: operation.source_location_name ||
      ((type === "delivery" || type === "transfer" || type === "adjustment") && quantityChange < 0 ? operation.location_name : ""),
    destination: operation.destination_location_name ||
      ((type === "receipt" || type === "transfer" || type === "adjustment") && quantityChange >= 0 ? operation.location_name : ""),
    supplier: operation.supplier || labelValue("Supplier"),
    customer: operation.customer || labelValue("Customer"),
    reason: operation.reason || labelValue("Reason") || notes,
    physical_qty: operation.physical_qty ?? operation.quantity ?? item.quantity,
    system_qty: operation.system_qty ?? (type === "adjustment"
      ? Number(operation.quantity ?? item.quantity ?? 0) - Number(operation.quantity_change ?? 0)
      : operation.quantity ?? item.quantity),
    difference: operation.difference ?? operation.quantity_change,
    change: operation.change ?? (operation.quantity_change > 0 ? `+${operation.quantity_change}` : `${operation.quantity_change}`),
    quantity: Math.abs(Number(operation.quantity ?? operation.quantity_change ?? 0)),
    reference: operation.reference || `OP-${operation.id}`,
    user: operation.user_name || operation.user || "",
  };
}

function mapResponse(response) {
  return { ...response, data: response.data.map(mapOperation) };
}

function toOperationRequest(data, type) {
  const request = { ...data };
  if (type === "receipt") {
    request.notes = request.notes || (data.supplier ? `Supplier: ${data.supplier}` : undefined);
  } else if (type === "delivery") {
    request.notes = request.notes || (data.customer ? `Customer: ${data.customer}` : undefined);
  } else if (type === "transfer") {
    request.source_location_id = request.source_location_id ?? data.source_id;
    request.destination_location_id = request.destination_location_id ?? data.destination_id;
  } else if (type === "adjustment") {
    request.physical_count = request.physical_count ?? data.physical_qty;
    request.notes = request.notes || (data.reason ? `Reason: ${data.reason}` : undefined);
  }
  [
    "product", "uom", "warehouse", "warehouse_id", "source", "destination",
    "source_id", "destination_id", "physical_qty", "system_qty", "reason",
    "customer", "supplier", "status",
  ].forEach((field) => delete request[field]);
  return request;
}

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
  if (USE_MOCKS) { await delay(400); return { success: true, data: [..._receipts] }; }
  return mapResponse(await apiGet("/api/receipts"));
}

export async function createReceipt(data) {
  if (USE_MOCKS) {
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
  return apiPost("/api/receipts", toOperationRequest(data, "receipt"));
}

// ── Deliveries ───────────────────────────────────────────
export async function getDeliveries() {
  if (USE_MOCKS) { await delay(400); return { success: true, data: [..._deliveries] }; }
  return mapResponse(await apiGet("/api/deliveries"));
}

export async function createDelivery(data) {
  if (USE_MOCKS) {
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
  return apiPost("/api/deliveries", toOperationRequest(data, "delivery"));
}

export async function updateDeliveryStatus(id, newStatus) {
  if (USE_MOCKS) {
    await delay(350);
    const del = _deliveries.find((d) => d.id === id);
    if (!del) throw new Error("Delivery order not found");
    del.status = newStatus;
    return { success: true, data: del };
  }
  throw new Error("The backend processes deliveries immediately and does not support status changes.");
}


// ── Transfers ────────────────────────────────────────────
export async function getTransfers() {
  if (USE_MOCKS) { await delay(400); return { success: true, data: [..._transfers] }; }
  return mapResponse(await apiGet("/api/transfers"));
}

export async function createTransfer(data) {
  if (USE_MOCKS) {
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
  return apiPost("/api/transfers", toOperationRequest(data, "transfer"));
}

// ── Adjustments ──────────────────────────────────────────
export async function getAdjustments() {
  if (USE_MOCKS) { await delay(400); return { success: true, data: [..._adjustments] }; }
  return mapResponse(await apiGet("/api/adjustments"));
}

export async function createAdjustment(data) {
  if (USE_MOCKS) {
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
  return apiPost("/api/adjustments", toOperationRequest(data, "adjustment"));
}

// ── Single item getters and Stock endpoint ───────────────
export async function getReceipt(id) {
  if (USE_MOCKS) {
    await delay(300);
    const rec = _receipts.find((r) => r.id === id);
    if (!rec) throw new Error("Receipt not found");
    return { success: true, data: rec };
  }
  const response = await apiGet(`/api/receipts/${id}`);
  return { ...response, data: mapOperation(response.data) };
}

export async function getDelivery(id) {
  if (USE_MOCKS) {
    await delay(300);
    const del = _deliveries.find((d) => d.id === id);
    if (!del) throw new Error("Delivery order not found");
    return { success: true, data: del };
  }
  const response = await apiGet(`/api/deliveries/${id}`);
  return { ...response, data: mapOperation(response.data) };
}

export async function getTransfer(id) {
  if (USE_MOCKS) {
    await delay(300);
    const trf = _transfers.find((t) => t.id === id);
    if (!trf) throw new Error("Transfer not found");
    return { success: true, data: trf };
  }
  const response = await apiGet(`/api/transfers/${id}`);
  return { ...response, data: mapOperation(response.data) };
}

export async function getStock() {
  if (USE_MOCKS) {
    await delay(300);
    return { success: true, data: _ledger };
  }
  return apiGet("/api/stock");
}

// ── Stock Ledger / Move History ──────────────────────────
export async function getLedger() {
  if (USE_MOCKS) { await delay(400); return { success: true, data: [..._ledger] }; }
  const response = await apiGet("/api/ledger");
  return { ...response, data: response.data.map(mapOperation) };
}

