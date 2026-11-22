import type { PaymentMethod } from "@/features/sales/schema/sale.schema";

export type PaymentType = "PAYMENT" | "REFUND" | "REFUND_REVERSAL";

export interface SalePayment {
  _id: string;
  saleId: string;
  returnId?: string | null;
  type: PaymentType;
  method: PaymentMethod | string;
  amount: number;
  reference?: string | null;
  performedBy?: string;
  paidAt: string;
  createdAt: string;
}

export interface SalePaymentSummary {
  totalAmount: number;
  paidAmount: number;
  amountDue: number;
}

export interface SalePaymentsPage {
  items: SalePayment[];
  summary: SalePaymentSummary;
}

export interface AddPaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  idempotencyKey?: string;
}
