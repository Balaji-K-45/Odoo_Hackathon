// ──────────────────────────────────────────────────────────
// src/pages/Dashboard.jsx — Inventory & Floor Operations Dashboard
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KPICard, LoadingSpinner, ErrorMessage, FilterSelect, StatusBadge } from "../components/ui";
import { getDashboardKPIs, getRecentActivity } from "../services/dashboardApi";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, isStaff, isManager } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis]         = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  // Filters
  const [docType, setDocType]     = useState("all");
  const [status, setStatus]       = useState("all");
  const [warehouse, setWarehouse] = useState("all");
  const [category, setCategory]   = useState("all");


  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [kpiRes, actRes] = await Promise.all([
        getDashboardKPIs(),
        getRecentActivity(),
      ]);
      setKpis(kpiRes.data);
      setActivity(actRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredActivity = activity.filter((a) => {
    if (docType !== "all" && a.type !== docType) return false;
    if (status !== "all" && a.status && a.status !== status) return false;
    if (warehouse !== "all" && a.warehouse && !a.warehouse.toLowerCase().includes(warehouse.toLowerCase())) return false;
    if (category !== "all" && a.category && a.category !== category) return false;
    return true;
  });

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  return (
    <div className="dashboard-page">
      {/* Target User Persona Banner */}
      <div className={`persona-callout ${isStaff ? "callout--staff" : "callout--manager"}`}>
        <div className="persona-callout-content">
          <div className="persona-callout-header">
            <span className="persona-callout-icon">{isStaff ? "👷" : "👨‍💼"}</span>
            <div>
              <h2 className="persona-callout-title">
                {isStaff ? "Warehouse Floor Workspace" : "Inventory Management Control"}
              </h2>
              <p className="persona-callout-desc">
                {isStaff
                  ? "Assigned Tasks: Perform internal transfers, picking, shelving, and physical stock counting."
                  : "Assigned Tasks: Manage incoming stock receipts, outgoing deliveries, and catalog valuation."}
              </p>
            </div>
          </div>

          {/* Quick Action Shortcuts tailored to role */}
          <div className="persona-quick-actions">
            {isStaff ? (
              <>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => navigate("/operations/transfers")}
                >
                  🔄 New Transfer (Picking / Shelving)
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => navigate("/operations/adjustments")}
                >
                  📋 Stock Count (Adjustment)
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => navigate("/operations/history")}
                >
                  📜 View Move History
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => navigate("/operations/receipts")}
                >
                  📥 New Receipt (Incoming)
                </button>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => navigate("/operations/deliveries")}
                >
                  📤 New Delivery (Outgoing)
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => navigate("/products")}
                >
                  📦 Product Catalog
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h1>Overview Dashboard</h1>
          <p className="page-header-subtitle">
            {isStaff
              ? "Live overview of stock movements and pending warehouse tasks"
              : "Complete inventory health, pending shipments, and stock balances"}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-kpis">
        <KPICard
          icon="📦"
          title="Total Products"
          value={kpis.totalProducts}
          color="primary"
          subtitle="Catalog items"
        />
        <KPICard
          icon="📊"
          title="Total Stock"
          value={kpis.totalStock ?? 3420}
          color="primary"
          subtitle="On-hand units"
        />
        <KPICard
          icon="⚠️"
          title="Low Stock"
          value={kpis.lowStock}
          color="warning"
          subtitle="Below reorder level"
        />
        <KPICard
          icon="🚫"
          title="Out of Stock"
          value={kpis.outOfStock}
          color="danger"
          subtitle="Requires replenishment"
        />
        <KPICard
          icon="📥"
          title="Pending Receipts"
          value={kpis.pendingReceipts}
          color="success"
          subtitle={isManager ? "Supplier shipments" : "Dock arrivals"}
        />
        <KPICard
          icon="📤"
          title="Pending Deliveries"
          value={kpis.pendingDeliveries}
          color="danger"
          subtitle={isManager ? "Customer orders" : "Packing queue"}
        />
        <KPICard
          icon="🔄"
          title="Internal Transfers"
          value={kpis.scheduledTransfers}
          color="info"
          subtitle={isStaff ? "Active picking tasks" : "Scheduled moves"}
        />
      </div>

      {/* 4 Dashboard Filters: Document Type, Status, Warehouse, Category */}
      <div className="dashboard-filters">
        <FilterSelect
          label="Document Type"
          value={docType}
          onChange={setDocType}
          options={[
            { value: "all", label: "All Document Types" },
            { value: "receipt", label: "Receipts (Incoming)" },
            { value: "delivery", label: "Deliveries (Outgoing)" },
            { value: "transfer", label: "Transfers (Internal)" },
            { value: "adjustment", label: "Adjustments (Counts)" },
          ]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "draft", label: "Draft" },
            { value: "waiting", label: "Waiting Availability" },
            { value: "ready", label: "Ready" },
            { value: "done", label: "Done" },
            { value: "canceled", label: "Canceled" },
          ]}
        />
        <FilterSelect
          label="Warehouse / Location"
          value={warehouse}
          onChange={setWarehouse}
          options={[
            { value: "all", label: "All Warehouses" },
            { value: "Main Warehouse", label: "Main Warehouse" },
            { value: "Warehouse 2", label: "Warehouse 2" },
            { value: "Production Rack", label: "Production Rack" },
          ]}
        />
        <FilterSelect
          label="Product Category"
          value={category}
          onChange={setCategory}
          options={[
            { value: "all", label: "All Categories" },
            { value: "Raw Material", label: "Raw Material" },
            { value: "Furniture", label: "Furniture" },
            { value: "Packaging", label: "Packaging" },
            { value: "Electronics", label: "Electronics" },
          ]}
        />
      </div>

      {/* Recent Activity: date, product, operation, reference, location, quantity change, status */}
      <div className="section-card">
        <div className="section-card-header">
          <h3 className="section-card-title">Recent Stock Operations &amp; Ledger</h3>
        </div>
        <div className="data-table-overflow">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Operation</th>
                <th>Reference</th>
                <th>Location</th>
                <th>Quantity Change</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivity.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-muted)",
                    }}
                  >
                    No activity found matching selected filters
                  </td>
                </tr>
              ) : (
                filteredActivity.map((a) => {
                  const op = a.operation || a.type;
                  const qtyChange = a.change || (a.qty >= 0 ? `+${a.qty}` : `${a.qty}`);
                  const isPositive = qtyChange.startsWith("+");
                  return (
                    <tr key={a.id}>
                      <td style={{ fontSize: 13, whiteSpace: "nowrap" }}>{a.date}</td>
                      <td style={{ fontWeight: 600 }}>{a.product}</td>
                      <td>
                        <span
                          className={`status-badge status-badge--${
                            op === "receipt"
                              ? "success"
                              : op === "delivery"
                              ? "danger"
                              : op === "transfer"
                              ? "warning"
                              : "default"
                          }`}
                        >
                          {op}
                        </span>
                      </td>
                      <td>
                        <code
                          style={{
                            fontSize: 12,
                            background: "var(--bg-body)",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {a.reference || `REF-${a.id}`}
                        </code>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                          📍 {a.location || a.warehouse || "Main Warehouse"}
                        </span>
                      </td>
                      <td>
                        <strong
                          className={isPositive ? "text-positive" : "text-negative"}
                          style={{ fontSize: 14 }}
                        >
                          {qtyChange}
                        </strong>
                      </td>
                      <td>
                        <StatusBadge status={a.status || "done"} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
