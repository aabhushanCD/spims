import { Schema, model, Document, Types } from "mongoose";

export interface IPurchaseOrder extends Document {
  _id: Types.ObjectId;
  supplierId: Types.ObjectId;
  orderDate: Date;
  expectedDeliveryDate: Date;
  invoiceNumber: string;
  invoiceFile: string;
  totalAmount: number;
  status: "pending" | "approved" | "received" | "cancelled";
  VAT: number;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchaseOrder>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    orderDate: { type: Date, required: true },
    expectedDeliveryDate: { type: Date, required: true },
    invoiceNumber: { type: String, required: true },
    invoiceFile: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "received", "cancelled"],
      default: "pending",
    },
    VAT: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PurchaseOrder = model<IPurchaseOrder>("PurchaseOrder", purchaseSchema);

export default PurchaseOrder;
