import { useQuery } from "@tanstack/react-query";
import { batchService, type BatchListParams } from "../services/batch.service";

const allBatches = ["batches"] as const;

export const batchKeys = {
  all: allBatches,
  list: (params: BatchListParams) =>
    [...allBatches, "list", params] as const,
  detail: (id: string) => [...allBatches, "detail", id] as const,
  history: (id: string) => [...allBatches, "history", id] as const,
  expired: [...allBatches, "expired"] as const,
  lowStock: [...allBatches, "low-stock"] as const,
  awaitingDisposal: [...allBatches, "awaiting-disposal"] as const,
};

export const useBatches = (
  params: BatchListParams = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: batchKeys.list(params),
    queryFn: () => batchService.getBatches(params),
    enabled,
  });
};

export const useBatch = (id: string) => {
  return useQuery({
    queryKey: batchKeys.detail(id),
    queryFn: () => batchService.getBatchById(id),
    enabled: !!id,
  });
};

export const useExpiredBatches = (enabled = true) => {
  return useQuery({
    queryKey: batchKeys.expired,
    queryFn: batchService.getExpiredBatches,
    enabled,
  });
};

export const useLowStockBatches = (enabled = true) => {
  return useQuery({
    queryKey: batchKeys.lowStock,
    queryFn: () => batchService.getLowStockBatches(),
    enabled,
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

export const useExpiredAwaitingDisposal = (enabled = true) => {
  return useQuery({
    queryKey: batchKeys.awaitingDisposal,
    queryFn: batchService.getExpiredAwaitingDisposal,
    enabled,
  });
};

export const useBatchHistory = (id: string, enabled = true) => {
  return useQuery({
    queryKey: batchKeys.history(id),
    queryFn: () => batchService.getBatchHistory(id),
    enabled: Boolean(id) && enabled,
  });
};
