import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { purchaseService } from "../services/purchase.service";

function useInvalidatePurchase(id?: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
    }
  };
}

export function useCancelPurchase(id: string) {
  const invalidate = useInvalidatePurchase(id);

  return useMutation({
    mutationFn: () => purchaseService.cancelPurchaseOrder(id),
    onSuccess: () => {
      toast.success("Purchase order cancelled");
      invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to cancel purchase order"));
    },
  });
}

export function useUploadInvoice(id: string) {
  const invalidate = useInvalidatePurchase(id);

  return useMutation({
    mutationFn: (file: File) => purchaseService.uploadInvoice(id, file),
    onSuccess: () => {
      toast.success("Invoice uploaded");
      invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to upload invoice"));
    },
  });
}
