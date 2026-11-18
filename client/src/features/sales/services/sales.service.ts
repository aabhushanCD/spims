import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  CreateSaleInput,
  InventorySearchResult,
  SaleDetails,
  SalesListItem,
  SalesQueryParams,
} from "../types/sale.types";

const getSales = async (
  params: SalesQueryParams,
): Promise<ApiResponse<SalesListItem[]>> => {
  const response = await api.get<ApiResponse<SalesListItem[]>>("/sales", {
    params,
  });
  return response.data;
};

const getSaleById = async (saleId: string): Promise<SaleDetails> => {
  const response = await api.get<ApiResponse<SaleDetails>>(`/sales/${saleId}`);
  return response.data.data;
};

const createSale = async (saleData: CreateSaleInput): Promise<SaleDetails> => {
  const response = await api.post<ApiResponse<SaleDetails>>("/sales", saleData);
  return response.data.data;
};

const cancelSale = async (
  saleId: string,
  reason?: string,
): Promise<SaleDetails> => {
  const response = await api.patch<ApiResponse<SaleDetails>>(
    `/sales/${saleId}/cancel`,
    { reason },
  );
  return response.data.data;
};

const updateSale = async (
  saleId: string,
  saleData: Partial<CreateSaleInput>,
): Promise<SaleDetails> => {
  const response = await api.put<ApiResponse<SaleDetails>>(
    `/sales/${saleId}`,
    saleData,
  );
  return response.data.data;
};

const deleteSale = async (saleId: string): Promise<void> => {
  await api.delete(`/sales/${saleId}`);
};

const searchMedicines = async (
  query: string,
): Promise<InventorySearchResult[]> => {
  const response = await api.get<ApiResponse<InventorySearchResult[]>>(
    "/inventory/medicines/search",
    {
      params: { query },
    },
  );
  return response.data.data;
};

export const salesService = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  cancelSale,
  searchMedicines,
};
