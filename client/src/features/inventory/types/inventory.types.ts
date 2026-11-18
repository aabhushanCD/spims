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
