import { api } from "@/api/fetch.api";

const getDashboard = async () => {
  const response = await api.get("/dashboard");
  return response.data;
};

const getSummary = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data;
};

const getInventory = async () => {
  const response = await api.get("/dashboard/inventory");
  return response.data;
};

const getSales = async () => {
  const response = await api.get("/dashboard/sales");
  return response.data;
};

const getPurchases = async () => {
  const response = await api.get("/dashboard/purchases");
  return response.data;
};

const getProfit = async () => {
  const response = await api.get("/dashboard/profit");
  return response.data;
};

const getTopSelling = async () => {
  const response = await api.get("/dashboard/top-selling");
  return response.data;
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

const getSupplierAnalytics = async () => {
  const response = await api.get("/dashboard/suppliers");
  return response.data;
};

const getSalesComparison = async () => {
  const response = await api.get("/dashboard/sales-comparison");
  return response.data;
};
const getNotification = async () => {
  const response = await api.get("/notifications/me");
  return response.data;
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
  getNotification,
  getNotifications,
  getRecentActivity,
  getSystemHealth,
  getSupplierAnalytics,
  getSalesComparison,
};
