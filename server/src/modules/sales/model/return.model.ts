import { model, Schema, Document, Types } from "mongoose";
import type { ReturnItem, ReturnStatus } from "../types/return.type.ts";

export interface ISalesReturn extends Document {
  salesId: Types.ObjectId;
  returnNumber: string;
  status: ReturnStatus;
  returnReason: string;
  returnedBy: Types.ObjectId;
  returnDate: Date;
  /** VAT percentage used for this return (snapshot of the sale rate). */
  vatRate: number;
  refundAmount: number;
  returnItems: ReturnItem[];
  completedAt?: Date | null;
  reversedAt?: Date | null;
  reversalReason?: string | null;
}

const returnSchema = new Schema<ISalesReturn>(
  {
    salesId: { type: Schema.Types.ObjectId, ref: "Sales", required: true },
    returnReason: { type: String, required: true },
    returnedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refundAmount: { type: Number, default: 0 },
    returnDate: { type: Date, required: true },
    returnNumber: { type: String, required: true, unique: true },
    vatRate: { type: Number, required: true, default: 13, min: 0, max: 100 },
    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "COMPLETED",
        "REVERSED",
      ],
      default: "PENDING",
    },
    completedAt: { type: Date, default: null },
    reversedAt: { type: Date, default: null },
    reversalReason: { type: String, default: null },

    returnItems: [
      {
        saleItemId: { type: Types.ObjectId, ref: "SalesItem" },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        vatRate: { type: Number, default: 13, min: 0, max: 100 },
        discount: { type: Number, required: true },
        VAT: { type: Number, required: true },
        restockingFee: { type: Number, default: 0, min: 0 },
        medicineId: { type: Types.ObjectId, ref: "Medicine" },
        batchId: { type: Types.ObjectId, ref: "Batch" },
        refundAmount: { type: Number, required: true },
        condition: {
          type: String,
          enum: ["GOOD", "DAMAGED", "EXPIRED", "OPENED"],
          default: "GOOD",
        },
        remarks: { type: String },
      },
    ],
  },
  { timestamps: true },
);

returnSchema.index({ salesId: 1 });
returnSchema.index({ status: 1, returnDate: -1 });
returnSchema.index({ returnDate: -1 });

const Return = model<ISalesReturn>("Return", returnSchema);

export default Return;
