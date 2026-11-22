import {Document, Schema, model, Types} from 'mongoose';



export interface IPurchaseOrderItem extends Document {
    purchaseOrderId: Types.ObjectId;
    medicineId: Types.ObjectId;
    quantity: number;
    receivedQuantity: number;
    purchasePrice: number;
    vatRate?: number;
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
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    purchasePrice: {
      type: Number,
      required: true,
    },
    vatRate: {
      type: Number,
      default: 13,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true },
);

const PurchaseOrderItem = model<IPurchaseOrderItem>('PurchaseOrderItem', purchaseOrderItemSchema);

export default PurchaseOrderItem;
