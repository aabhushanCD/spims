import { model, Schema, Document, Types } from "mongoose";
import type { ReturnItem, ReturnStatus } from "../types/return.type.ts";

export interface ISalesReturn extends Document {
  salesId: Types.ObjectId;
  returnNumber: string;
  status: ReturnStatus;
  returnReason: string;
  returnedBy: Types.ObjectId;
  returnDate: Date;
  refundAmount: number;
  returnItems: ReturnItem[];
}

const returnSchema = new Schema<ISalesReturn>(
  {
    salesId: { type: Schema.Types.ObjectId, ref: "Sales", required: true },
    returnReason: { type: String, required: true },
    returnedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refundAmount: { type: Number, default: 0 },
    returnDate: { type: Date, required: true },
    returnNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"],
      default: "PENDING",
    },

    returnItems: [
      {
        saleItemId: { type: Types.ObjectId, ref: "SalesItem" },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        discount: { type: Number, required: true },
        VAT: { type: Number, required: true },
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
