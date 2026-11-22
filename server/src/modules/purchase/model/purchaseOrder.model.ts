import { Schema, model, Document, Types } from "mongoose";

export interface IPurchaseOrder extends Document {
  supplierId: Types.ObjectId;
  orderNumber?: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  invoiceNumber: string;
  invoiceFile: string;
  totalAmount: number;
  receivedDate?: Date;
  status:
    | "pending"
    | "approved"
    | "partially_received"
    | "received"
    | "cancelled";
  VAT: number;
  discount: number;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  cancelledBy?: Types.ObjectId | null;
  cancelledAt?: Date | null;
  receivedBy?: Types.ObjectId | null;
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
    orderNumber: { type: String, trim: true },
    orderDate: { type: Date, required: true },
    expectedDeliveryDate: { type: Date },
    invoiceNumber: { type: String, required: true },
    invoiceFile: { type: String, required: false },
    totalAmount: { type: Number, required: true },
    receivedDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "approved", "partially_received", "received", "cancelled"],
      required: true,
      default: "pending",
    },
    VAT: { type: Number, default: 13 },
    discount: { type: Number, default: 0 },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    cancelledAt: { type: Date, default: null },
    receivedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

purchaseSchema.index(
  { orderNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { orderNumber: { $type: "string" } },
  },
);
purchaseSchema.index({ supplierId: 1, orderDate: -1 });
purchaseSchema.index({ status: 1, orderDate: -1 });
purchaseSchema.index({ orderDate: -1 });

const PurchaseOrder = model<IPurchaseOrder>("PurchaseOrder", purchaseSchema);

export default PurchaseOrder;
