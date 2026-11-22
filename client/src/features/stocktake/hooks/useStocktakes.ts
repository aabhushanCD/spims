import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { stocktakeService } from "../services/stocktake.service";
import type {
  StocktakeInput,
  StocktakeListParams,
} from "../types/stocktake.types";

export const stocktakeKeys = {
  all: ["stocktakes"] as const,
  list: (params: StocktakeListParams) =>
    [...stocktakeKeys.all, "list", params] as const,
  detail: (id: string) => [...stocktakeKeys.all, "detail", id] as const,
};

export function useStocktakes(params: StocktakeListParams = {}) {
  return useQuery({
    queryKey: stocktakeKeys.list(params),
    queryFn: () => stocktakeService.getStocktakes(params),
  });
}

export function useStocktake(id: string | undefined) {
  return useQuery({
    queryKey: stocktakeKeys.detail(id ?? ""),
    queryFn: () => stocktakeService.getStocktakeById(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useCreateStocktake() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StocktakeInput) =>
      stocktakeService.createStocktake(data),
    onSuccess: (created) => {
      toast.success(`Stocktake ${created.stocktakeNumber} started`);
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create stocktake"));
    },
  });
}

export function useUpdateStocktake(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<StocktakeInput>) =>
      stocktakeService.updateStocktake(id, data),
    onSuccess: () => {
      toast.success("Stocktake updated");
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update stocktake"));
    },
  });
}

export function useCompleteStocktake(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => stocktakeService.completeStocktake(id),
    onSuccess: () => {
      toast.success("Stocktake completed and stock updated");
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.all });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to complete stocktake"));
    },
  });
}

export function useCancelStocktake(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => stocktakeService.cancelStocktake(id),
    onSuccess: () => {
      toast.success("Stocktake cancelled");
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to cancel stocktake"));
    },
  });
}
