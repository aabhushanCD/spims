import { Schema, model, Types, type Document } from "mongoose";

export type StocktakeStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface StocktakeItem {
  batchId: Types.ObjectId;
  medicineId: Types.ObjectId;
  systemQuantity: number;
  countedQuantity: number;
  variance: number;
  remarks?: string;
}

export interface IStocktake extends Document {
  stocktakeNumber: string;
  status: StocktakeStatus;
  startedBy: Types.ObjectId;
  completedBy?: Types.ObjectId | null;
  completedAt?: Date | null;
  notes?: string | null;
  items: StocktakeItem[];
  createdAt: Date;
  updatedAt: Date;
}

const stocktakeSchema = new Schema<IStocktake>(
  {
    stocktakeNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["DRAFT", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "DRAFT",
    },
    startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    completedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    completedAt: { type: Date, default: null },
    notes: { type: String, maxlength: 500, default: null },
    items: [
      {
        batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
        medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
        systemQuantity: { type: Number, required: true, min: 0 },
        countedQuantity: { type: Number, required: true, min: 0 },
        variance: { type: Number, required: true },
        remarks: { type: String, maxlength: 500 },
      },
    ],
  },
  { timestamps: true },
);

stocktakeSchema.index({ status: 1, createdAt: -1 });

const Stocktake = model<IStocktake>("Stocktake", stocktakeSchema);

export default Stocktake;
