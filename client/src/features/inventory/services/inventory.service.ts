import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type { InventoryItem } from "../types/inventory.types";

const getInventory = async (
  search: string,
): Promise<ApiResponse<InventoryItem[]>> => {
  const response = await api.get<ApiResponse<InventoryItem[]>>(
    `/inventory?search=${search}`,
  );
  return response.data;
};

const getAllInventories = async (): Promise<ApiResponse<InventoryItem[]>> => {
  const response = await api.get<ApiResponse<InventoryItem[]>>(`/inventory`);
  return response.data;
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
