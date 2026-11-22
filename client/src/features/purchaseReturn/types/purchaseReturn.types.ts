export type PurchaseReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export interface PurchaseReturnItem {
  _id?: string;
  batchId: string;
  medicineId: string;
  quantity: number;
  unitCost: number;
  refundAmount: number;
  remarks?: string;
}

export interface PurchaseReturnOrderRef {
  _id: string;
  invoiceNumber?: string;
  status?: string;
}

export interface PurchaseReturnSupplierRef {
  _id: string;
  companyName?: string;
}

export interface PurchaseReturn {
  _id: string;
  purchaseOrderId: string | PurchaseReturnOrderRef;
  supplierId: string | PurchaseReturnSupplierRef;
  returnNumber: string;
  status: PurchaseReturnStatus;
  returnReason: string;
  returnedBy: string;
  returnDate: string;
  refundAmount: number;
  completedAt?: string | null;
  items: PurchaseReturnItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseReturnInput {
  purchaseOrderId: string;
  returnReason: string;
  returnDate: string;
  items: {
    batchId: string;
    quantity: number;
    remarks?: string;
  }[];
}

export interface PurchaseReturnListParams {
  status?: PurchaseReturnStatus;
  supplierId?: string;
  purchaseOrderId?: string;
  from?: string;
  to?: string;
  cursor?: string;
}

export interface SupplierLedgerEntry {
  _id: string;
  supplierId: string;
  purchaseReturnId?: string | null;
  type: "CREDIT" | "ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  reference: string;
  createdAt: string;
}

export interface SupplierLedger {
  supplierId: string;
  balance: number;
  entries: SupplierLedgerEntry[];
}

export function entityId(value: string | { _id: string }): string {
  return typeof value === "string" ? value : value._id;
}

export function entityLabel(
  value: string | { _id: string; invoiceNumber?: string; companyName?: string },
): string {
  if (typeof value === "string") {
    return `#${value.slice(-6)}`;
  }
  return value.invoiceNumber ?? value.companyName ?? `#${value._id.slice(-6)}`;
}
