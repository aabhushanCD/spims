import type { PurchaseStatus } from "./PurchaseDetails";

export interface PurchaseListItem {
  _id: string;

  supplierId: {
    _id: string;
    companyName: string;
  };

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
}
