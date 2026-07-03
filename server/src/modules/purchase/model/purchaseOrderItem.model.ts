import {Document, Schema, model, Types} from 'mongoose';



export interface IPurchaseOrderItem extends Document {
    purchaseOrderId: Types.ObjectId;
    medicineId: Types.ObjectId;
    quantity: number;
    purchasePrice: number;
    updatedAt: Date;
    createdAt: Date;
}


const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const PurchaseOrderItem = model<IPurchaseOrderItem>('PurchaseOrderItem', purchaseOrderItemSchema);

export default PurchaseOrderItem;
