import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";

export interface SaleItemCorrection {
  unitPrice?: number;
  discount?: number;
}

export interface CorrectedSaleItem {
  _id: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

const correctSaleItem = async (
  itemId: string,
  data: SaleItemCorrection,
): Promise<CorrectedSaleItem> => {
  const response = await api.patch<ApiResponse<CorrectedSaleItem>>(
    `/sale-items/${itemId}`,
    data,
  );
  return response.data.data;
};

export const saleItemService = {
  correctSaleItem,
};
