import { useInfiniteQuery } from "@tanstack/react-query";

import { purchaseService } from "../services/purchase.service";
import type { PurchaseListParams } from "../lib/purchaseQuery";

export function usePurchaseList(params: PurchaseListParams = {}) {
  return useInfiniteQuery({
    queryKey: ["purchase-orders", "list", params],
    queryFn: ({ pageParam }) =>
      purchaseService.getPurchasePage({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
