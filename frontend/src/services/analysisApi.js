import { apiGet, USE_MOCKS } from "./api";

export async function getInventoryAnalysis() {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        monthly_operations: [],
        operation_types: [],
        stock_status: { total_products: 0, out_of_stock: 0, low_stock: 0, healthy_stock: 0 },
        stock_by_product: [],
        most_delivered: [],
        recent_activity: [],
      },
    };
  }
  return apiGet("/api/analysis");
}