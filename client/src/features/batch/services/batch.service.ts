import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type { Batch } from "../types/batch.types";

export interface BatchPage {
  items: Batch[];
  nextCursor: string | null;
}

export interface BatchListParams {
  search?: string;
  isExpired?: boolean;
  isActive?: boolean;
  expiringInDays?: number;
}

export interface CreateBatchInput {
  purchaseOrderId: string;
  medicineId: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  quantityReceived: number;
  quantityRemaining?: number;
  remarks?: string;
}

export interface UpdateBatchInput {
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  quantityRemaining?: number;
  isActive?: boolean;
  remarks?: string;
}

export interface BatchMovement {
  _id: string;
  movementType: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  remarks?: string;
  createdAt: string;
  performedBy?: { name?: string; email?: string };
}

export interface BatchHistory extends Batch {
  movements: BatchMovement[];
}

const getBatches = async (
  params: BatchListParams = {},
): Promise<BatchPage> => {
  const search = params.search?.trim();

  const response = await api.get<ApiResponse<BatchPage>>("/batches", {
    params: {
      limit: 100,
      ...(search ? { search } : {}),
      ...(params.isExpired !== undefined
        ? { isExpired: params.isExpired }
        : {}),
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params.expiringInDays !== undefined
        ? { expiringInDays: params.expiringInDays }
        : {}),
    },
  });

  return response.data.data;
};

const getBatchById = async (id: string): Promise<Batch> => {
  const response = await api.get<ApiResponse<Batch>>(`/batches/${id}`);
  return response.data.data;
};

const getBatchHistory = async (id: string): Promise<BatchHistory> => {
  const response = await api.get<ApiResponse<BatchHistory>>(
    `/batches/${id}/history`,
  );
  return response.data.data;
};

const getExpiredBatches = async (): Promise<Batch[]> => {
  const response = await api.get<ApiResponse<Batch[]>>("/batches/expired");
  return response.data.data;
};

const getLowStockBatches = async (threshold = 10): Promise<Batch[]> => {
  const response = await api.get<ApiResponse<Batch[]>>("/batches/low-stock", {
    params: { threshold },
  });
  return response.data.data;
};

const getExpiredAwaitingDisposal = async (): Promise<Batch[]> => {
  const response = await api.get<ApiResponse<Batch[]>>(
    "/batches/expired/awaiting-disposal",
  );
  return response.data.data;
};

const markExpiredBatches = async () => {
  const response = await api.post("/batches/mark-expired");
  return response.data;
};

const getBatchByMedicineId = async (medicineId: string) => {
  const response = await api.get(`/batches/medicine/${medicineId}`);
  return response.data;
};

const getAvailableBatches = async (medicineId: string) => {
  const response = await api.get(`/batches/medicine/${medicineId}/available`);
  return response.data;
};

const createBatch = async (data: CreateBatchInput) => {
  const response = await api.post<ApiResponse<Batch>>("/batches", data);
  return response.data.data;
};

const updateBatch = async (id: string, data: UpdateBatchInput) => {
  const response = await api.patch<ApiResponse<Batch>>(`/batches/${id}`, data);
  return response.data.data;
};

const deleteBatch = async (id: string) => {
  const response = await api.delete(`/batches/${id}`);
  return response.data;
};

const deductQuantity = async (
  id: string,
  data: { quantity: number; remarks?: string },
) => {
  const response = await api.post(`/batches/${id}/deduct`, data);
  return response.data;
};

const increaseQuantity = async (
  id: string,
  data: { quantity: number; remarks?: string },
) => {
  const response = await api.post(`/batches/${id}/increase`, data);
  return response.data;
};

const adjustStock = async (
  id: string,
  data: { quantity: number; remarks?: string },
) => {
  const response = await api.post(`/batches/${id}/adjust`, data);
  return response.data;
};

const confirmDisposal = async (id: string, remarks?: string) => {
  const response = await api.post(`/batches/${id}/confirm-disposal`, {
    ...(remarks ? { remarks } : {}),
  });
  return response.data;
};

export const batchService = {
  getBatches,
  getBatchById,
  getBatchHistory,
  getExpiredBatches,
  getLowStockBatches,
  getExpiredAwaitingDisposal,
  markExpiredBatches,
  getBatchByMedicineId,
  getAvailableBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  deductQuantity,
  increaseQuantity,
  adjustStock,
  confirmDisposal,
};
