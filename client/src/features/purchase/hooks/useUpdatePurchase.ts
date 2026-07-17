import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseService } from "../services/purchase.service";


export const useUpdatePurchase = () => {
  const queryClient = useQueryClient();
  const updatePurchase = useMutation({
    mutationFn: (data: { id: string; data: any }) => purchaseService.updatePurchaseOrder(data.id, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order"] });
    },
  });

  return updatePurchase;
};
