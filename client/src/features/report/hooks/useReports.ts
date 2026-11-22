import { useQuery } from "@tanstack/react-query";

import { dashboardService } from "@/features/dashboard/services/dashboard.service";

const allReports = ["reports"] as const;

export const reportKeys = {
  all: allReports,
  range: (from: string, to: string) =>
    [...allReports, "range", from, to] as const,
  cashier: (from: string, to: string) =>
    [...allReports, "cashier", from, to] as const,
  category: (from: string, to: string) =>
    [...allReports, "category", from, to] as const,
  topSelling: (limit: number) =>
    [...allReports, "top-selling", limit] as const,
  suppliers: [...allReports, "suppliers"] as const,
  sales: (year: number) => [...allReports, "sales", year] as const,
  purchases: [...allReports, "purchases"] as const,
};

export function useRangeReport(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: reportKeys.range(from, to),
    queryFn: () => dashboardService.getRange(from, to),
    enabled: enabled && Boolean(from && to),
  });
}

export function useSalesByCashier(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: reportKeys.cashier(from, to),
    queryFn: () => dashboardService.getByCashier(from, to),
    enabled: enabled && Boolean(from && to),
  });
}

export function useSalesByCategory(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: reportKeys.category(from, to),
    queryFn: () => dashboardService.getByCategory(from, to),
    enabled: enabled && Boolean(from && to),
  });
}

export function useTopSelling(limit = 10) {
  return useQuery({
    queryKey: reportKeys.topSelling(limit),
    queryFn: () => dashboardService.getTopSelling(limit),
  });
}

export function useSupplierAnalytics() {
  return useQuery({
    queryKey: reportKeys.suppliers,
    queryFn: dashboardService.getSupplierAnalytics,
  });
}

export function useSalesAnalytics(year: number) {
  return useQuery({
    queryKey: reportKeys.sales(year),
    queryFn: () => dashboardService.getSales(year),
  });
}

export function usePurchaseAnalytics() {
  return useQuery({
    queryKey: reportKeys.purchases,
    queryFn: dashboardService.getPurchases,
  });
}
