import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  GenerateAllResult,
  ManualReorderInput,
  ReorderListStatus,
  ReorderRecommendation,
} from "../types/smart.types";

const getAll = async (
  status?: ReorderListStatus,
): Promise<ReorderRecommendation[]> => {
  const response = await api.get<ApiResponse<ReorderRecommendation[]>>(
    "/smart-reorders",
    { params: status ? { status } : {} },
  );
  return response.data.data;
};

const getPending = async (): Promise<ReorderRecommendation[]> => {
  const response = await api.get<ApiResponse<ReorderRecommendation[]>>(
    "/smart-reorders/pending",
  );
  return response.data.data;
};

const getById = async (id: string): Promise<ReorderRecommendation> => {
  const response = await api.get<ApiResponse<ReorderRecommendation>>(
    `/smart-reorders/${id}`,
  );
  return response.data.data;
};

const getByMedicineId = async (
  medicineId: string,
): Promise<ReorderRecommendation[]> => {
  const response = await api.get<ApiResponse<ReorderRecommendation[]>>(
    `/smart-reorders/medicine/${medicineId}`,
  );
  return response.data.data;
};

const generateAll = async (): Promise<GenerateAllResult> => {
  const response = await api.post<ApiResponse<GenerateAllResult>>(
    "/smart-reorders/generate",
  );
  return response.data.data;
};

const generateForMedicine = async (
  medicineId: string,
): Promise<ReorderRecommendation> => {
  const response = await api.post<ApiResponse<ReorderRecommendation>>(
    `/smart-reorders/generate/${medicineId}`,
  );
  return response.data.data;
};

const createManual = async (
  data: ManualReorderInput,
): Promise<ReorderRecommendation> => {
  const response = await api.post<ApiResponse<ReorderRecommendation>>(
    "/smart-reorders",
    data,
  );
  return response.data.data;
};

const approve = async (
  id: string,
  createPurchaseOrder = false,
): Promise<ReorderRecommendation> => {
  const response = await api.patch<ApiResponse<ReorderRecommendation>>(
    `/smart-reorders/${id}/approve`,
    { createPurchaseOrder },
  );
  return response.data.data;
};

const reject = async (
  id: string,
  reason?: string,
): Promise<ReorderRecommendation> => {
  const response = await api.patch<ApiResponse<ReorderRecommendation>>(
    `/smart-reorders/${id}/reject`,
    reason ? { reason } : {},
  );
  return response.data.data;
};

const remove = async (id: string): Promise<void> => {
  await api.delete(`/smart-reorders/${id}`);
};

export const smartReorderService = {
  getAll,
  getPending,
  getById,
  getByMedicineId,
  generateAll,
  generateForMedicine,
  createManual,
  approve,
  reject,
  remove,
};
