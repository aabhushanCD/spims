import type { Types } from "mongoose";

export type ReturnCondition = "GOOD" | "DAMAGED" | "EXPIRED" | "OPENED";

export type ReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export interface ReturnItem {
  saleItemId: Types.ObjectId;
  medicineId: Types.ObjectId;
  batchId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  /** Discount attributed to this return line (a share of the sale line discount). */
  discount: number;
  /** VAT amount for this return line. */
  VAT: number;
  refundAmount: number;
  condition: ReturnCondition;
  remarks?: string;
}
