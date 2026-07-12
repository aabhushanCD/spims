import { api } from "@/api/fetch.api";

const createPurchaseOrder = async (purchaseOrderData: any) => {
  const response = await api.post("/purchases", purchaseOrderData);
  return response.data;
};

const getPurchaseOrders = async () => {
  const response = await api.get("/purchases");
  return response.data;
};

const getPurchaseOrderById = async (id: string) => {
  const response = await api.get(`/purchases/${id}`);
  return response.data;
};

const updatePurchaseOrder = async (id: string, purchaseOrderData: any) => {
  const response = await api.put(`/purchases/${id}`, purchaseOrderData);
  return response.data;
};

const deletePurchaseOrder = async (id: string) => {
  const response = await api.delete(`/purchases/${id}`);
  return response.data;
};

export const purchaseService = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
};
