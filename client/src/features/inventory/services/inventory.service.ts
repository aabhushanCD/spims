import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type { InventoryItem } from "../types/inventory.types";

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
  >(`/inventory?search=${search}&limit=100`);
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

const inventoryAdjust = async (id: string, adjustment: number) => {
  const response = await api.post(`/inventory/${id}/adjust`, { adjustment });
  return response.data;
};
const inventoryHistory = async (id: string) => {
  const response = await api.get(`/inventory/${id}/history`);
  return response.data;
};

export const inventoryService = {
  getAllInventories,
  getInventory,
  getInventoryById,
  inventoryAdjust,
  inventoryHistory,
};
