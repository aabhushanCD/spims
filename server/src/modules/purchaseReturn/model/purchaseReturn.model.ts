import { Schema, model, Types, type Document } from "mongoose";

export type PurchaseReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export interface PurchaseReturnItem {
  batchId: Types.ObjectId;
  medicineId: Types.ObjectId;
  quantity: number;
  unitCost: number;
  refundAmount: number;
  remarks?: string;
}

export interface IPurchaseReturn extends Document {
  purchaseOrderId: Types.ObjectId;
  supplierId: Types.ObjectId;
  returnNumber: string;
  status: PurchaseReturnStatus;
  returnReason: string;
  returnedBy: Types.ObjectId;
  returnDate: Date;
  refundAmount: number;
  completedAt?: Date | null;
  items: PurchaseReturnItem[];
  createdAt: Date;
  updatedAt: Date;
}

const purchaseReturnSchema = new Schema<IPurchaseReturn>(
  {
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    returnNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"],
      default: "PENDING",
    },
    returnReason: { type: String, required: true, trim: true, maxlength: 500 },
    returnedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    returnDate: { type: Date, required: true },
    refundAmount: { type: Number, required: true, min: 0, default: 0 },
    completedAt: { type: Date, default: null },
    items: [
      {
        batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
        medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitCost: { type: Number, required: true, min: 0 },
        refundAmount: { type: Number, required: true, min: 0 },
        remarks: { type: String, maxlength: 500 },
      },
    ],
  },
  { timestamps: true },
);

purchaseReturnSchema.index({ purchaseOrderId: 1 });
purchaseReturnSchema.index({ supplierId: 1, returnDate: -1 });
purchaseReturnSchema.index({ status: 1, returnDate: -1 });

const PurchaseReturn = model<IPurchaseReturn>(
  "PurchaseReturn",
  purchaseReturnSchema,
);

export default PurchaseReturn;
