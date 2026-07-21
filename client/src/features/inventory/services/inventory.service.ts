import { api } from "@/api/fetch.api";

const getInventory = async (search: string) => {
  const response = await api.get(`/inventory?search=${search}`);
  return response.data;
};

const getAllInventories = async () => {
  const response = await api.get(`/inventory`);
  return response.data;
}
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
