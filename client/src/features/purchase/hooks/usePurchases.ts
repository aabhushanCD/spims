import { useQuery } from "@tanstack/react-query";

import { purchaseService } from "../services/purchase.service";

export const usePurchases = () => {
  return useQuery({
    queryKey: ["purchase-orders"],

    queryFn: purchaseService.getPurchaseOrders,
  });
};
