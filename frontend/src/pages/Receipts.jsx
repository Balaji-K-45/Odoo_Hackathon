// ──────────────────────────────────────────────────────────
// src/pages/Receipts.jsx — Incoming stock receipts
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Modal, Toast, LoadingSpinner, ErrorMessage, EmptyState, StatusBadge, SearchBar } from "../components/ui";
import { getReceipts, createReceipt } from "../services/inventoryApi";
import { getProducts } from "../services/productApi";
import { getWarehouses } from "../services/warehouseApi";

const UOM_OPTIONS = ["pcs", "kg", "m", "roll", "litre", "box"];

export default function Receipts() {
  const [receipts, setReceipts]     = useState([]);
  const [products, setProducts]     = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [toast, setToast]           = useState(null);

  // Form
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ supplier: "", product_id: "", product: "", quantity: "", uom: "pcs", warehouse_id: "", warehouse: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving]       = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [rRes, pRes, wRes] = await Promise.all([getReceipts(), getProducts(), getWarehouses()]);
      setReceipts(rRes.data || []);
      setProducts(pRes.data || []);
      setWarehouses(wRes.data || []);
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

  function updateField(k, v) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "product_id") {
        const p = products.find((x) => x.id === Number(v));
        if (p) { next.product = p.name; next.uom = p.uom; }
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
    if (!form.supplier || !form.product_id || !form.quantity || !form.warehouse_id) {
      setFormError("All fields are required");
      return;
    }
    setSaving(true);
    try {
      await createReceipt({
        ...form,
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        warehouse_id: Number(form.warehouse_id),
      });
      setToast({ message: `Receipt created — Stock +${form.quantity}`, type: "success" });
      setModalOpen(false);
      setForm({ supplier: "", product_id: "", product: "", quantity: "", uom: "pcs", warehouse_id: "", warehouse: "" });
      loadData();
    } catch (err) {
      if (err.status === 403 || err.isForbidden) {
        setFormError("You don't have permission for this action.");
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const filtered = receipts.filter((r) => {
    const q = search.toLowerCase();
    return r.supplier?.toLowerCase().includes(q) || r.product?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q);
  });

  if (loading) return <LoadingSpinner message="Loading receipts..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Receipts</h1>
          <p className="page-header-subtitle">Receive incoming stock from suppliers</p>
        </div>
        <button className="btn btn--primary" onClick={() => { setFormError(""); setModalOpen(true); }}>+ New Receipt</button>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search receipts..." />
        </div>
        <div className="data-table-overflow">
          <table className="data-table">
            <thead>
              <tr><th>Receipt ID</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Warehouse</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState title="No receipts found" /></td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.id}</strong></td>
                  <td>{r.supplier}</td>
                  <td>{r.product}</td>
                  <td><span className="text-positive">+{r.quantity}</span> {r.uom}</td>
                  <td>{r.warehouse}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Receipt Modal */}
      <Modal open={modalOpen} title="New Receipt" onClose={() => setModalOpen(false)} size="md">
        <form onSubmit={handleSave}>
          {formError && <div className="auth-error">{formError}</div>}
          <div className="form-group">
            <label className="form-label">Supplier *</label>
            <input className="form-input" value={form.supplier} onChange={(e) => updateField("supplier", e.target.value)} placeholder="e.g. ABC Metals" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product *</label>
              <select className="form-select" value={form.product_id} onChange={(e) => updateField("product_id", e.target.value)}>
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Warehouse *</label>
              <select className="form-select" value={form.warehouse_id} onChange={(e) => updateField("warehouse_id", e.target.value)}>
                <option value="">Select warehouse</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input type="number" min="1" className="form-input" value={form.quantity} onChange={(e) => updateField("quantity", e.target.value)} placeholder="50" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit of Measure</label>
              <input className="form-input" value={form.uom} readOnly />
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn--success" disabled={saving}>{saving ? "Saving..." : "Receive Stock"}</button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
