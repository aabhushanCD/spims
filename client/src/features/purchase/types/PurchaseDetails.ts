export interface PurchaseSupplier {
  _id: string;
  companyName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export type PurchaseStatus = "pending" | "approved" | "received" | "cancelled";

export interface PurchaseDetailsItem {
  _id: string;
  medicine: {
    _id: string;
    medicineName: string;
  };
  quantity: number;
  purchasePrice: number;
  batchNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseDetails {
  _id: string;

  supplier: PurchaseSupplier;

  orderDate: string;

  expectedDeliveryDate?: string;

  invoiceNumber: string;

  invoiceFile?: string;

  totalAmount: number;

  receivedDate?: string;

  status: PurchaseStatus;

  VAT: number;

  discount: number;

  createdAt: string;

  updatedAt: string;

  items: PurchaseDetailsItem[];
}
