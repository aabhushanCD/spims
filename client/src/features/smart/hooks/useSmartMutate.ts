import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { smartReorderService } from "../services/smart.service";
import type { ManualReorderInput } from "../types/smart.types";
import { smartKeys } from "./useSmartQuery";

function useInvalidateReorders() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: smartKeys.all });
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export const useGenerateAllRecommendations = () => {
  const invalidate = useInvalidateReorders();

  return useMutation({
    mutationFn: smartReorderService.generateAll,
    onSuccess: (result) => {
      toast.success(`Generated recommendations for ${result.results.length} medicines`);
      invalidate();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to generate recommendations"),
      );
    },
  });
};

export const useGenerateRecommendation = () => {
  const invalidate = useInvalidateReorders();

  return useMutation({
    mutationFn: smartReorderService.generateForMedicine,
    onSuccess: () => {
      toast.success("Recommendation generated");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to generate recommendation"),
      );
    },
  });
};

export const useCreateManualRecommendation = () => {
  const invalidate = useInvalidateReorders();

  return useMutation({
    mutationFn: (data: ManualReorderInput) =>
      smartReorderService.createManual(data),
    onSuccess: () => {
      toast.success("Manual recommendation created");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to create recommendation"),
      );
    },
  });
};

export const useApproveRecommendation = () => {
  const invalidate = useInvalidateReorders();

  return useMutation({
    mutationFn: ({
      id,
      createPurchaseOrder = false,
    }: {
      id: string;
      createPurchaseOrder?: boolean;
    }) => smartReorderService.approve(id, createPurchaseOrder),
    onSuccess: (recommendation) => {
      toast.success(
        recommendation.purchaseOrderId
          ? "Recommendation approved and draft PO created"
          : "Recommendation approved",
      );
      invalidate();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to approve recommendation"),
      );
    },
  });
};

export const useRejectRecommendation = () => {
  const invalidate = useInvalidateReorders();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      smartReorderService.reject(id, reason),
    onSuccess: () => {
      toast.success("Recommendation rejected");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to reject recommendation"),
      );
    },
  });
};

export const useDeleteRecommendation = () => {
  const invalidate = useInvalidateReorders();

  return useMutation({
    mutationFn: smartReorderService.remove,
    onSuccess: () => {
      toast.success("Recommendation deleted");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to delete recommendation"),
      );
    },
  });
};
