export interface ReceivePurchaseItem {
  medicineId: string;

  medicineName: string;

  quantityOrdered: number;

  quantityReceived: number;

  purchasePrice: number;

  batchNumber: string;

  manufacturingDate?: string;

  expiryDate: string;

  sellingPrice: number;
}

export interface ReceivePurchaseForm {
  items: ReceivePurchaseItem[];
}
