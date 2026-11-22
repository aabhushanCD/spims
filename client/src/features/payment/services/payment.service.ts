import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  AddPaymentInput,
  SalePayment,
  SalePaymentsPage,
} from "../types/payment.types";

const getSalePayments = async (saleId: string): Promise<SalePaymentsPage> => {
  const response = await api.get<ApiResponse<SalePaymentsPage>>(
    `/sales/${saleId}/payments`,
  );
  return response.data.data;
};

const addSalePayment = async (
  saleId: string,
  data: AddPaymentInput,
): Promise<SalePayment> => {
  const response = await api.post<ApiResponse<SalePayment>>(
    `/sales/${saleId}/payments`,
    data,
  );
  return response.data.data;
};

export const paymentService = {
  getSalePayments,
  addSalePayment,
};
