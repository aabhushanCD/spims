import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";

export const useGetDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.getDashboard,
  });
};

export const useGetSales = () => {
  return useQuery({
    queryKey: ["dashboard", "sales"],
    queryFn: dashboardService.getSales,
  });
};

export const useGetPurchases = () => {
  return useQuery({
    queryKey: ["dashboard", "purchases"],
    queryFn: dashboardService.getPurchases,
  });
};

export const useGetProfit = () => {
  return useQuery({
    queryKey: ["dashboard", "profit"],
    queryFn: dashboardService.getProfit,
  });
};

export const useGetTopSelling = () => {
  return useQuery({
    queryKey: ["dashboard", "top-selling"],
    queryFn: dashboardService.getTopSelling,
  });
};

export const useGetExpiry = () => {
  return useQuery({
    queryKey: ["dashboard", "expiry"],
    queryFn: dashboardService.getExpiry,
  });
};

export const useGetReorder = () => {
  return useQuery({
    queryKey: ["dashboard", "reorder"],
    queryFn: dashboardService.getReorder,
  });
};

export const useGetNotifications = () => {
  return useQuery({
    queryKey: ["dashboard", "notifications"],
    queryFn: dashboardService.getNotifications,
  });
};

export const useGetRecentActivity = () => {
  return useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: dashboardService.getRecentActivity,
  });
};

export const useGetSystemHealth = () => {
  return useQuery({
    queryKey: ["dashboard", "system-health"],
    queryFn: dashboardService.getSystemHealth,
  });
};

export const useGetSupplierAnalytics = () => {
  return useQuery({
    queryKey: ["dashboard", "suppliers"],
    queryFn: dashboardService.getSupplierAnalytics,
  });
};

export const useGetSalesComparison = () => {
  return useQuery({
    queryKey: ["dashboard", "sales-comparison"],
    queryFn: dashboardService.getSalesComparison,
  });
};
