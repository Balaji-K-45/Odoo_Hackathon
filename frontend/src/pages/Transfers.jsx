// ──────────────────────────────────────────────────────────
// src/pages/Transfers.jsx — Internal stock transfers
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Modal, Toast, LoadingSpinner, ErrorMessage, EmptyState, StatusBadge, SearchBar } from "../components/ui";
import { getTransfers, createTransfer } from "../services/inventoryApi";
import { getProducts } from "../services/productApi";
import { getLocations } from "../services/warehouseApi";

export default function Transfers() {
  const [transfers, setTransfers]       = useState([]);
  const [products, setProducts]         = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [toast, setToast]               = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", product: "", quantity: "", source_id: "", source: "", destination_id: "", destination: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving]       = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [tRes, pRes, lRes] = await Promise.all([
        getTransfers(),
        getProducts(),
        getLocations(),
      ]);
      setTransfers(tRes.data || []);
      setProducts(pRes.data || []);
      setAllLocations(lRes.data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function updateField(k, v) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "product_id") {
        const p = products.find((x) => x.id === Number(v));
        if (p) next.product = p.name;
      }
      if (k === "source_id") {
        const loc = allLocations.find((x) => x.id === Number(v));
        if (loc) next.source = loc.name;
      }
      if (k === "destination_id") {
        const loc = allLocations.find((x) => x.id === Number(v));
        if (loc) next.destination = loc.name;
      }
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault(); setFormError("");
    if (!form.product_id || !form.quantity || !form.source_id || !form.destination_id) {
      setFormError("All fields are required"); return;
    }
    if (form.source_id === form.destination_id) {
      setFormError("Source and destination must be different"); return;
    }
    setSaving(true);
    try {
      await createTransfer({
        ...form,
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        source_id: Number(form.source_id),
        destination_id: Number(form.destination_id),
      });
      setToast({ message: `Transfer completed — ${form.quantity} ${form.product} moved`, type: "success" });
      setModalOpen(false);
      setForm({ product_id: "", product: "", quantity: "", source_id: "", source: "", destination_id: "", destination: "" });
      loadData();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  }

  const filtered = transfers.filter((t) => {
    const q = search.toLowerCase();
    return t.product?.toLowerCase().includes(q) || t.source?.toLowerCase().includes(q) || t.destination?.toLowerCase().includes(q) || t.id?.toLowerCase().includes(q);
  });

  if (loading) return <LoadingSpinner message="Loading transfers..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Internal Transfers</h1>
          <p className="page-header-subtitle">Move stock between locations</p>
        </div>
        <button className="btn btn--primary" onClick={() => { setFormError(""); setModalOpen(true); }}>+ New Transfer</button>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search transfers..." />
        </div>
        <div className="data-table-overflow">
          <table className="data-table">
            <thead>
              <tr><th>Transfer ID</th><th>Product</th><th>Qty</th><th>Source</th><th>Destination</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState title="No transfers found" /></td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.id}</strong></td>
                  <td>{t.product}</td>
                  <td>{t.quantity}</td>
                  <td>{t.source}</td>
                  <td>{t.destination}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      <Modal open={modalOpen} title="New Internal Transfer" onClose={() => setModalOpen(false)} size="md">
        <form onSubmit={handleSave}>
          {formError && <div className="auth-error">{formError}</div>}
          <div className="form-group">
            <label className="form-label">Product *</label>
            <select className="form-select" value={form.product_id} onChange={(e) => updateField("product_id", e.target.value)}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source Location *</label>
              <select className="form-select" value={form.source_id} onChange={(e) => updateField("source_id", e.target.value)}>
                <option value="">Select source</option>
                {allLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination *</label>
              <select className="form-select" value={form.destination_id} onChange={(e) => updateField("destination_id", e.target.value)}>
                <option value="">Select destination</option>
                {allLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input type="number" min="1" className="form-input" value={form.quantity} onChange={(e) => updateField("quantity", e.target.value)} placeholder="30" />
          </div>
          {form.source && form.destination && form.quantity && (
            <div className="transfer-preview">
              <div className="transfer-preview-item">
                <span>{form.source}</span>
                <strong>-{form.quantity}</strong>
              </div>
              <span className="transfer-preview-arrow">→</span>
              <div className="transfer-preview-item">
                <span>{form.destination}</span>
                <strong>+{form.quantity}</strong>
              </div>
            </div>
          )}
          <div className="modal-actions" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving..." : "Transfer Stock"}</button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
