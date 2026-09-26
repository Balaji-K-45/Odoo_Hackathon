// ──────────────────────────────────────────────────────────
// src/pages/WarehouseSettings.jsx — Manage Warehouses & Locations (Manager Only)
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWarehouses,
  createWarehouse,
  getLocations,
  createLocation,
} from "../services/warehouseApi";
import { Modal, Toast, LoadingSpinner, ErrorMessage } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import "./Operations.css";

export default function WarehouseSettings() {
  const { isManager, canManageSettings } = useAuth();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [toast, setToast]           = useState(null);

  // Add Warehouse Modal
  const [whModalOpen, setWhModalOpen] = useState(false);
  const [whForm, setWhForm]           = useState({ name: "", code: "", address: "" });
  const [whSaving, setWhSaving]       = useState(false);

  // Add Location Modal
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [locForm, setLocForm]           = useState({ name: "", warehouseId: "" });
  const [locSaving, setLocSaving]       = useState(false);

  useEffect(() => {
    if (canManageSettings) {
      loadData();
    }
  }, [canManageSettings]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [wRes, lRes] = await Promise.all([getWarehouses(), getLocations()]);
      setWarehouses(wRes.data || []);
      setLocations(lRes.data || []);
    } catch (err) {
      if (err.status === 403 || err.isForbidden) {
        setError("You don't have permission for this action.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // If user is WAREHOUSE_STAFF, display dedicated HTTP 403 Forbidden page
  if (!canManageSettings) {
    return (
      <div className="forbidden-page-container">
        <div
          className="section-card forbidden-card"
          style={{
            maxWidth: 520,
            margin: "40px auto",
            textAlign: "center",
            padding: "36px 24px",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}>🚫</div>
          <span className="badge badge--danger" style={{ marginBottom: 14 }}>
            HTTP 403 Forbidden
          </span>
          <h2 style={{ fontSize: 20, margin: "0 0 10px", color: "var(--text-primary)" }}>
            You don't have permission for this action.
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              margin: "0 0 24px",
            }}
          >
            Warehouse and storage location configuration is restricted to{" "}
            <strong>Inventory Managers</strong>. Warehouse Staff members are assigned to floor
            operations (transfers, picking, shelving, and counting).
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn btn--primary" onClick={() => navigate("/dashboard")}>
              ← Return to Dashboard
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => navigate("/operations/transfers")}
            >
              Go to Transfers
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleAddWarehouse(e) {
    e.preventDefault();
    if (!whForm.name) return;
    setWhSaving(true);
    try {
      await createWarehouse(whForm);
      setToast({ message: `Warehouse "${whForm.name}" created successfully!`, type: "success" });
      setWhModalOpen(false);
      setWhForm({ name: "", code: "", address: "" });
      loadData();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setWhSaving(false);
    }
  }

  async function handleAddLocation(e) {
    e.preventDefault();
    if (!locForm.name || !locForm.warehouseId) return;
    setLocSaving(true);
    try {
      await createLocation(locForm);
      setToast({ message: `Location "${locForm.name}" added to warehouse!`, type: "success" });
      setLocModalOpen(false);
      setLocForm({ name: "", warehouseId: "" });
      loadData();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLocSaving(false);
    }
  }

  function getLocationsForWarehouse(whId) {
    return locations.filter((l) => l.warehouseId === whId);
  }

  if (loading) return <LoadingSpinner message="Loading warehouse configurations..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1>Warehouse Settings</h1>
            <span className="badge badge--primary">Manager Access</span>
          </div>
          <p className="page-header-subtitle">
            Configure warehouses, distribution hubs, and physical storage rack hierarchy
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn--secondary"
            onClick={() => {
              if (warehouses.length > 0) {
                setLocForm((prev) => ({ ...prev, warehouseId: String(warehouses[0].id) }));
              }
              setLocModalOpen(true);
            }}
          >
            + Add Rack / Shelf
          </button>
          <button className="btn btn--primary" onClick={() => setWhModalOpen(true)}>
            + Add Warehouse
          </button>
        </div>
      </div>

      {/* Storage Hierarchy Grid */}
      <div className="warehouse-grid">
        {warehouses.map((wh) => {
          const whLocations = getLocationsForWarehouse(wh.id);
          return (
            <div key={wh.id} className="warehouse-card section-card">
              <div className="warehouse-card-header">
                <div className="warehouse-card-icon">🏭</div>
                <div style={{ flex: 1 }}>
                  <h3 className="warehouse-card-name">{wh.name}</h3>
                  <span className="warehouse-card-count">
                    {whLocations.length} storage {whLocations.length === 1 ? "location" : "locations"}
                  </span>
                </div>
              </div>

              {/* Explicit Storage Hierarchy Visualization */}
              <div
                style={{
                  background: "var(--bg-body)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "16px",
                  fontFamily: "monospace",
                  fontSize: "13.5px",
                  lineHeight: "1.8",
                  color: "var(--text-primary)",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🏢</span> {wh.name}
                </div>
                {whLocations.length === 0 ? (
                  <div style={{ paddingLeft: "20px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    └── (no sub-locations configured)
                  </div>
                ) : (
                  whLocations.map((loc, idx) => {
                    const isLast = idx === whLocations.length - 1;
                    const branch = isLast ? "└──" : "├──";
                    return (
                      <div key={loc.id} style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: "12px" }}>
                        <span style={{ color: "var(--text-muted)" }}>{branch}</span>
                        <span>📍 {loc.name}</span>
                        {loc.type && (
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)", opacity: 0.8 }}>
                            ({loc.type})
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Warehouse */}
      <Modal open={whModalOpen} title="Register New Warehouse" onClose={() => setWhModalOpen(false)} size="md">
        <form onSubmit={handleAddWarehouse}>
          <div className="form-group">
            <label className="form-label">Warehouse Name *</label>
            <input
              className="form-input"
              value={whForm.name}
              onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
              placeholder="e.g. Central Logistics Hub"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Warehouse Code</label>
              <input
                className="form-input"
                value={whForm.code}
                onChange={(e) => setWhForm({ ...whForm, code: e.target.value })}
                placeholder="e.g. WH-CENTRAL"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Address / Location</label>
              <input
                className="form-input"
                value={whForm.address}
                onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
                placeholder="e.g. Sector 18, Industrial Area"
              />
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn--ghost" onClick={() => setWhModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={whSaving}>
              {whSaving ? "Saving..." : "Create Warehouse"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Location Rack */}
      <Modal open={locModalOpen} title="Add Storage Rack / Shelf" onClose={() => setLocModalOpen(false)} size="md">
        <form onSubmit={handleAddLocation}>
          <div className="form-group">
            <label className="form-label">Location / Rack Name *</label>
            <input
              className="form-input"
              value={locForm.name}
              onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
              placeholder="e.g. Rack C / Aisle 4"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Assign to Warehouse *</label>
            <select
              className="form-select"
              value={locForm.warehouseId}
              onChange={(e) => setLocForm({ ...locForm, warehouseId: e.target.value })}
              required
            >
              <option value="">Select target warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn--ghost" onClick={() => setLocModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={locSaving}>
              {locSaving ? "Saving..." : "Add Storage Location"}
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
