export interface Batch {
  _id: string;

  medicineId?: {
    medicineName: string;
    strength?: string;
  };

  batchNumber: string;

  manufacturingDate: string;

  expiryDate: string;

  purchasePrice: number;

  sellingPrice: number;

  quantityReceived: number;

  quantityRemaining: number;

  isExpired: boolean;

  createdAt: string;
}
