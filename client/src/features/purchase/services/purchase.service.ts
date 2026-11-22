import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type { PurchaseForm } from "../schema/purchase.schema";
import type { ReceivePurchaseForm } from "../schema/receivePurchase.schema";
import type { PurchaseDetails } from "../types/PurchaseDetails";
import type { PurchaseListItem } from "../types/purchase.types";

const createPurchaseOrder = async (
  purchaseOrderData: PurchaseForm,
): Promise<PurchaseDetails> => {
  const response = await api.post<ApiResponse<PurchaseDetails>>(
    "/purchases",
    purchaseOrderData,
  );
  return response.data.data;
};

const getPurchaseOrders = async (): Promise<PurchaseListItem[]> => {
  const response = await api.get<
    ApiResponse<{ items: PurchaseListItem[]; nextCursor: string | null }>
  >("/purchases?limit=100");
  return response.data.data.items;
};

const getPurchaseOrderById = async (id: string): Promise<PurchaseDetails> => {
  const response = await api.get<ApiResponse<PurchaseDetails>>(
    `/purchases/${id}`,
  );
  return response.data.data;
};

const addPurchaseOrderItem = async (
  id: string,
  data: { medicineId: string; quantity: number; purchasePrice: number },
) => {
  const response = await api.post(`/purchases/${id}/items`, data);
  return response.data;
};

const updatePurchaseOrderItem = async (
  id: string,
  itemId: string,
  data: { quantity?: number; purchasePrice?: number },
) => {
  const response = await api.patch(`/purchases/${id}/items/${itemId}`, data);
  return response.data;
};

const removePurchaseOrderItem = async (id: string, itemId: string) => {
  const response = await api.delete(`/purchases/${id}/items/${itemId}`);
  return response.data;
};

const recalculatePurchaseOrder = async (id: string) => {
  const response = await api.patch(`/purchases/${id}/recalculate`);
  return response.data;
};

const cancelPurchaseOrder = async (id: string) => {
  const response = await api.patch(`/purchases/${id}/cancel`);
  return response.data;
};

const deletePurchaseOrder = async (id: string): Promise<void> => {
  await api.delete(`/purchases/${id}`);
};

const receivePurchase = async (id: string, data: ReceivePurchaseForm) => {
  const response = await api.post(`/purchases/${id}/receive`, data);
  return response.data;
};

const approvePurchaseOrder = async (id: string) => {
  const response = await api.patch(`/purchases/${id}/approve`);
  return response.data;
};

export const purchaseService = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  addPurchaseOrderItem,
  updatePurchaseOrderItem,
  removePurchaseOrderItem,
  recalculatePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  receivePurchase,
  approvePurchaseOrder,
};
