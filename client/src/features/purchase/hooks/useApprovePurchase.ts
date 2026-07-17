import { useMutation } from "@tanstack/react-query";
import { purchaseService } from "../services/purchase.service";

export const useApprovePurchase = (id: string) => {
  return useMutation({
    mutationFn: purchaseService.approvePurchaseOrder,
    mutationKey: ["approve-purchase", id],
  });
};
