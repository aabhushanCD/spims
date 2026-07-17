import { useQuery } from "@tanstack/react-query";

import { purchaseService } from "../services/purchase.service";

export const usePurchase = (id: string | undefined) => {
  return useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => purchaseService.getPurchaseOrderById(id!),
    enabled: !!id,
  });
};
