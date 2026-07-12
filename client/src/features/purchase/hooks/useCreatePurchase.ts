import { useMutation, useQueryClient } from "@tanstack/react-query";


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
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          "Failed to create purchase"
      );
    },
  });
};