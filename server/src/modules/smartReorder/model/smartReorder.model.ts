import { model, Document, Schema, Types } from "mongoose";

export interface ISmartReorder extends Document {
  medicineId: Types.ObjectId;
  suggestedQuantity: number;
  confidenceScore?: number;
  recommendationReason: string;
  generatedAt: Date;
  status: "PENDING" | "APPROVED" | "REJECTED";

  WADS: number;
  demandStdDev: number;
  adjustedLeadTime: number;
  safetyStock: number;
  reorderPoint: number;
  currentStock: number;
  expiryRiskUnits: number;
  supplierId: Types.ObjectId;
}

const SmartReorderSchema = new Schema<ISmartReorder>({
  medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
  suggestedQuantity: { type: Number, required: true },
  confidenceScore: {
    type: Number,
    required: false,
    min: 0,
    max: 100,
  },
  recommendationReason: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  WADS: { type: Number, required: true },
  demandStdDev: { type: Number, required: true },
  adjustedLeadTime: { type: Number, required: true },
  safetyStock: { type: Number, required: true },
  reorderPoint: { type: Number, required: true },
  currentStock: { type: Number, required: true },
  expiryRiskUnits: { type: Number, required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
});

SmartReorderSchema.index({ medicineId: 1, status: 1, generatedAt: -1 });
SmartReorderSchema.index({ status: 1, generatedAt: -1 });
SmartReorderSchema.index(
  { medicineId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" },
  },
);

const SmartReorderModel = model<ISmartReorder>(
  "SmartReorder",
  SmartReorderSchema,
);

export default SmartReorderModel;
