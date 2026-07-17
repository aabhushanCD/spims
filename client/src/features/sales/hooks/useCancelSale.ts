// features/sales/hooks/useCancelSale.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saleKeys } from "./useSales";
import { toast } from "react-toastify";
import { salesService } from "../services/sales.service";

export function useCancelSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      salesService.cancelSale(id, reason),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(sale.id) });
      toast.success(`Sale ${sale.invoiceNo} cancelled`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to cancel sale.");
    },
  });
}
