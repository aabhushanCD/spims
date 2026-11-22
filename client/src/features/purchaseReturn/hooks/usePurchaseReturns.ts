import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { purchaseReturnService } from "../services/purchaseReturn.service";
import type {
  CreatePurchaseReturnInput,
  PurchaseReturnListParams,
} from "../types/purchaseReturn.types";

export const purchaseReturnKeys = {
  all: ["purchase-returns"] as const,
  list: (params: PurchaseReturnListParams) =>
    [...purchaseReturnKeys.all, "list", params] as const,
  detail: (id: string) => [...purchaseReturnKeys.all, "detail", id] as const,
  ledger: (supplierId: string) =>
    [...purchaseReturnKeys.all, "ledger", supplierId] as const,
};

export function usePurchaseReturns(params: PurchaseReturnListParams = {}) {
  return useQuery({
    queryKey: purchaseReturnKeys.list(params),
    queryFn: () => purchaseReturnService.getPurchaseReturns(params),
  });
}

export function usePurchaseReturn(id: string | undefined) {
  return useQuery({
    queryKey: purchaseReturnKeys.detail(id ?? ""),
    queryFn: () => purchaseReturnService.getPurchaseReturnById(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useSupplierLedger(supplierId: string | undefined) {
  return useQuery({
    queryKey: purchaseReturnKeys.ledger(supplierId ?? ""),
    queryFn: () => purchaseReturnService.getSupplierLedger(supplierId ?? ""),
    enabled: Boolean(supplierId),
  });
}

export function useCreatePurchaseReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseReturnInput) =>
      purchaseReturnService.createPurchaseReturn(data),
    onSuccess: (created) => {
      toast.success(`Purchase return ${created.returnNumber} created`);
      queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.all });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to create purchase return"),
      );
    },
  });
}

type Action = "approve" | "reject" | "cancel" | "complete";

const labels: Record<Action, string> = {
  approve: "approved",
  reject: "rejected",
  cancel: "cancelled",
  complete: "completed",
};

export function usePurchaseReturnAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: Action) => {
      switch (action) {
        case "approve":
          return purchaseReturnService.approvePurchaseReturn(id);
        case "reject":
          return purchaseReturnService.rejectPurchaseReturn(id);
        case "cancel":
          return purchaseReturnService.cancelPurchaseReturn(id);
        case "complete":
          return purchaseReturnService.completePurchaseReturn(id);
      }
    },
    onSuccess: (_data, action) => {
      toast.success(`Purchase return ${labels[action]}`);
      queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to update purchase return"),
      );
    },
  });
}
