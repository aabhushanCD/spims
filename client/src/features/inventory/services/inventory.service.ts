import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  InventoryItem,
  InventoryMovement,
  InventoryMovementPage,
  InventoryMovementParams,
  ReconciliationRow,
  StockOperationInput,
} from "../types/inventory.types";

const toInventoryPage = (
  response: ApiResponse<{
    items: InventoryItem[];
    nextCursor: string | null;
  }>,
): ApiResponse<InventoryItem[]> => ({
  success: response.success,
  data: response.data.items,
});

const getInventory = async (
  search: string,
): Promise<ApiResponse<InventoryItem[]>> => {
  const response = await api.get<
    ApiResponse<{ items: InventoryItem[]; nextCursor: string | null }>
  >(`/inventory?search=${encodeURIComponent(search)}&limit=100`);
  return toInventoryPage(response.data);
};

const getAllInventories = async (): Promise<ApiResponse<InventoryItem[]>> => {
  const response = await api.get<
    ApiResponse<{ items: InventoryItem[]; nextCursor: string | null }>
  >(`/inventory?limit=100`);
  return toInventoryPage(response.data);
};
const getInventoryById = async (id: string) => {
  const response = await api.get(`/inventory/${id}`);
  return response.data;
};

const getMovements = async (
  params: InventoryMovementParams = {},
): Promise<InventoryMovementPage> => {
  const response = await api.get<ApiResponse<InventoryMovementPage>>(
    "/inventory/movements",
    {
      params: {
        limit: 100,
        ...(params.cursor ? { cursor: params.cursor } : {}),
        ...(params.movementType ? { movementType: params.movementType } : {}),
        ...(params.referenceType
          ? { referenceType: params.referenceType }
          : {}),
        ...(params.from ? { from: params.from } : {}),
        ...(params.to ? { to: params.to } : {}),
      },
    },
  );
  return response.data.data;
};

const getMovementById = async (id: string): Promise<InventoryMovement> => {
  const response = await api.get<ApiResponse<InventoryMovement>>(
    `/inventory/movements/${id}`,
  );
  return response.data.data;
};

const getReconciliation = async (): Promise<ReconciliationRow[]> => {
  const response = await api.get<ApiResponse<ReconciliationRow[]>>(
    "/inventory/reconciliation",
  );
  return response.data.data;
};

const syncInventory = async (medicineId: string, remarks?: string) => {
  const response = await api.post(
    `/inventory/${medicineId}/sync`,
    remarks ? { remarks } : {},
  );
  return response.data;
};

const reserveStock = async (
  medicineId: string,
  data: StockOperationInput,
) => {
  const response = await api.post(
    `/inventory/${medicineId}/reserve`,
    data,
  );
  return response.data;
};

const releaseStock = async (
  medicineId: string,
  data: StockOperationInput,
) => {
  const response = await api.post(
    `/inventory/${medicineId}/release`,
    data,
  );
  return response.data;
};

export const inventoryService = {
  getAllInventories,
  getInventory,
  getInventoryById,
  getMovements,
  getMovementById,
  getReconciliation,
  syncInventory,
  reserveStock,
  releaseStock,
};
