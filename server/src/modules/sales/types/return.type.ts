import type { Types } from "mongoose";

export type ReturnCondition = "GOOD" | "DAMAGED" | "EXPIRED" | "OPENED";

export type ReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "REVERSED";

export interface ReturnItem {
  saleItemId: Types.ObjectId;
  medicineId: Types.ObjectId;
  batchId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  /** VAT percentage used for this line. */
  vatRate?: number;
  /** Discount attributed to this return line (a share of the sale line discount). */
  discount: number;
  /** VAT amount for this return line. */
  VAT: number;
  /** Optional restocking fee deducted before VAT on GOOD lines. */
  restockingFee?: number;
  refundAmount: number;
  condition: ReturnCondition;
  remarks?: string;
}
