// ──────────────────────────────────────────────────────────
// src/pages/Deliveries.jsx — Outgoing delivery orders (Pick, Pack, Validate)
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  Modal,
  Toast,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  StatusBadge,
  SearchBar,
} from "../components/ui";
import { getDeliveries, createDelivery } from "../services/inventoryApi";
import { getProducts } from "../services/productApi";
import { getLocations } from "../services/warehouseApi";
import "./Operations.css";

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts]     = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [toast, setToast]           = useState(null);

  // Create Delivery Modal
  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm] = useState({
    customer: "",
    product_id: "",
    product: "",
    quantity: "",
    uom: "pcs",
    location_id: "",
    warehouse: "",
  });
  const [formError, setFormError]   = useState("");
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [dRes, pRes, lRes] = await Promise.all([
        getDeliveries(),
        getProducts(),
        getLocations(),
      ]);
      setDeliveries(dRes.data || []);
      setProducts(pRes.data || []);
      setLocations(lRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(k, v) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "product_id") {
        const p = products.find((x) => x.id === Number(v));
        if (p) {
          next.product = p.name;
          next.uom = p.uom;
        }
      }
      if (k === "location_id") {
        const location = locations.find((x) => x.id === Number(v));
        if (location) next.warehouse = location.name;
      }
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    if (!form.customer || !form.product_id || !form.quantity || !form.location_id) {
      setFormError("All fields are required");
      return;
    }

    setSaving(true);
    try {
      await createDelivery({
        ...form,
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        location_id: Number(form.location_id),
      });
      setToast({
        message: `Delivery completed. Stock decreased by ${form.quantity} ${form.uom}.`,
        type: "success",
      });
      setModalOpen(false);
      setForm({
        customer: "",
        product_id: "",
        product: "",
        quantity: "",
        uom: "pcs",
        location_id: "",
        warehouse: "",
      });
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = deliveries.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.customer?.toLowerCase().includes(q) ||
      d.product?.toLowerCase().includes(q) ||
      d.id?.toLowerCase().includes(q) ||
      d.status?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingSpinner message="Loading deliveries..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Delivery Orders</h1>
          <p className="page-header-subtitle">Create a delivery and deduct stock after server-side availability checks</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => {
            setFormError("");
            setModalOpen(true);
          }}
        >
          + New Delivery Order
        </button>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search deliveries by customer, product, or status..."
          />
        </div>
        <div className="data-table-overflow">
          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="No delivery orders found" />
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.id}</strong>
                      </td>
                      <td>{d.customer}</td>
                      <td>{d.product}</td>
                      <td>
                        <span className="text-negative">-{d.quantity}</span> {d.uom}
                      </td>
                      <td>{d.warehouse}</td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td>{d.date}</td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Delivery Modal */}
      <Modal
        open={modalOpen}
        title="Create Outgoing Delivery Order"
        onClose={() => setModalOpen(false)}
        size="md"
      >
        <form onSubmit={handleSave}>
          {formError && (
            <div className="auth-error" style={{ marginBottom: 16 }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Customer / Recipient *</label>
            <input
              className="form-input"
              value={form.customer}
              onChange={(e) => updateField("customer", e.target.value)}
              placeholder="e.g. Tata Industries"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product to Deliver *</label>
              <select
                className="form-select"
                value={form.product_id}
                onChange={(e) => updateField("product_id", e.target.value)}
                required
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (In Stock: {p.stock} {p.uom})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Source Location *</label>
              <select
                className="form-select"
                value={form.location_id}
                onChange={(e) => updateField("location_id", e.target.value)}
                required
              >
                <option value="">Select location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.warehouse_name ? `${location.warehouse_name} / ` : ""}{location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity to Deliver *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={form.quantity}
                onChange={(e) => updateField("quantity", e.target.value)}
                placeholder="10"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit of Measure (UoM)</label>
              <input className="form-input" value={form.uom} readOnly />
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 24 }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              {saving ? "Creating Order..." : "Create Delivery Order"}
            </button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
