import type { Types } from "mongoose";

type ReturnCondition = "GOOD" | "DAMAGED" | "EXPIRED" | "OPENED";
export interface ReturnItem {
  saleItemId: Types.ObjectId;
  medicineId: Types.ObjectId;
  batchId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  discount: number;
  refundAmount: number;
  condition: ReturnCondition;
}
