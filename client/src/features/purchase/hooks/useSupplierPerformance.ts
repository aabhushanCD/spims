import { useQuery } from "@tanstack/react-query";

import { purchaseService } from "../services/purchase.service";

export function useSupplierPerformance(
  supplierId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["supplier-performance", supplierId],
    queryFn: () => purchaseService.getSupplierPerformance(supplierId ?? ""),
    enabled: Boolean(supplierId) && enabled,
  });
}
