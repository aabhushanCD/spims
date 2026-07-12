export interface PurchaseItem {
  medicineId: string;

  quantity: number;

  purchasePrice: number;
}

export interface Purchase {
  _id: string;

  supplierId: string;

  invoiceNumber: string;

  purchaseDate: string;

  expectedDeliveryDate?: string;

  status: "PENDING" | "RECEIVED" | "CANCELLED";

  totalAmount: number;

  items: PurchaseItem[];

  createdAt: string;

  updatedAt: string;
}
