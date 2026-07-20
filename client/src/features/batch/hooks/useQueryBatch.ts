// features/batch/hooks/useQueryBatch.ts

import { useQuery } from "@tanstack/react-query";
import { batchService } from "../services/batch.service";

export const useBatches = () => {
  return useQuery({
    queryKey: ["batches"],
    queryFn: batchService.getAllBatches,
  });
};

export const useBatch = (id: string) => {
  return useQuery({
    queryKey: ["batch", id],
    queryFn: () => batchService.getBatchById(id),
    enabled: !!id,
  });
};

export const useExpiredBatches = () => {
  return useQuery({
    queryKey: ["expired-batches"],
    queryFn: batchService.getExpiredBatches,
  });
};

export const useLowStockBatches = () => {
  return useQuery({
    queryKey: ["low-stock-batches"],
    queryFn: batchService.getLowStockBatches,
  });
};

export const useMedicineBatches = (medicineId: string) => {
  return useQuery({
    queryKey: ["medicine-batches", medicineId],

    queryFn: () => batchService.getBatchByMedicineId(medicineId),

    enabled: !!medicineId,
  });
};

export const useAvailableBatches = (medicineId: string) => {
  return useQuery({
    queryKey: ["available-batches", medicineId],

    queryFn: () => batchService.getAvailableBatches(medicineId),

    enabled: !!medicineId,
  });
};

export const useExpiredAwaitingDisposal = () => {
  return useQuery({
    queryKey: ["expired-awaiting-disposal"],

    queryFn: batchService.getExpiredAwaitingDisposal,
  });
};

export const useBatchHistory = (id: string) => {
  return useQuery({
    queryKey: ["batch-history", id],

    queryFn: () => batchService.getBatchHistory(id),

    enabled: !!id,
  });
};
