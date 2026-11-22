import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  CashierSalesRow,
  CategorySalesRow,
  CsvExportType,
  InventoryAnalytics,
  ProfitSummary,
  PurchaseAnalytics,
  RangeAnalytics,
  SalesAnalytics,
  SupplierAnalytics,
  TopSellingRow,
} from "../types/dashboard";

const getDashboard = async () => {
  const response = await api.get("/dashboard");
  return response.data;
};

const getSummary = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data;
};

const getInventory = async () => {
  const response = await api.get<ApiResponse<InventoryAnalytics>>(
    "/dashboard/inventory",
  );
  return response.data.data;
};

const getSales = async (year?: number) => {
  const response = await api.get<ApiResponse<SalesAnalytics>>(
    "/dashboard/sales",
    { params: year ? { year } : {} },
  );
  return response.data.data;
};

const getPurchases = async (): Promise<PurchaseAnalytics> => {
  const response = await api.get<ApiResponse<PurchaseAnalytics>>(
    "/dashboard/purchases",
  );
  return response.data.data;
};

const getProfit = async (): Promise<ProfitSummary> => {
  const response = await api.get<ApiResponse<ProfitSummary>>(
    "/dashboard/profit",
  );
  return response.data.data;
};

const getTopSelling = async (limit = 10): Promise<TopSellingRow[]> => {
  const response = await api.get<ApiResponse<TopSellingRow[]>>(
    "/dashboard/top-selling",
    { params: { limit } },
  );
  return response.data.data;
};

const getExpiry = async () => {
  const response = await api.get("/dashboard/expiry");
  return response.data;
};

const getReorder = async () => {
  const response = await api.get("/dashboard/reorder");
  return response.data;
};

const getNotifications = async () => {
  const response = await api.get("/dashboard/notifications");
  return response.data;
};

const getRecentActivity = async () => {
  const response = await api.get("/dashboard/recent-activity");
  return response.data;
};

const getSystemHealth = async () => {
  const response = await api.get("/dashboard/system-health");
  return response.data;
};

const getSupplierAnalytics = async (): Promise<SupplierAnalytics> => {
  const response = await api.get<ApiResponse<SupplierAnalytics>>(
    "/dashboard/suppliers",
  );
  return response.data.data;
};

const getSalesComparison = async () => {
  const response = await api.get("/dashboard/sales-comparison");
  return response.data;
};

const getRange = async (from: string, to: string): Promise<RangeAnalytics> => {
  const response = await api.get<ApiResponse<RangeAnalytics>>(
    "/dashboard/range",
    { params: { from, to } },
  );
  return response.data.data;
};

const getByCashier = async (
  from: string,
  to: string,
): Promise<CashierSalesRow[]> => {
  const response = await api.get<ApiResponse<CashierSalesRow[]>>(
    "/dashboard/by-cashier",
    { params: { from, to } },
  );
  return response.data.data;
};

const getByCategory = async (
  from: string,
  to: string,
): Promise<CategorySalesRow[]> => {
  const response = await api.get<ApiResponse<CategorySalesRow[]>>(
    "/dashboard/by-category",
    { params: { from, to } },
  );
  return response.data.data;
};

const exportCsv = async (
  type: CsvExportType,
  from?: string,
  to?: string,
): Promise<Blob> => {
  const response = await api.get("/dashboard/export", {
    params: {
      type,
      ...(type === "inventory" ? {} : { from, to }),
    },
    responseType: "blob",
  });
  return response.data as Blob;
};

export const dashboardService = {
  getDashboard,
  getSummary,
  getInventory,
  getSales,
  getPurchases,
  getProfit,
  getTopSelling,
  getExpiry,
  getReorder,
  getNotifications,
  getRecentActivity,
  getSystemHealth,
  getSupplierAnalytics,
  getSalesComparison,
  getRange,
  getByCashier,
  getByCategory,
  exportCsv,
};
