import { useMutation, useQueryClient } from "@tanstack/react-query";

import { purchaseService } from "../services/purchase.service";
import type { ReceivePurchaseForm } from "../schema/receivePurchase.schema";

export const useReceivePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReceivePurchaseForm }) =>
      purchaseService.receivePurchase(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["purchase-orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["inventory"],
      });

      queryClient.invalidateQueries({
        queryKey: ["batches"],
      });
    },
  });
};
