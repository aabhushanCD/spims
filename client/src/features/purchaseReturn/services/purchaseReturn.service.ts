import { api } from "@/api/fetch.api";
import type { ApiResponse } from "@/types/api";
import type {
  CreatePurchaseReturnInput,
  PurchaseReturn,
  PurchaseReturnListParams,
  SupplierLedger,
} from "../types/purchaseReturn.types";

export interface PurchaseReturnPage {
  items: PurchaseReturn[];
  nextCursor: string | null;
}

const getPurchaseReturns = async (
  params: PurchaseReturnListParams = {},
): Promise<PurchaseReturnPage> => {
  const response = await api.get<ApiResponse<PurchaseReturnPage>>(
    "/purchase-returns",
    {
      params: {
        limit: 100,
        ...(params.status ? { status: params.status } : {}),
        ...(params.supplierId ? { supplierId: params.supplierId } : {}),
        ...(params.purchaseOrderId
          ? { purchaseOrderId: params.purchaseOrderId }
          : {}),
        ...(params.from ? { from: params.from } : {}),
        ...(params.to ? { to: params.to } : {}),
        ...(params.cursor ? { cursor: params.cursor } : {}),
      },
    },
  );
  return response.data.data;
};

const getPurchaseReturnById = async (
  id: string,
): Promise<PurchaseReturn> => {
  const response = await api.get<ApiResponse<PurchaseReturn>>(
    `/purchase-returns/${id}`,
  );
  return response.data.data;
};

const createPurchaseReturn = async (
  data: CreatePurchaseReturnInput,
): Promise<PurchaseReturn> => {
  const response = await api.post<ApiResponse<PurchaseReturn>>(
    "/purchase-returns",
    data,
  );
  return response.data.data;
};

const getSupplierLedger = async (
  supplierId: string,
): Promise<SupplierLedger> => {
  const response = await api.get<ApiResponse<SupplierLedger>>(
    `/purchase-returns/suppliers/${supplierId}/ledger`,
  );
  return response.data.data;
};

const transition = async (
  id: string,
  action: "approve" | "reject" | "cancel" | "complete",
): Promise<PurchaseReturn> => {
  const response = await api.patch<ApiResponse<PurchaseReturn>>(
    `/purchase-returns/${id}/${action}`,
  );
  return response.data.data;
};

const approvePurchaseReturn = (id: string) => transition(id, "approve");
const rejectPurchaseReturn = (id: string) => transition(id, "reject");
const cancelPurchaseReturn = (id: string) => transition(id, "cancel");
const completePurchaseReturn = (id: string) => transition(id, "complete");

export const purchaseReturnService = {
  getPurchaseReturns,
  getPurchaseReturnById,
  createPurchaseReturn,
  getSupplierLedger,
  approvePurchaseReturn,
  rejectPurchaseReturn,
  cancelPurchaseReturn,
  completePurchaseReturn,
};
