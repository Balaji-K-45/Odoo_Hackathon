// ──────────────────────────────────────────────────────────
// src/pages/Adjustments.jsx — Inventory adjustments
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Modal, Toast, LoadingSpinner, ErrorMessage, EmptyState, StatusBadge, SearchBar } from "../components/ui";
import { getAdjustments, createAdjustment } from "../services/inventoryApi";
import { getProducts } from "../services/productApi";
import { getWarehouses, getLocations } from "../services/warehouseApi";

export default function Adjustments() {
  const [adjustments, setAdjustments]   = useState([]);
  const [products, setProducts]         = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [toast, setToast]               = useState(null);

  const [modalOpen, setModalOpen]     = useState(false);
  const [form, setForm] = useState({ product_id: "", product: "", location_id: "", location: "", system_qty: "", physical_qty: "", reason: "" });
  const [formError, setFormError]     = useState("");
  const [saving, setSaving]           = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [aRes, pRes, wRes, lRes] = await Promise.all([
        getAdjustments(),
        getProducts(),
        getWarehouses(),
        getLocations(),
      ]);
      setAdjustments(aRes.data || []);
      setProducts(pRes.data || []);
      const combined = [...(wRes.data || []), ...(lRes.data || [])];
      setAllLocations(combined);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function updateField(k, v) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "product_id") {
        const p = products.find((x) => x.id === Number(v));
        if (p) { next.product = p.name; next.system_qty = String(p.stock); }
      }
      if (k === "location_id") {
        const loc = allLocations.find((x) => x.id === Number(v));
        if (loc) next.location = loc.name;
      }
      return next;
    });
  }

  const difference = form.system_qty !== "" && form.physical_qty !== ""
    ? Number(form.physical_qty) - Number(form.system_qty)
    : null;

  async function handleSave(e) {
    e.preventDefault(); setFormError("");
    if (!form.product_id || !form.location_id || form.physical_qty === "" || !form.reason) {
      setFormError("All fields are required"); return;
    }
    setSaving(true);
    try {
      await createAdjustment({
        ...form,
        product_id: Number(form.product_id),
        location_id: Number(form.location_id),
        system_qty: Number(form.system_qty),
        physical_qty: Number(form.physical_qty),
      });
      setToast({ message: `Adjustment recorded (${difference >= 0 ? "+" : ""}${difference})`, type: "success" });
      setModalOpen(false);
      setForm({ product_id: "", product: "", location_id: "", location: "", system_qty: "", physical_qty: "", reason: "" });
      loadData();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  }

  const filtered = adjustments.filter((a) => {
    const q = search.toLowerCase();
    return a.product?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q) || a.id?.toLowerCase().includes(q);
  });

  if (loading) return <LoadingSpinner message="Loading adjustments..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory Adjustments</h1>
          <p className="page-header-subtitle">Reconcile physical and system stock counts</p>
        </div>
        <button className="btn btn--primary" onClick={() => { setFormError(""); setModalOpen(true); }}>+ New Adjustment</button>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search adjustments..." />
        </div>
        <div className="data-table-overflow">
          <table className="data-table">
            <thead>
              <tr><th>Adj ID</th><th>Product</th><th>Location</th><th>System Qty</th><th>Physical Qty</th><th>Difference</th><th>Reason</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}><EmptyState title="No adjustments found" /></td></tr>
              ) : filtered.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.id}</strong></td>
                  <td>{a.product}</td>
                  <td>{a.location}</td>
                  <td>{a.system_qty}</td>
                  <td>{a.physical_qty}</td>
                  <td>
                    <span className={a.difference >= 0 ? "text-positive" : "text-negative"}>
                      {a.difference >= 0 ? "+" : ""}{a.difference}
                    </span>
                  </td>
                  <td>{a.reason}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      <Modal open={modalOpen} title="New Inventory Adjustment" onClose={() => setModalOpen(false)} size="md">
        <form onSubmit={handleSave}>
          {formError && <div className="auth-error">{formError}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product *</label>
              <select className="form-select" value={form.product_id} onChange={(e) => updateField("product_id", e.target.value)}>
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <select className="form-select" value={form.location_id} onChange={(e) => updateField("location_id", e.target.value)}>
                <option value="">Select location</option>
                {allLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">System Quantity</label>
              <input type="number" className="form-input" value={form.system_qty} readOnly style={{ background: "var(--bg-body)" }} />
            </div>
            <div className="form-group">
              <label className="form-label">Physical (Counted) Quantity *</label>
              <input type="number" min="0" className="form-input" value={form.physical_qty} onChange={(e) => updateField("physical_qty", e.target.value)} placeholder="18" />
            </div>
          </div>
          {difference !== null && (
            <div className="adjustment-diff-preview">
              <span>Difference:</span>
              <strong className={difference >= 0 ? "text-positive" : "text-negative"}>
                {difference >= 0 ? "+" : ""}{difference}
              </strong>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <textarea className="form-textarea" value={form.reason} onChange={(e) => updateField("reason", e.target.value)} placeholder="e.g. Damaged during handling" />
          </div>
          <div className="modal-actions" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving..." : "Record Adjustment"}</button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
