import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { purchaseService } from "../services/purchase.service";

export const useApprovePurchase = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => purchaseService.approvePurchaseOrder(id),
    mutationKey: ["approve-purchase", id],
    onSuccess: () => {
      toast.success("Purchase order approved");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to approve purchase order"));
    },
  });
};
