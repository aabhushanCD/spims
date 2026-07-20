// features/batch/hooks/useMutateBatch.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { batchService } from "../services/batch.service";

export const useCreateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchService.createBatch,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["batches"],
      });
    },
  });
};

export const useUpdateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      batchService.updateBatch(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["batches"],
      });
    },
  });
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchService.deleteBatch,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["batches"],
      });
    },
  });
};

export const useMarkExpiredBatches = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchService.markExpiredBatches,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expired-batches", "batches"],
      });
    },
  });
};

export const useConfirmDisposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchService.confirmDisposal,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expired-awaiting-disposal"],
      });
    },
  });
};

export const useDeductQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        quantity: number;
      };
    }) => batchService.deductQuantity(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["batches"],
      });
    },
  });
};

export const useIncreaseQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        quantity: number;
      };
    }) => batchService.increaseQuantity(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["batches"],
      });
    },
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        quantity: number;
        reason?: string;
      };
    }) => batchService.adjustStock(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["batches"],
      });
    },
  });
};
