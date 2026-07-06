import { model, Schema, Document, Types } from "mongoose";

export interface ISalesReturn extends Document {
  salesId: Types.ObjectId;
  returnReason: string;
  returnedBy: string;
  returnDate: Date;
  createdAt: Date;
  returnItems: [
    {
      saleItemId: Types.ObjectId;
      quantity: number;
    },
  ];
  updatedAt: Date;
}

const returnSchema = new Schema<ISalesReturn>(
  {
    salesId: { type: Schema.Types.ObjectId, ref: "Sales", required: true },
    returnReason: { type: String, required: true },
    returnedBy: { type: String, required: true },
    returnItems: [
      {
        saleItemId: { type: Types.ObjectId, ref: "SalesItem" },
        quantity: { type: Number, required: true },
      },
    ],
    returnDate: { type: Date, required: true },
  },
  { timestamps: true },
);

const Return = model<ISalesReturn>("Return", returnSchema);

export default Return;
