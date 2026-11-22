import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { saleItemService, type SaleItemCorrection } from "../services/saleItem.service";
import { saleKeys } from "./useSales";

interface Variables {
  itemId: string;
  saleId: string;
  data: SaleItemCorrection;
}

export function useCorrectSaleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: Variables) =>
      saleItemService.correctSaleItem(itemId, data),
    onSuccess: (_item, variables) => {
      toast.success("Sale line corrected");
      queryClient.invalidateQueries({
        queryKey: saleKeys.detail(variables.saleId),
      });
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to correct sale line"));
    },
  });
}
