import { Document, Schema, model, Types } from "mongoose";

export interface ISales extends Document {
  invoiceNumber: string;
  customerName: string;
  subTotal: number;
  VAT: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  cashierId: Types.ObjectId;
  saleDate: Date;
  status: "COMPLETED" | "PARTIALLY_RETURNED" | "RETURNED" | "CANCELLED" | "PENDING";
  createdAt: Date;
  updatedAt: Date;
}

const salesSchema = new Schema<ISales>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    subTotal: { type: Number, required: true },
    VAT: { type: Number, required: true },
    discount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    saleDate: { type: Date, required: true },
    status: { type: String, enum: ["COMPLETED", "PARTIALLY_RETURNED", "RETURNED", "CANCELLED", "PENDING"], default: "PENDING" },
  },
  { timestamps: true },
);

const Sales = model<ISales>("Sales", salesSchema);

export default Sales;
