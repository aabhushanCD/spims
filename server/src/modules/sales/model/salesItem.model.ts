import { model, Schema, Document, Types } from "mongoose";

export interface ISalesItem extends Document {
  salesId: Types.ObjectId;
  batchId: Types.ObjectId;
  medicineId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
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
    discount: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },

  { timestamps: true },
);

const SalesItem = model<ISalesItem>("SalesItem", salesItemSchema);

export default SalesItem;
