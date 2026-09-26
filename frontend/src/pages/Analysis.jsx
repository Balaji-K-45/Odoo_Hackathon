import { useEffect, useState } from "react";
import { ErrorMessage, LoadingSpinner, StatusBadge } from "../components/ui";
import { getInventoryAnalysis } from "../services/analysisApi";
import "./Analysis.css";

const operationColors = {
  RECEIPT: "receipt",
  DELIVERY: "delivery",
  TRANSFER: "transfer",
  ADJUSTMENT: "adjustment",
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-";
}

function formatMonth(value) {
  return new Date(`${value}-01T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export default function Analysis() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getInventoryAnalysis()
      .then((response) => { if (active) setReport(response.data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingSpinner message="Loading inventory analysis..." />;
  if (error) return <ErrorMessage message={error} />;

  const monthly = report.monthly_operations || [];
  const maxMonthly = Math.max(1, ...monthly.map((month) =>
    Number(month.receipts) + Number(month.deliveries) + Number(month.transfers) + Number(month.adjustments)
  ));
  const stockStatus = report.stock_status || {};
  const products = report.stock_by_product || [];
  const maxStock = Math.max(1, ...products.map((item) => Number(item.quantity)));

  return (
    <div className="analysis-page">
      <header className="page-header">
        <div><h1>Inventory Analysis</h1><p className="page-header-subtitle">Warehouse activity, stock health, and product movement</p></div>
        <span className="analysis-period">Updated from live inventory data</span>
      </header>

      <section className="analysis-section">
        <div className="analysis-section-heading">
          <div><span className="analysis-kicker">01 / MOVEMENT</span><h2>Monthly operation trends</h2></div>
          <div className="analysis-legend">{Object.entries(operationColors).map(([type, color]) => <span key={type}><i className={`analysis-dot dot-${color}`} />{type.toLowerCase()}</span>)}</div>
        </div>
        {monthly.length ? <div className="analysis-trend-chart">
          {monthly.map((month) => {
            const values = [month.receipts, month.deliveries, month.transfers, month.adjustments].map(Number);
            const total = values.reduce((sum, value) => sum + value, 0);
            return <div className="trend-month" key={month.month}>
              <span className="trend-total">{total}</span>
              <div className="trend-column" title={`${formatMonth(month.month)}: ${total} operations`}>
                {values.map((value, index) => <i key={index} className={`trend-segment ${Object.values(operationColors)[index]}`} style={{ height: `${value / maxMonthly * 100}%` }} />)}
              </div>
              <span className="trend-month-label">{formatMonth(month.month)}</span>
            </div>;
          })}
        </div> : <p className="analysis-empty">No operations recorded in the reporting period.</p>}
      </section>

      <section className="analysis-summary-grid">
        <article className="analysis-section">
          <div className="analysis-section-heading">
            <div><span className="analysis-kicker">02 / AVAILABILITY</span><h2>Stock health</h2></div>
            <strong className="stock-total-count">{stockStatus.total_products || 0}<small> products</small></strong>
          </div>
          <div className="stock-health-list">
            {[["Healthy", stockStatus.healthy_stock, "healthy"], ["Low stock", stockStatus.low_stock, "low"], ["Out of stock", stockStatus.out_of_stock, "empty"]].map(([label, value, color]) =>
              <div className="health-row" key={label}>
                <span><i className={`analysis-dot dot-${color}`} />{label}</span><strong>{Number(value || 0)}</strong>
                <div className="health-track"><i className={`health-fill ${color}`} style={{ width: `${Math.min(100, Number(value || 0) / Math.max(1, Number(stockStatus.total_products || 0)) * 100)}%` }} /></div>
              </div>
            )}
          </div>
          <div className="operation-type-list">{(report.operation_types || []).map((item) => <div key={item.type}><span>{item.type.toLowerCase()}</span><strong>{Number(item.count)}</strong></div>)}</div>
        </article>

        <article className="analysis-section product-stock-section">
          <div className="analysis-section-heading"><div><span className="analysis-kicker">03 / ON HAND</span><h2>Stock by product</h2></div><span className="analysis-muted">Top 10 by quantity</span></div>
          {products.length ? products.map((product) => <div className="product-stock-row" key={product.id}>
            <div className="product-stock-label"><span><b>{product.name}</b><small>{product.sku}</small></span><strong>{Number(product.quantity)} <small>{product.uom}</small></strong></div>
            <div className="product-stock-track"><i style={{ width: `${Number(product.quantity) / maxStock * 100}%` }} /></div>
          </div>) : <p className="analysis-empty">No products to analyze.</p>}
        </article>
      </section>

      <section className="analysis-section">
        <div className="analysis-section-heading"><div><span className="analysis-kicker">04 / DEMAND</span><h2>Most delivered products</h2></div><span className="analysis-muted">Last 90 days</span></div>
        <div className="analysis-table-wrap"><table className="data-table analysis-table">
          <thead><tr><th>Product</th><th>SKU</th><th>Delivered quantity</th><th>Deliveries</th></tr></thead>
          <tbody>{report.most_delivered.length ? report.most_delivered.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.sku}</td><td>{Number(product.quantity_delivered)} {product.uom}</td><td>{Number(product.delivery_count)}</td></tr>) : <tr><td colSpan="4" className="analysis-empty">No deliveries in the last 90 days.</td></tr>}</tbody>
        </table></div>
      </section>

      <section className="analysis-section">
        <div className="analysis-section-heading"><div><span className="analysis-kicker">05 / AUDIT</span><h2>Activity history</h2></div><span className="analysis-muted">Last 14 days · latest 100 stock movements</span></div>
        <div className="analysis-table-wrap"><table className="data-table analysis-table">
          <thead><tr><th>Time</th><th>Operation</th><th>Product</th><th>Location</th><th>Change</th><th>User</th></tr></thead>
          <tbody>{report.recent_activity.length ? report.recent_activity.map((entry) => <tr key={entry.id}>
            <td>{formatDate(entry.created_at)}</td><td><StatusBadge status={entry.operation_type?.toLowerCase()} /></td>
            <td>{entry.product_name}<small className="analysis-cell-subtitle">{entry.sku}</small></td>
            <td>{entry.warehouse_name} / {entry.location_name}</td>
            <td className={Number(entry.quantity_change) >= 0 ? "text-positive" : "text-negative"}>{Number(entry.quantity_change) > 0 ? "+" : ""}{Number(entry.quantity_change)} {entry.uom || ""}</td>
            <td>{entry.user_name || "-"}</td>
          </tr>) : <tr><td colSpan="6" className="analysis-empty">No recent stock activity.</td></tr>}</tbody>
        </table></div>
      </section>
    </div>
  );
}