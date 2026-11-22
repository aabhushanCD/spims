import { useQuery } from "@tanstack/react-query";

import { dashboardService } from "@/features/dashboard/services/dashboard.service";

export interface InventoryAnalytics {
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
}

export function useInventoryAnalytics() {
  return useQuery({
    queryKey: ["inventory", "analytics"],
    queryFn: async (): Promise<InventoryAnalytics> => {
      const response = await dashboardService.getInventory();
      return response.data as InventoryAnalytics;
    },
    staleTime: 60_000,
  });
}
