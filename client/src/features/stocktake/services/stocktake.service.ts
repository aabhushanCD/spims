import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  Stocktake,
  StocktakeInput,
  StocktakeListParams,
} from "../types/stocktake.types";

export interface StocktakePage {
  items: Stocktake[];
  nextCursor: string | null;
}

const getStocktakes = async (
  params: StocktakeListParams = {},
): Promise<StocktakePage> => {
  const response = await api.get<ApiResponse<StocktakePage>>("/stocktakes", {
    params: {
      limit: 100,
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return response.data.data;
};

const getStocktakeById = async (id: string): Promise<Stocktake> => {
  const response = await api.get<ApiResponse<Stocktake>>(`/stocktakes/${id}`);
  return response.data.data;
};

const createStocktake = async (data: StocktakeInput): Promise<Stocktake> => {
  const response = await api.post<ApiResponse<Stocktake>>("/stocktakes", data);
  return response.data.data;
};

const updateStocktake = async (
  id: string,
  data: Partial<StocktakeInput>,
): Promise<Stocktake> => {
  const response = await api.patch<ApiResponse<Stocktake>>(
    `/stocktakes/${id}`,
    data,
  );
  return response.data.data;
};

const completeStocktake = async (id: string): Promise<Stocktake> => {
  const response = await api.post<ApiResponse<Stocktake>>(
    `/stocktakes/${id}/complete`,
  );
  return response.data.data;
};

const cancelStocktake = async (id: string): Promise<Stocktake> => {
  const response = await api.post<ApiResponse<Stocktake>>(
    `/stocktakes/${id}/cancel`,
  );
  return response.data.data;
};

export const stocktakeService = {
  getStocktakes,
  getStocktakeById,
  createStocktake,
  updateStocktake,
  completeStocktake,
  cancelStocktake,
};
