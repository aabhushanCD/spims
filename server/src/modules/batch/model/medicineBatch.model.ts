import { Document, Schema, model, Types } from "mongoose";

export interface IBatch extends Document {
  medicineId: Types.ObjectId;
  purchaseOrderId: Types.ObjectId;
  batchNumber: string;
  expiryDate: Date;
  manufacturingDate: Date;
  purchasePrice: number;
  sellingPrice: number;
  quantityReceived: number;
  quantityRemaining: number;
  isExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    batchNumber: { type: String, required: true },

    expiryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value: Date) {
          return (
            (this as IBatch).manufacturingDate &&
            value > (this as IBatch).manufacturingDate
          );
        },
        message: "Expiry date must be greater than manufacturing date",
      },
    },
    manufacturingDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    quantityReceived: { type: Number, required: true, min: 1 },
    quantityRemaining: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value: number) {
          return value <= (this as IBatch).quantityReceived;
        },
        message: "Remaining cannot exceed received quantity",
      },
    },

    isExpired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
batchSchema.virtual("status").get(function (this: IBatch) {
  if (this.quantityRemaining === 0) {
    return "sold-out";
  }

  if (this.isExpired) {
    return "expired";
  }

  return "active";
});

batchSchema.index({ expiryDate: 1 });
batchSchema.index(
  {
    medicineId: 1,
    batchNumber: 1,
  },
  { unique: true },
);
batchSchema.index({ medicineId: 1, expiryDate: 1 });
batchSchema.index({ isExpired: 1 });

const Batch = model<IBatch>("Batch", batchSchema);

export default Batch;
