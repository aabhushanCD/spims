import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import { mapInvoiceToSaleDetails } from "../lib/invoiceMapper";
import { buildSalesListParams } from "../lib/salesQuery";
import type {
  CreateSaleInput,
  InventorySearchResult,
  SaleDetails,
  SaleInvoicePayload,
  SalesListItem,
  SalesQueryParams,
} from "../types/sale.types";

const getSales = async (
  params: SalesQueryParams,
): Promise<ApiResponse<SalesListItem[]>> => {
  const response = await api.get<
    ApiResponse<{ items: SalesListItem[]; nextCursor: string | null }>
  >("/sales", {
    params: buildSalesListParams(params),
  });
  return { success: response.data.success, data: response.data.data.items };
};

const getSaleById = async (saleId: string): Promise<SaleDetails> => {
  const response = await api.get<ApiResponse<SaleInvoicePayload>>(
    `/sales/${saleId}/invoice`,
  );

  return mapInvoiceToSaleDetails(response.data.data);
};

const createSale = async (saleData: CreateSaleInput): Promise<SaleDetails> => {
  const response = await api.post<ApiResponse<SaleDetails>>("/sales", saleData);
  return response.data.data;
};

const updateSale = async (
  saleId: string,
  saleData: Partial<CreateSaleInput>,
): Promise<SaleDetails> => {
  const response = await api.patch<ApiResponse<SaleDetails>>(
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
  searchMedicines,
};
