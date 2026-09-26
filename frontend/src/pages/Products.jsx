// ──────────────────────────────────────────────────────────
// src/pages/Products.jsx — Products list + CRUD (Role-Aware UI)
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  SearchBar,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  Modal,
  Toast,
  ConfirmDialog,
} from "../components/ui";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productApi";
import { getCategories } from "../services/dashboardApi";
import { getLocations, getWarehouses } from "../services/warehouseApi";
import { createReceipt } from "../services/inventoryApi";
import { useAuth } from "../context/AuthContext";
import "./Products.css";

const UOM_OPTIONS = ["pcs", "kg", "m", "roll", "litre", "box"];

export default function Products() {
  const { canManageProducts } = useAuth();
  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [warehouses, setWarehouses]   = useState([]);
  const [locations, setLocations]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [categoryFilter, setCategory] = useState("all");
  const [toast, setToast]             = useState(null);

  // Modal state
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingProduct, setEditing]   = useState(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category_id: "",
    uom: "pcs",
    reorder_level: "",
    warehouse_id: "",
    location_id: "",
    stock_to_add: "",
  });
  const [formError, setFormError]     = useState("");
  const [saving, setSaving]           = useState(false);

  // View modal (accessible to both roles)
  const [viewProduct, setViewProduct] = useState(null);

  // Delete modal (manager only)
  const [deleteId, setDeleteId]       = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const [pRes, cRes, wRes, lRes] = await Promise.all([
        getProducts(),
        getCategories(),
        getWarehouses(),
        getLocations(),
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
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

  function openAdd() {
    if (!canManageProducts) {
      setToast({
        message: "You don't have permission for this action.",
        type: "error",
      });
      return;
    }
    setEditing(null);
    setForm({
      name: "",
      sku: "",
      category_id: "",
      uom: "pcs",
      reorder_level: "",
      warehouse_id: "",
      location_id: "",
      stock_to_add: "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(p) {
    if (!canManageProducts) {
      setToast({
        message: "You don't have permission for this action.",
        type: "error",
      });
      return;
    }
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category_id: String(p.category_id || ""),
      uom: p.uom,
      reorder_level: String(p.reorder_level || ""),
      warehouse_id: "",
      location_id: "",
      stock_to_add: "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function updateField(k, v) {
    setForm((prev) => ({
      ...prev,
      [k]: v,
      ...(k === "warehouse_id" ? { location_id: "" } : {}),
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");

    if (!canManageProducts) {
      setFormError("You don't have permission for this action.");
      return;
    }

    if (!form.name || !form.sku) {
      setFormError("Name and SKU are required");
      return;
    }
    if (Number(form.stock_to_add) > 0 && !form.location_id) {
      setFormError("Select a warehouse location for the stock quantity");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id) || null,
        location_id: Number(form.location_id) || null,
        reorder_level: Number(form.reorder_level) || 0,
        stock_to_add: form.stock_to_add !== "" ? Number(form.stock_to_add) : undefined,
        warehouse_id: Number(form.warehouse_id) || null,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        if (Number(form.stock_to_add) > 0) {
          await createReceipt({
            product_id: editingProduct.id,
            location_id: Number(form.location_id),
            quantity: Number(form.stock_to_add),
            reference: "Manager stock update",
          });
        }
        setToast({ message: "Product updated successfully", type: "success" });
      } else {
        const response = await createProduct(payload);
        if (Number(form.stock_to_add) > 0) {
          await createReceipt({
            product_id: response.data.id,
            location_id: Number(form.location_id),
            quantity: Number(form.stock_to_add),
            reference: "Opening stock",
            supplier: "Opening stock",
          });
        }
        setToast({ message: "Product created successfully", type: "success" });
      }

      setModalOpen(false);
      loadProducts();
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

  async function handleDelete() {
    if (!canManageProducts) {
      setToast({
        message: "You don't have permission for this action.",
        type: "error",
      });
      setDeleteId(null);
      return;
    }

    try {
      await deleteProduct(deleteId);
      setToast({ message: "Product deleted from catalog", type: "success" });
      setDeleteId(null);
      loadProducts();
    } catch (err) {
      if (err.status === 403 || err.isForbidden) {
        setToast({
          message: "You don't have permission for this action.",
          type: "error",
        });
      } else {
        setToast({ message: err.message, type: "error" });
      }
    }
  }

  // Filter by search query and category
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.location || "").toLowerCase().includes(q);

    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSpinner message="Loading products..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadProducts} />;

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1>Products</h1>
            {canManageProducts ? (
              <span className="badge badge--primary">Manager Access</span>
            ) : (
              <span className="badge badge--success">View-Only</span>
            )}
          </div>
          <p className="page-header-subtitle">
            {canManageProducts
              ? `Manage product catalog, reorder rules, and storage locations (${products.length} products).`
              : "View-only catalog: Look up on-hand quantities, locations, SKUs, and units of measure."}
          </p>
        </div>

        {/* Show Add Product action ONLY for INVENTORY_MANAGER; Hide for WAREHOUSE_STAFF */}
        {canManageProducts && (
          <button className="btn btn--primary" onClick={openAdd}>
            + Add Product
          </button>
        )}
      </div>

      {/* Table & Toolbars */}
      <div className="data-table-wrapper">
        <div
          className="data-table-toolbar"
          style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search products by name, SKU, category, or location..."
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
              Category:
            </label>
            <select
              className="form-select"
              style={{ width: "auto", minWidth: 140 }}
              value={categoryFilter}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="data-table-overflow">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Stock On-Hand</th>
                <th>UoM</th>
                <th>Reorder Level</th>
                <th>Assigned Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="No products found"
                      message="Try changing the category filter or searching with a different term."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>
                      <code
                        style={{
                          fontSize: 12.5,
                          background: "var(--bg-body)",
                          padding: "2px 8px",
                          borderRadius: 4,
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        {p.sku}
                      </code>
                    </td>
                    <td>{p.category || "—"}</td>
                    <td>
                      <span
                        className={
                          p.stock <= 0
                            ? "stock-badge stock-badge--out"
                            : p.stock <= (p.reorder_level || 0)
                            ? "stock-badge stock-badge--low"
                            : "stock-badge stock-badge--ok"
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td>{p.uom}</td>
                    <td>{p.reorder_level || "—"}</td>
                    <td>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        📍 {p.location || "Unassigned"}
                      </span>
                    </td>
                    <td>
                      <div className="data-table-actions">
                        {/* 👁️ View action is shown to BOTH roles */}
                        <button
                          className="btn btn--ghost btn--icon"
                          title="View Details"
                          onClick={() => setViewProduct(p)}
                        >
                          👁
                        </button>

                        {/* ✏️ Edit & 🗑️ Delete are shown ONLY for INVENTORY_MANAGER; HIDDEN for WAREHOUSE_STAFF */}
                        {canManageProducts && (
                          <>
                            <button
                              className="btn btn--ghost btn--icon"
                              title="Edit Product"
                              onClick={() => openEdit(p)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn--ghost btn--icon"
                              title="Delete Product"
                              onClick={() => setDeleteId(p.id)}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal (Shown only when canManageProducts is true) */}
      {canManageProducts && (
        <Modal
          open={modalOpen}
          title={editingProduct ? "Edit Product Details" : "Add New Catalog Product"}
          onClose={() => setModalOpen(false)}
          size="md"
        >
          <form onSubmit={handleSave}>
            {formError && <div className="auth-error">{formError}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Steel Rod"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">SKU / Code *</label>
                <input
                  className="form-input"
                  value={form.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                  placeholder="e.g. STL001"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.category_id}
                  onChange={(e) => updateField("category_id", e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit of Measure (UoM)</label>
                <select
                  className="form-select"
                  value={form.uom}
                  onChange={(e) => updateField("uom", e.target.value)}
                >
                  {UOM_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Minimum Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.reorder_level}
                  onChange={(e) => updateField("reorder_level", e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Warehouse</label>
                <select
                  className="form-select"
                  value={form.warehouse_id}
                  onChange={(e) => updateField("warehouse_id", e.target.value)}
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Storage Area</label>
                <select
                  className="form-select"
                  value={form.location_id}
                  onChange={(e) => updateField("location_id", e.target.value)}
                  disabled={!form.warehouse_id}
                >
                  <option value="">Select area</option>
                  {locations.filter((location) => Number(location.warehouse_id) === Number(form.warehouse_id)).map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{editingProduct ? "Stock quantity to add" : "Opening stock quantity"}</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.stock_to_add}
                onChange={(e) => updateField("stock_to_add", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Product Details Modal (Accessible to WAREHOUSE_STAFF & INVENTORY_MANAGER) */}
      {viewProduct && (
        <Modal
          open={!!viewProduct}
          title={`Product Details: ${viewProduct.name}`}
          onClose={() => setViewProduct(null)}
          size="sm"
        >
          <div className="product-view-details">
            <div className="product-view-row">
              <span className="product-view-label">SKU / Code:</span>
              <code>{viewProduct.sku}</code>
            </div>
            <div className="product-view-row">
              <span className="product-view-label">Category:</span>
              <span>{viewProduct.category || "—"}</span>
            </div>
            <div className="product-view-row">
              <span className="product-view-label">Stock On-Hand:</span>
              <strong style={{ fontSize: 15, color: "var(--primary)" }}>
                {viewProduct.stock} {viewProduct.uom}
              </strong>
            </div>
            <div className="product-view-row">
              <span className="product-view-label">Reorder Level:</span>
              <span>
                {viewProduct.reorder_level || 0} {viewProduct.uom}
              </span>
            </div>
            <div className="product-view-row">
              <span className="product-view-label">Assigned Location:</span>
              <span>📍 {viewProduct.location || "Unassigned"}</span>
            </div>
            <div className="product-view-row">
              <span className="product-view-label">Stock Status:</span>
              <span
                className={
                  viewProduct.stock <= 0
                    ? "stock-badge stock-badge--out"
                    : viewProduct.stock <= (viewProduct.reorder_level || 0)
                    ? "stock-badge stock-badge--low"
                    : "stock-badge stock-badge--ok"
                }
              >
                {viewProduct.stock <= 0
                  ? "Out of Stock"
                  : viewProduct.stock <= (viewProduct.reorder_level || 0)
                  ? "Low Stock Alert"
                  : "In Stock"}
              </span>
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setViewProduct(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation (Manager Only) */}
      {canManageProducts && (
        <ConfirmDialog
          open={!!deleteId}
          title="Delete Product"
          message="Are you sure you want to remove this product from the inventory catalog? This cannot be undone."
          confirmText="Delete Product"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

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
