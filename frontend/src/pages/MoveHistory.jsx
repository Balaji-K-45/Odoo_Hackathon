// ──────────────────────────────────────────────────────────
// src/pages/MoveHistory.jsx — Stock Ledger / Move History
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { SearchBar, FilterSelect, LoadingSpinner, ErrorMessage, EmptyState, StatusBadge } from "../components/ui";
import { getLedger } from "../services/inventoryApi";
import "./Operations.css";

export default function MoveHistory() {
  const [ledger, setLedger]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [opFilter, setOpFilter] = useState("all");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const res = await getLedger();
      setLedger(res.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const filtered = ledger.filter((entry) => {
    if (opFilter !== "all" && entry.operation !== opFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return entry.product?.toLowerCase().includes(q) ||
             entry.reference?.toLowerCase().includes(q) ||
             entry.source?.toLowerCase().includes(q) ||
             entry.destination?.toLowerCase().includes(q);
    }
    return true;
  });

  function formatDate(d) {
    try {
      return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    } catch { return d; }
  }

  const opBadge = (op) => {
    const map = { receipt: "success", delivery: "danger", transfer: "warning", adjustment: "default" };
    return map[op] || "default";
  };

  if (loading) return <LoadingSpinner message="Loading move history..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Move History</h1>
          <p className="page-header-subtitle">Complete stock movement ledger</p>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search history..." />
          <FilterSelect
            label="Operation"
            value={opFilter}
            onChange={setOpFilter}
            options={[
              { value: "all", label: "All" },
              { value: "receipt", label: "Receipt" },
              { value: "delivery", label: "Delivery" },
              { value: "transfer", label: "Transfer" },
              { value: "adjustment", label: "Adjustment" },
            ]}
          />
        </div>
        <div className="data-table-overflow">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Operation</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Qty</th>
                <th>Change</th>
                <th>Reference</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}><EmptyState title="No movements found" /></td></tr>
              ) : filtered.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ fontSize: 13 }}>{formatDate(entry.date)}</td>
                  <td style={{ fontWeight: 600 }}>{entry.product}</td>
                  <td>
                    <span className={`status-badge status-badge--${opBadge(entry.operation)}`}>
                      {entry.operation}
                    </span>
                  </td>
                  <td>{entry.source}</td>
                  <td>{entry.destination}</td>
                  <td>{entry.quantity}</td>
                  <td>
                    <span className={entry.change?.startsWith("+") ? "text-positive" : "text-negative"} style={{ fontWeight: 700, fontSize: 15 }}>
                      {entry.change}
                    </span>
                  </td>
                  <td><code style={{ fontSize: 12, background: "var(--bg-body)", padding: "2px 6px", borderRadius: 4 }}>{entry.reference}</code></td>
                  <td>{entry.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
