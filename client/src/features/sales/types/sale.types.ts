// features/sales/types/sale.types.ts
import type { PaymentMethod } from "../schema/sale.schema";

export interface InventorySearchResult {
  _id: string;
  medicineId: string;
  availableStock: number;
  currentStock: number;
  medicine: {
    _id: string;
    medicineName: string;
    strength: string;
    dosageForm: string;
    barcode?: string;
  };
  nextBatch: {
    _id: string;
    batchNumber: string;
    expiryDate: string;
    sellingPrice: number;
    quantityRemaining: number;
  };
}

/** Exactly matches backend createSalesItemSchema */
export interface CreateSaleItemInput {
  medicineId: string;
  batchId: string;
  quantity: number;
  discountPercentage?: number;
}

/** Exactly matches backend createSaleSchema */
export interface CreateSaleInput {
  customerName: string;
  paymentMethod: PaymentMethod;
  saleDate: string; // set as new Date().toISOString() on submit
  discount?: number;
  items: CreateSaleItemInput[];
}
interface CashierId {
  name: string;
  _id: string;
}
export type SaleStatus = "COMPLETED" | "CANCELLED" | "PENDING";

export interface SalesListItem {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  cashierId: CashierId;
  status: SaleStatus;
  saleDate: string; // ISO string
  discount: number;
  subTotal: number;
  VAT: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}
