export type StockMovementType =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "EXPIRED"
  | "RESERVE"
  | "RELEASE"
  | "PURCHASE_RETURN";

export type StockReferenceType =
  | "PURCHASE_ORDER"
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "SALES_RETURN"
  | "ADJUSTMENT"
  | "RESERVE"
  | "RELEASE"
  | "PURCHASE_RETURN"
  | "SYSTEM";

export interface StockMovementCtx {
  medicineId: string;
  batchId?: string;
  referenceId: string;
  referenceType: StockReferenceType;
  movementType: StockMovementType;
  performedBy: string;
  remarks?: string;
}
