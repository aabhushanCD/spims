import { Schema, model, Document, Types } from "mongoose";

export interface IPurchaseOrder extends Document {
  supplierId: Types.ObjectId;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  invoiceNumber: string;
  invoiceFile: string;
  totalAmount: number;
  receivedDate?: Date;
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
    expectedDeliveryDate: { type: Date },
    invoiceNumber: { type: String, required: true },
    invoiceFile: { type: String, required: false },
    totalAmount: { type: Number, required: true },
    receivedDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "approved", "received", "cancelled"],
      required: true,
      default: "pending",
    },
    VAT: { type: Number, default: 13 },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PurchaseOrder = model<IPurchaseOrder>("PurchaseOrder", purchaseSchema);

export default PurchaseOrder;
