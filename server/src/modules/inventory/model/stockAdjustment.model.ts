import { Document, model, Schema, Types } from "mongoose";

export interface IStockAdjustment extends Document {
  medicineId: Types.ObjectId;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  adjustedBy: Types.ObjectId; // User ID who performed the adjustment
  adjustedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const stockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    reason: { type: String, required: true },
    adjustedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adjustedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

const StockAdjustment = model<IStockAdjustment>(
  "StockAdjustment",
  stockAdjustmentSchema,
);

export default StockAdjustment;
