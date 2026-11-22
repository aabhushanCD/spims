import type { PurchaseStatus } from "./PurchaseDetails";

export interface RecentSupplierOrder {
  _id: string;
  invoiceNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  totalAmount: number;
  status: PurchaseStatus;
}

export interface SupplierPerformance {
  supplier: {
    _id: string;
    companyName: string;
    reliabilityScore?: number;
  };
  totalOrders: number;
  statusCounts: Record<string, number>;
  receivedOrders: number;
  onTimeOrders: number;
  averageDelayDays: number;
  totalValue: number;
  onTimeRate: number | null;
  recentOrders: RecentSupplierOrder[];
}

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
