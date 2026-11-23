import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import {
  batchService,
  type BatchListParams,
  type CreateBatchInput,
  type UpdateBatchInput,
} from "../services/batch.service";
import { batchKeys } from "./useQueryBatch";

function useInvalidateBatch() {
  const queryClient = useQueryClient();

  return (id?: string, _variables?: unknown) => {
    queryClient.invalidateQueries({ queryKey: batchKeys.all });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: batchKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: batchKeys.history(id) });
    }
  };
}

export const useCreateBatch = () => {
  const invalidate = useInvalidateBatch();

  return useMutation({
    mutationFn: (data: CreateBatchInput) => batchService.createBatch(data),
    onSuccess: (batch) => {
      toast.success(`Batch ${batch.batchNumber} created`);
      invalidate(batch._id);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create batch"));
    },
  });
};

export const useUpdateBatch = () => {
  const invalidate = useInvalidateBatch();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBatchInput }) =>
      batchService.updateBatch(id, data),
    onSuccess: (batch) => {
      toast.success("Batch updated");
      invalidate(batch._id);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update batch"));
    },
  });
};

export const useDeleteBatch = () => {
  const invalidate = useInvalidateBatch();

  return useMutation({
    mutationFn: batchService.deleteBatch,
    onSuccess: () => {
      toast.success("Batch deleted");
      invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete batch"));
    },
  });
};

export const useMarkExpiredBatches = () => {
  const invalidate = useInvalidateBatch();

  return useMutation({
    mutationFn: batchService.markExpiredBatches,
    onSuccess: () => {
      toast.success("Expired batches marked");
      invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to mark expired batches"));
    },
  });
};

export const useConfirmDisposal = () => {
  const invalidate = useInvalidateBatch();

  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      batchService.confirmDisposal(id, remarks),
    onSuccess: (_data, variables) => {
      toast.success("Expired stock disposed");
      invalidate(variables.id);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to dispose batch"));
    },
  });
};

export const useDeductQuantity = () => {
  const invalidate = useInvalidateBatch();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { quantity: number; remarks?: string };
    }) => batchService.deductQuantity(id, data),
    onSuccess: (_data, variables) => {
      toast.success("Batch stock deducted");
      invalidate(variables.id);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to deduct stock"));
    },
  });
};

export const useIncreaseQuantity = () => {
  const invalidate = useInvalidateBatch();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { quantity: number; remarks?: string };
    }) => batchService.increaseQuantity(id, data),
    onSuccess: (_data, variables) => {
      toast.success("Batch stock increased");
      invalidate(variables.id);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to increase stock"));
    },
  });
};

export const useAdjustStock = () => {
  const invalidate = useInvalidateBatch();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { quantity: number; remarks?: string };
    }) => batchService.adjustStock(id, data),
    onSuccess: (_data, variables) => {
      toast.success("Batch stock adjusted");
      invalidate(variables.id);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to adjust stock"));
    },
  });
};

export type { BatchListParams };
