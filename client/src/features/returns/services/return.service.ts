import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  CreateReturnInput,
  ReturnListParams,
  SalesReturn,
} from "../types/return.types";

export interface ReturnPage {
  items: SalesReturn[];
  nextCursor: string | null;
}

const getReturns = async (
  params: ReturnListParams = {},
): Promise<ReturnPage> => {
  const search = params.search?.trim();

  const response = await api.get<ApiResponse<ReturnPage>>("/returns", {
    params: {
      limit: 100,
      ...(search ? { search } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.salesId ? { salesId: params.salesId } : {}),
    },
  });

  return response.data.data;
};

const getReturnById = async (id: string): Promise<SalesReturn> => {
  const response = await api.get<ApiResponse<SalesReturn>>(`/returns/${id}`);
  return response.data.data;
};

const createReturn = async (data: CreateReturnInput): Promise<SalesReturn> => {
  const response = await api.post<ApiResponse<SalesReturn>>("/returns", data);
  return response.data.data;
};

const updateReturnReason = async (
  id: string,
  returnReason: string,
): Promise<SalesReturn> => {
  const response = await api.patch<ApiResponse<SalesReturn>>(
    `/returns/${id}`,
    { returnReason },
  );
  return response.data.data;
};

const approveReturn = async (id: string): Promise<SalesReturn> => {
  const response = await api.patch<ApiResponse<SalesReturn>>(
    `/returns/${id}/approve`,
  );
  return response.data.data;
};

const rejectReturn = async (id: string): Promise<SalesReturn> => {
  const response = await api.patch<ApiResponse<SalesReturn>>(
    `/returns/${id}/reject`,
  );
  return response.data.data;
};

const cancelReturn = async (id: string): Promise<SalesReturn> => {
  const response = await api.patch<ApiResponse<SalesReturn>>(
    `/returns/${id}/cancel`,
  );
  return response.data.data;
};

const completeReturn = async (id: string): Promise<SalesReturn> => {
  const response = await api.patch<ApiResponse<SalesReturn>>(
    `/returns/${id}/complete`,
  );
  return response.data.data;
};

const reverseReturn = async (
  id: string,
  reversalReason?: string,
): Promise<SalesReturn> => {
  const response = await api.patch<ApiResponse<SalesReturn>>(
    `/returns/${id}/reverse`,
    reversalReason ? { reversalReason } : {},
  );
  return response.data.data;
};

export const returnService = {
  getReturns,
  getReturnById,
  createReturn,
  updateReturnReason,
  approveReturn,
  rejectReturn,
  cancelReturn,
  completeReturn,
  reverseReturn,
};
