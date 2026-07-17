export interface PurchaseDetails {
  _id: string;

  purchaseOrderNumber: string;

  supplier: PopulatedSupplier;

  invoiceNumber?: string;

  purchaseDate: string;

  expectedDeliveryDate?: string;

  notes?: string;

  totalAmount: number;

  status: PurchaseStatus;

  items: PurchaseItem[];

  createdAt: string;

  updatedAt: string;
}
