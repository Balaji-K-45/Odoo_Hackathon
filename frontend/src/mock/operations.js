// ──────────────────────────────────────────────────────────
// Mock Operations Data (Receipts, Deliveries, Transfers, Adjustments)
// ──────────────────────────────────────────────────────────

export const mockReceipts = [
  {
    id: "REC-001",
    supplier: "ABC Metals",
    product: "Steel Rod",
    product_id: 1,
    quantity: 100,
    uom: "kg",
    warehouse: "Main Warehouse",
    warehouse_id: 1,
    status: "done",
    date: "2026-09-25",
  },
  {
    id: "REC-002",
    supplier: "FurnishCo",
    product: "Office Chair",
    product_id: 2,
    quantity: 50,
    uom: "pcs",
    warehouse: "Warehouse 2",
    warehouse_id: 2,
    status: "done",
    date: "2026-09-24",
  },
  {
    id: "REC-003",
    supplier: "ABC Metals",
    product: "Copper Wire",
    product_id: 3,
    quantity: 200,
    uom: "m",
    warehouse: "Main Warehouse",
    warehouse_id: 1,
    status: "waiting",
    date: "2026-09-26",
  },
];

export const mockDeliveries = [
  {
    id: "DEL-001",
    customer: "Tata Industries",
    product: "Steel Rod",
    product_id: 1,
    quantity: 10,
    uom: "kg",
    warehouse: "Main Warehouse",
    warehouse_id: 1,
    status: "done",
    date: "2026-09-25",
  },
  {
    id: "DEL-002",
    customer: "InfoTech Ltd",
    product: "Office Chair",
    product_id: 2,
    quantity: 5,
    uom: "pcs",
    warehouse: "Warehouse 2",
    warehouse_id: 2,
    status: "ready",
    date: "2026-09-26",
  },
];

export const mockTransfers = [
  {
    id: "TRF-001",
    product: "Steel Rod",
    product_id: 1,
    quantity: 30,
    source: "Main Warehouse",
    source_id: 1,
    destination: "Production Rack",
    destination_id: 3,
    status: "done",
    date: "2026-09-25",
  },
];

export const mockAdjustments = [
  {
    id: "ADJ-001",
    product: "Steel Rod",
    product_id: 1,
    location: "Production Rack",
    location_id: 3,
    system_qty: 20,
    physical_qty: 18,
    difference: -2,
    reason: "Damaged during handling",
    status: "done",
    date: "2026-09-25",
  },
];
