// ──────────────────────────────────────────────────────────
// Mock Dashboard Data
// ──────────────────────────────────────────────────────────

export const mockDashboardKPIs = {
  totalProducts: 48,
  totalStock: 3420,
  lowStock: 7,
  outOfStock: 2,
  pendingReceipts: 5,
  pendingDeliveries: 3,
  scheduledTransfers: 4,
};

export const mockRecentActivity = [
  {
    id: 1,
    type: "receipt",
    operation: "receipt",
    product: "Steel Rod",
    reference: "REC-001",
    location: "Main Warehouse",
    qty: 100,
    change: "+100",
    status: "done",
    date: "2026-09-25",
    user: "Balaji K",
    warehouse: "Main Warehouse",
    category: "Raw Material",
  },
  {
    id: 2,
    type: "transfer",
    operation: "transfer",
    product: "Steel Rod",
    reference: "TRF-001",
    location: "Production Rack",
    qty: 30,
    change: "+30",
    status: "done",
    date: "2026-09-25",
    user: "Balaji K",
    warehouse: "Main Warehouse",
    category: "Raw Material",
  },
  {
    id: 3,
    type: "delivery",
    operation: "delivery",
    product: "Steel Rod",
    reference: "DEL-001",
    location: "Production Rack",
    qty: -10,
    change: "-10",
    status: "ready",
    date: "2026-09-25",
    user: "Ravi M",
    warehouse: "Main Warehouse",
    category: "Raw Material",
  },
  {
    id: 4,
    type: "adjustment",
    operation: "adjustment",
    product: "Office Chair",
    reference: "ADJ-001",
    location: "Warehouse 2",
    qty: -2,
    change: "-2",
    status: "done",
    date: "2026-09-25",
    user: "Ravi M",
    warehouse: "Warehouse 2",
    category: "Furniture",
  },
  {
    id: 5,
    type: "receipt",
    operation: "receipt",
    product: "Office Chair",
    reference: "REC-002",
    location: "Warehouse 2",
    qty: 50,
    change: "+50",
    status: "done",
    date: "2026-09-24",
    user: "Balaji K",
    warehouse: "Warehouse 2",
    category: "Furniture",
  },
];

export const mockWarehouses = [
  { id: 1, name: "Main Warehouse" },
  { id: 2, name: "Warehouse 2" },
];

export const mockLocations = [
  { id: 1, name: "Rack A",          warehouseId: 1 },
  { id: 2, name: "Rack B",          warehouseId: 1 },
  { id: 3, name: "Production Rack", warehouseId: 1 },
  { id: 4, name: "Rack A",          warehouseId: 2 },
  { id: 5, name: "Rack B",          warehouseId: 2 },
];

export const mockCategories = [
  { id: 1, name: "Raw Material" },
  { id: 2, name: "Furniture" },
  { id: 3, name: "Electronics" },
  { id: 4, name: "Packaging" },
];
