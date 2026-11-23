import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { purchaseService } from "../services/purchase.service";
import { toast } from "react-toastify";

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchaseService.createPurchaseOrder,

    onSuccess: () => {
      toast.success("Purchase created successfully");

      queryClient.invalidateQueries({
        queryKey: ["purchase-orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create purchase"));
    },
  });
};