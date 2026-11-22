export interface InventoryMedicine {
  _id: string;
  medicineName: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  barcode?: string;
}

export interface InventoryItem {
  _id: string;
  medicineId: InventoryMedicine;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "EXPIRED"
  | "RESERVE"
  | "RELEASE"
  | "PURCHASE_RETURN";

export type ReferenceType =
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

export interface InventoryMovement {
  _id: string;
  medicineId?: { _id: string; medicineName: string; strength?: string };
  batchId?: { _id: string; batchNumber: string; expiryDate?: string };
  movementType: MovementType;
  quantity: number;
  referenceId: string;
  referenceType: ReferenceType;
  performedBy?: { _id?: string; name?: string; email?: string; role?: string };
  remarks?: string;
  createdAt: string;
}

export interface InventoryMovementPage {
  items: InventoryMovement[];
  nextCursor: string | null;
}

export interface InventoryMovementParams {
  cursor?: string;
  movementType?: MovementType;
  referenceType?: ReferenceType;
  from?: string;
  to?: string;
}

export interface ReconciliationRow {
  inventoryId: string;
  medicineId: string;
  aggregateStock: number;
  reservedStock: number;
  batchStock: number;
  variance: number;
  reconciled: boolean;
}

export interface StockOperationInput {
  quantity: number;
  batchId?: string;
  referenceId: string;
  referenceType: ReferenceType;
  remarks?: string;
}
