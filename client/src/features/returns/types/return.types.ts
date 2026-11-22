export type ReturnCondition = "GOOD" | "DAMAGED" | "EXPIRED" | "OPENED";

export type ReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "REVERSED";

export interface ReturnLine {
  _id?: string;
  saleItemId: string;
  medicineId?: string;
  batchId?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount: number;
  VAT: number;
  restockingFee: number;
  refundAmount: number;
  condition: ReturnCondition;
  remarks?: string;
}

export interface SalesReturn {
  _id: string;
  salesId: string;
  returnNumber: string;
  status: ReturnStatus;
  returnReason: string;
  returnedBy: string;
  returnDate: string;
  vatRate: number;
  refundAmount: number;
  returnItems: ReturnLine[];
  completedAt?: string | null;
  reversedAt?: string | null;
  reversalReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
  condition: ReturnCondition;
  restockingFee?: number;
  remarks?: string;
}

export interface CreateReturnInput {
  salesId: string;
  returnReason: string;
  returnedBy: string;
  returnDate: string;
  items: ReturnItemInput[];
}

export interface ReturnListParams {
  search?: string;
  status?: ReturnStatus;
  salesId?: string;
}
