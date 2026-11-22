import { Schema, model, Types, type Document } from "mongoose";

export interface ISupplierLedgerEntry extends Document {
  supplierId: Types.ObjectId;
  purchaseReturnId?: Types.ObjectId | null;
  type: "CREDIT" | "ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  reference: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const supplierLedgerSchema = new Schema<ISupplierLedgerEntry>(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    purchaseReturnId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseReturn",
      default: null,
    },
    type: { type: String, enum: ["CREDIT", "ADJUSTMENT"], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reference: { type: String, required: true, trim: true, maxlength: 200 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

supplierLedgerSchema.index({ supplierId: 1, createdAt: -1 });
supplierLedgerSchema.index({ purchaseReturnId: 1 });

const SupplierLedgerEntry = model<ISupplierLedgerEntry>(
  "SupplierLedgerEntry",
  supplierLedgerSchema,
);

export default SupplierLedgerEntry;
