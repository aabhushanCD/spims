import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
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
  >("/sales", { params: { ...params, limit: 100 } });
  return { success: response.data.success, data: response.data.data.items };
};

const getSaleById = async (saleId: string): Promise<SaleDetails> => {
  const response = await api.get<ApiResponse<SaleInvoicePayload>>(
    `/sales/${saleId}/invoice`,
  );
  const { sale, items } = response.data.data;

  return {
    _id: sale._id,
    id: sale._id,
    invoiceNo: sale.invoiceNumber,
    customerName: sale.customerName,
    customerPhone: sale.customerId?.phone,
    cashierName: sale.cashierId?.name ?? "-",
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    createdAt: sale.saleDate,
    items: items.map((item) => {
      const gross = item.unitPrice * item.quantity;
      return {
        id: item._id,
        medicineId: item.medicineId._id,
        medicineName: item.medicineId.medicineName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercentage:
          gross > 0 ? Math.round((item.discount / gross) * 1000) / 10 : 0,
        vatPercentage: item.vatRate ?? 13,
        total: item.totalPrice,
      };
    }),
    subtotal: sale.subTotal,
    discountTotal: sale.discount,
    vatTotal: sale.VAT,
    grandTotal: sale.totalAmount,
  };
};

const createSale = async (saleData: CreateSaleInput): Promise<SaleDetails> => {
  const response = await api.post<ApiResponse<SaleDetails>>("/sales", saleData);
  return response.data.data;
};

const cancelSale = async (saleId: string): Promise<void> => {
  await api.delete(`/sales/${saleId}`);
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
  cancelSale,
  searchMedicines,
};
