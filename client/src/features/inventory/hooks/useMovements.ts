import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { inventoryService } from "../services/inventory.service";
import type {
  InventoryMovementParams,
  ReconciliationRow,
  StockOperationInput,
} from "../types/inventory.types";

const allInventory = ["inventory"] as const;

export const inventoryKeys = {
  all: allInventory,
  movements: (params: InventoryMovementParams) =>
    [...allInventory, "movements", params] as const,
  reconciliation: [...allInventory, "reconciliation"] as const,
};

export function useMovements(params: InventoryMovementParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.movements(params),
    queryFn: () => inventoryService.getMovements(params),
  });
}

export function useReconciliation() {
  return useQuery<ReconciliationRow[]>({
    queryKey: inventoryKeys.reconciliation,
    queryFn: inventoryService.getReconciliation,
  });
}

export function useSyncInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      medicineId,
      remarks,
    }: {
      medicineId: string;
      remarks?: string;
    }) => inventoryService.syncInventory(medicineId, remarks),
    onSuccess: () => {
      toast.success("Inventory synced from batches");
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to sync inventory"));
    },
  });
}

export function useReserveStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      medicineId,
      data,
    }: {
      medicineId: string;
      data: StockOperationInput;
    }) => inventoryService.reserveStock(medicineId, data),
    onSuccess: () => {
      toast.success("Stock reserved");
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to reserve stock"));
    },
  });
}

export function useReleaseStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      medicineId,
      data,
    }: {
      medicineId: string;
      data: StockOperationInput;
    }) => inventoryService.releaseStock(medicineId, data),
    onSuccess: () => {
      toast.success("Reserved stock released");
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to release stock"));
    },
  });
}
