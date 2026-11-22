import { model, Schema, Document, Types } from "mongoose";

export interface ISalesItem extends Document {
  salesId: Types.ObjectId;
  batchId: Types.ObjectId;
  medicineId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  /** VAT percentage applied to this line at sale time. */
  vatRate?: number;
  /** Cost snapshot at sale time; keeps COGS stable if the batch is edited. */
  purchasePrice?: number;
  discount: number;
  totalPrice: number;
  returnedQuantity: number;
  createdAt: Date;
  updatedAt: Date;

}

const salesItemSchema = new Schema<ISalesItem>(
  {
    salesId: { type: Schema.Types.ObjectId, ref: "Sales", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    quantity: { type: Number, required: true },
    returnedQuantity: { type: Number, default: 0 },
    unitPrice: { type: Number, required: true },
    vatRate: { type: Number, default: 13, min: 0, max: 100 },
    // Optional for legacy sale items; new items always carry the snapshot.
    purchasePrice: { type: Number, required: false },
    discount: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },

  { timestamps: true },
);

salesItemSchema.index({ salesId: 1 });
salesItemSchema.index({ batchId: 1 });
salesItemSchema.index({ medicineId: 1, createdAt: -1 });

const SalesItem = model<ISalesItem>("SalesItem", salesItemSchema);

export default SalesItem;
