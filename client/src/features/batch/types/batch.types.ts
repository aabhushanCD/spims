export interface Batch {
  _id: string;

  medicineId?: {
    _id?: string;
    medicineName: string;
    strength?: string;
  };

  purchaseOrderId?: string;

  isActive?: boolean;

  batchNumber: string;

  manufacturingDate: string;

  expiryDate: string;

  purchasePrice: number;

  sellingPrice: number;

  quantityReceived: number;

  quantityRemaining: number;

  isExpired: boolean;

  createdAt: string;
  updatedAt?: string;
}
