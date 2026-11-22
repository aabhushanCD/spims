import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { saleKeys } from "@/features/sales/hooks/useSales";
import { returnService } from "../services/return.service";
import type {
  CreateReturnInput,
  ReturnListParams,
  SalesReturn,
} from "../types/return.types";

export const returnKeys = {
  all: ["returns"] as const,
  list: (params: ReturnListParams) =>
    [...returnKeys.all, "list", params] as const,
  detail: (id: string) => [...returnKeys.all, "detail", id] as const,
};

export function useReturns(
  params: ReturnListParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: returnKeys.list(params),
    queryFn: () => returnService.getReturns(params),
    enabled,
  });
}

export function useReturn(id: string | undefined) {
  return useQuery({
    queryKey: returnKeys.detail(id ?? ""),
    queryFn: () => returnService.getReturnById(id ?? ""),
    enabled: Boolean(id),
  });
}

type TransitionAction = "approve" | "reject" | "cancel" | "complete" | "reverse";

const actionLabels: Record<TransitionAction, string> = {
  approve: "approved",
  reject: "rejected",
  cancel: "cancelled",
  complete: "completed",
  reverse: "reversed",
};

export function useReturnTransition(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      action,
      reversalReason,
    }: {
      action: TransitionAction;
      reversalReason?: string;
    }) => {
      switch (action) {
        case "approve":
          return returnService.approveReturn(id);
        case "reject":
          return returnService.rejectReturn(id);
        case "cancel":
          return returnService.cancelReturn(id);
        case "complete":
          return returnService.completeReturn(id);
        case "reverse":
          return returnService.reverseReturn(id, reversalReason);
      }
    },
    onSuccess: (updated, variables) => {
      toast.success(`Return ${actionLabels[variables.action]}`);
      queryClient.invalidateQueries({ queryKey: returnKeys.all });
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });

      const saleId = updated?.salesId;
      if (typeof saleId === "string") {
        queryClient.invalidateQueries({ queryKey: saleKeys.detail(saleId) });
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update return"));
    },
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReturnInput) =>
      returnService.createReturn(data),
    onSuccess: (created) => {
      toast.success(`Return ${created.returnNumber} created`);
      queryClient.invalidateQueries({ queryKey: returnKeys.all });
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      if (typeof created.salesId === "string") {
        queryClient.invalidateQueries({
          queryKey: saleKeys.detail(created.salesId),
        });
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create return"));
    },
  });
}

export function useUpdateReturnReason(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (returnReason: string) =>
      returnService.updateReturnReason(id, returnReason),
    onSuccess: () => {
      toast.success("Return reason updated");
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: returnKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update return"));
    },
  });
}

export type { TransitionAction, SalesReturn };
