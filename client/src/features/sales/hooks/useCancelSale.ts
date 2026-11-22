// features/sales/hooks/useCancelSale.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saleKeys } from "./useSales";
import { toast } from "react-toastify";
import { salesService } from "../services/sales.service";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";

export function useCancelSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => salesService.cancelSale(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: saleKeys.detail(variables.id),
      });
      toast.success("Sale cancelled and stock restored");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to cancel sale."));
    },
  });
}
