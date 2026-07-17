// features/sales/hooks/useCreateSale.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";


import { saleKeys } from "./useSales";
import type { CreateSaleInput } from "../types/sale.types";
import { toast } from "react-toastify";
import { salesService } from "../services/sales.service";

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSaleInput) => salesService.createSale(payload),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      toast.success(`Sale ${sale.invoiceNo} completed`);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? "Failed to complete sale. Please try again."
      );
    },
  });
}
