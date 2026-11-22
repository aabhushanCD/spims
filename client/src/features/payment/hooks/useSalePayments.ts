import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { saleKeys } from "@/features/sales/hooks/useSales";
import { paymentService } from "../services/payment.service";
import type { AddPaymentInput } from "../types/payment.types";

export const paymentKeys = {
  all: ["sale-payments"] as const,
  sale: (saleId: string) => [...paymentKeys.all, saleId] as const,
};

export function useSalePayments(saleId: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.sale(saleId ?? ""),
    queryFn: () => paymentService.getSalePayments(saleId ?? ""),
    enabled: Boolean(saleId),
  });
}

export function useAddSalePayment(saleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddPaymentInput) =>
      paymentService.addSalePayment(saleId, data),
    onSuccess: () => {
      toast.success("Payment recorded");
      queryClient.invalidateQueries({ queryKey: paymentKeys.sale(saleId) });
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(saleId) });
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to record payment"));
    },
  });
}
