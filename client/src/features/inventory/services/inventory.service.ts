import axios from "axios";

const getInventory = async (search: string) => {
  const response = await axios.get(`/inventory?search=${search}`);
  return response.data;
};

const getInventoryById = async (id: string) => {
  const response = await axios.get(`/inventory/${id}`);
  return response.data;
};

const inventoryAdjust = async (id: string, adjustment: number) => {
  const response = await axios.post(`/inventory/${id}/adjust`, { adjustment });
  return response.data;
};
const inventoryHistory = async (id: string) => {
  const response = await axios.get(`/inventory/${id}/history`);
  return response.data;
};

export const inventoryService = {
  getInventory,
  getInventoryById,
  inventoryAdjust,
  inventoryHistory,
};
