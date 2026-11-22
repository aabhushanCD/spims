import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type { PurchaseForm } from "../schema/purchase.schema";
import type { ReceivePurchaseForm } from "../schema/receivePurchase.schema";
import type { PurchaseDetails } from "../types/PurchaseDetails";
import type {
  PurchaseListItem,
  SupplierPerformance,
} from "../types/purchase.types";
import {
  buildPurchaseListParams,
  type PurchaseListParams,
} from "../lib/purchaseQuery";

export interface PurchasePage {
  items: PurchaseListItem[];
  nextCursor: string | null;
}

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
  const response = await api.get<ApiResponse<PurchasePage>>(
    "/purchases?limit=100",
  );
  return response.data.data.items;
};

const getPurchasePage = async (
  params: PurchaseListParams = {},
): Promise<PurchasePage> => {
  const response = await api.get<ApiResponse<PurchasePage>>("/purchases", {
    params: buildPurchaseListParams(params),
  });
  return response.data.data;
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

const uploadInvoice = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/purchases/${id}/invoice`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const downloadInvoice = async (id: string): Promise<Blob> => {
  const response = await api.get(`/purchases/${id}/invoice`, {
    responseType: "blob",
  });
  return response.data as Blob;
};

const getSupplierPerformance = async (
  supplierId: string,
): Promise<SupplierPerformance> => {
  const response = await api.get<ApiResponse<SupplierPerformance>>(
    `/purchases/suppliers/${supplierId}/performance`,
  );
  return response.data.data;
};

export const purchaseService = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchasePage,
  getPurchaseOrderById,
  addPurchaseOrderItem,
  updatePurchaseOrderItem,
  removePurchaseOrderItem,
  recalculatePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  receivePurchase,
  approvePurchaseOrder,
  uploadInvoice,
  downloadInvoice,
  getSupplierPerformance,
};
