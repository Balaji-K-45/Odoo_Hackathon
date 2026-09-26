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
import { getDeliveries, createDelivery, updateDeliveryStatus } from "../services/inventoryApi";
import { getProducts } from "../services/productApi";
import { getWarehouses } from "../services/warehouseApi";
import { useAuth } from "../context/AuthContext";
import "./Operations.css";

export default function Deliveries() {
  const { user, isStaff, isManager } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts]     = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [toast, setToast]           = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Create Delivery Modal
  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm] = useState({
    customer: "",
    product_id: "",
    product: "",
    quantity: "",
    uom: "pcs",
    warehouse_id: "",
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
      const [dRes, pRes, wRes] = await Promise.all([
        getDeliveries(),
        getProducts(),
        getWarehouses(),
      ]);
      setDeliveries(dRes.data || []);
      setProducts(pRes.data || []);
      setWarehouses(wRes.data || []);
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
      if (k === "warehouse_id") {
        const w = warehouses.find((x) => x.id === Number(v));
        if (w) next.warehouse = w.name;
      }
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    if (!form.customer || !form.product_id || !form.quantity || !form.warehouse_id) {
      setFormError("All fields are required");
      return;
    }

    const prod = products.find((p) => p.id === Number(form.product_id));
    if (prod && Number(form.quantity) > prod.stock) {
      setFormError(
        `Insufficient stock available! Current stock: ${prod.stock} ${prod.uom}, requested: ${form.quantity} ${prod.uom}`
      );
      return;
    }

    setSaving(true);
    try {
      await createDelivery({
        ...form,
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        warehouse_id: Number(form.warehouse_id),
        status: "ready", // Ready to be Picked
      });
      setToast({
        message: `Delivery order created successfully! Stock reserved: -${form.quantity} ${form.uom}`,
        type: "success",
      });
      setModalOpen(false);
      setForm({
        customer: "",
        product_id: "",
        product: "",
        quantity: "",
        uom: "pcs",
        warehouse_id: "",
        warehouse: "",
      });
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Pick, Pack, Validate lifecycle steps
  async function handleAdvanceLifecycle(delivery, targetStatus) {
    setProcessingId(delivery.id);
    try {
      // Validate stock availability check
      const prod = products.find((p) => p.id === delivery.product_id || p.name === delivery.product);
      if (targetStatus === "done" && prod && prod.stock < delivery.quantity) {
        setToast({
          message: `Cannot validate: Insufficient stock! Available: ${prod.stock}, Needed: ${delivery.quantity}`,
          type: "error",
        });
        return;
      }

      await updateDeliveryStatus(delivery.id, targetStatus);
      const actionLabels = {
        picked: "Items picked from warehouse rack",
        packed: "Items packed for dispatch",
        done: "Delivery validated & stock deducted from inventory",
      };
      setToast({
        message: `${delivery.id}: ${actionLabels[targetStatus] || "Status updated"}`,
        type: "success",
      });
      loadData();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setProcessingId(null);
    }
  }

  const selectedProduct = products.find((p) => p.id === Number(form.product_id));
  const hasInsufficientStock =
    selectedProduct && form.quantity && Number(form.quantity) > selectedProduct.stock;

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
          <p className="page-header-subtitle">
            Ship products to customers with full Pick → Pack → Validate lifecycle
          </p>
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

      {/* Workflow Guidance Card */}
      <div className="delivery-workflow-card">
        <div className="workflow-steps">
          <div className="workflow-step active">
            <span className="step-num">1</span>
            <div>
              <strong>Order Ready</strong>
              <small>Stock allocated</small>
            </div>
          </div>
          <span className="step-arrow">→</span>
          <div className="workflow-step">
            <span className="step-num">2</span>
            <div>
              <strong>Pick</strong>
              <small>Staff collects items</small>
            </div>
          </div>
          <span className="step-arrow">→</span>
          <div className="workflow-step">
            <span className="step-num">3</span>
            <div>
              <strong>Pack</strong>
              <small>Parcel packaging</small>
            </div>
          </div>
          <span className="step-arrow">→</span>
          <div className="workflow-step">
            <span className="step-num">4</span>
            <div>
              <strong>Validate</strong>
              <small>Stock deducted &amp; shipped</small>
            </div>
          </div>
        </div>
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
                <th>Fulfillment Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState title="No delivery orders found" />
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const isProcessing = processingId === d.id;
                  return (
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
                      <td>
                        {/* Pick, Pack, Validate lifecycle buttons */}
                        {d.status === "ready" || d.status === "waiting" ? (
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            disabled={isProcessing}
                            onClick={() => handleAdvanceLifecycle(d, "picked")}
                            title="Perform picking from warehouse shelves"
                          >
                            {isProcessing ? "Processing..." : "📦 Pick Items"}
                          </button>
                        ) : d.status === "picked" ? (
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            disabled={isProcessing}
                            onClick={() => handleAdvanceLifecycle(d, "packed")}
                            title="Package picked items into courier box"
                          >
                            {isProcessing ? "Processing..." : "🏷️ Pack Order"}
                          </button>
                        ) : d.status === "packed" ? (
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            disabled={isProcessing}
                            onClick={() => handleAdvanceLifecycle(d, "done")}
                            title="Sign off & deduct stock permanently"
                          >
                            {isProcessing ? "Processing..." : "✅ Validate & Ship"}
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                            ✓ Shipped
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
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
              <label className="form-label">Origin Warehouse *</label>
              <select
                className="form-select"
                value={form.warehouse_id}
                onChange={(e) => updateField("warehouse_id", e.target.value)}
                required
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Available Stock & Validation Preview */}
          {selectedProduct && (
            <div
              className={`delivery-stock-info ${hasInsufficientStock ? "stock-insufficient" : ""}`}
            >
              <div>
                <span>Currently Available in Inventory:</span>{" "}
                <strong style={{ fontSize: 14 }}>
                  {selectedProduct.stock} {selectedProduct.uom}
                </strong>
              </div>
              {form.quantity && (
                <div>
                  Remaining after fulfillment:{" "}
                  <strong
                    style={{
                      color: hasInsufficientStock ? "var(--danger)" : "var(--text-primary)",
                    }}
                  >
                    {selectedProduct.stock - Number(form.quantity)} {selectedProduct.uom}
                  </strong>
                </div>
              )}
              {hasInsufficientStock && (
                <div className="stock-alert-msg">
                  ⚠️ Error: Insufficient stock available. Cannot deliver more than current on-hand quantity.
                </div>
              )}
            </div>
          )}

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
              disabled={saving || hasInsufficientStock}
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
