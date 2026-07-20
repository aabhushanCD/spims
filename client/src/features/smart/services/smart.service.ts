// features/smart-reorder/services/smartReorder.service.ts

import { api } from "@/api/fetch.api";

const getAll = async () => {
  const response = await api.get("/smart-reorders");
  return response.data.data;
};

const getPending = async () => {
  const response = await api.get("/smart-reorders/pending");
  return response.data.data;
};

const getById = async (id: string) => {
  const response = await api.get(`/smart-reorders/${id}`);
  return response.data.data;
};

const getByMedicineId = async (medicineId: string) => {
  const response = await api.get(`/smart-reorders/medicine/${medicineId}`);
  return response.data.data;
};

const generateAll = async () => {
  const response = await api.post("/smart-reorders/generate");
  return response.data.data;
};

const generateForMedicine = async (medicineId: string) => {
  const response = await api.post(`/smart-reorders/generate/${medicineId}`);
  return response.data.data;
};

const approve = async (id: string) => {
  const response = await api.patch(`/smart-reorders/${id}/approve`);
  return response.data.data;
};

const reject = async (id: string) => {
  const response = await api.patch(`/smart-reorders/${id}/reject`);
  return response.data.data;
};

const remove = async (id: string) => {
  const response = await api.delete(`/smart-reorders/${id}`);
  return response.data.data;
};

export const smartReorderService = {
  getAll,
  getPending,
  getById,
  getByMedicineId,
  generateAll,
  generateForMedicine,
  approve,
  reject,
  remove,
};
