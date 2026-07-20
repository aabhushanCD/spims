// features/batch/services/batch.service.ts

import { api } from "@/api/fetch.api";

const getAllBatches = async () => {
  const response = await api.get("/batches");
  return response.data;
};

const getBatchById = async (id: string) => {
  const response = await api.get(`/batches/${id}`);
  return response.data;
};

const getExpiredBatches = async () => {
  const response = await api.get("/batches/expired");
  return response.data;
};

const getLowStockBatches = async () => {
  const response = await api.get("/batches/low-stock");
  return response.data;
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

const allocateStock = async (medicineId: string) => {
  const response = await api.get(`/batches/medicine/${medicineId}/allocate`);

  return response.data;
};

const getExpiredAwaitingDisposal = async () => {
  const response = await api.get("/batches/expired/awaiting-disposal");

  return response.data;
};

const createBatch = async (data: unknown) => {
  const response = await api.post("/batches", data);

  return response.data;
};

const updateBatch = async (id: string, data: unknown) => {
  const response = await api.patch(`/batches/${id}`, data);

  return response.data;
};

const deleteBatch = async (id: string) => {
  const response = await api.delete(`/batches/${id}`);

  return response.data;
};

const deductQuantity = async (
  id: string,
  data: {
    quantity: number;
  },
) => {
  const response = await api.post(`/batches/${id}/deduct`, data);

  return response.data;
};

const increaseQuantity = async (
  id: string,
  data: {
    quantity: number;
  },
) => {
  const response = await api.post(`/batches/${id}/increase`, data);

  return response.data;
};

const adjustStock = async (
  id: string,
  data: {
    quantity: number;
    reason?: string;
  },
) => {
  const response = await api.post(`/batches/${id}/adjust`, data);

  return response.data;
};

const getBatchHistory = async (id: string) => {
  const response = await api.get(`/batches/${id}/history`);

  return response.data;
};

const confirmDisposal = async (id: string) => {
  const response = await api.post(`/batches/${id}/confirm-disposal`);

  return response.data;
};

export const batchService = {
  getAllBatches,
  getBatchById,

  getExpiredBatches,
  getLowStockBatches,
  markExpiredBatches,

  getBatchByMedicineId,
  getAvailableBatches,
  allocateStock,

  getExpiredAwaitingDisposal,

  createBatch,
  updateBatch,
  deleteBatch,

  deductQuantity,
  increaseQuantity,
  adjustStock,

  getBatchHistory,
  confirmDisposal,
};
