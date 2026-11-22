import { Document, Schema, model, Types } from "mongoose";

export interface ISales extends Document {
  invoiceNumber: string;
  customerName: string;
  customerId?: Types.ObjectId | null;
  subTotal: number;
  VAT: number;
  /** VAT percentage applied at sale time (13 = 13%). */
  vatRate: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  cashierId: Types.ObjectId;
  saleDate: Date;
  status: "COMPLETED" | "PARTIALLY_RETURNED" | "RETURNED" | "CANCELLED" | "PENDING";
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const salesSchema = new Schema<ISales>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    subTotal: { type: Number, required: true },
    VAT: { type: Number, required: true },
    vatRate: { type: Number, required: true, default: 13, min: 0, max: 100 },
    discount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    saleDate: { type: Date, required: true },
    status: { type: String, enum: ["COMPLETED", "PARTIALLY_RETURNED", "RETURNED", "CANCELLED", "PENDING"], default: "PENDING" },
    idempotencyKey: { type: String },
  },
  { timestamps: true },
);

salesSchema.index({ customerId: 1, saleDate: -1 });
salesSchema.index({ status: 1, saleDate: -1 });
salesSchema.index({ saleDate: -1 });
salesSchema.index({ cashierId: 1, saleDate: -1 });
salesSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);

const Sales = model<ISales>("Sales", salesSchema);

export default Sales;
