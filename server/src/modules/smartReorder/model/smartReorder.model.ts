import { model, Document, Schema, Types } from "mongoose";

export interface ISmartReorder extends Document {
  medicineId: Types.ObjectId;
  suggestedQuantity: number;
  confidenceScore: number;
  recommendationReason: string;
  generatedAt: Date;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const SmartReorderSchema = new Schema<ISmartReorder>({
  medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
  suggestedQuantity: { type: Number, required: true },
  confidenceScore: { type: Number, required: true },
  recommendationReason: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
});

const SmartReorderModel = model<ISmartReorder>(
  "SmartReorder",
  SmartReorderSchema,
);

export default SmartReorderModel;
