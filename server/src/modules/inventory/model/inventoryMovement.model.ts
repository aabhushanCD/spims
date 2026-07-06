import { Document, Schema, Types, model } from "mongoose";

export interface IInventoryMovement extends Document {
  medicineId: Types.ObjectId;
  batchId: Types.ObjectId;
  movementType:
    | "PURCHASE"
    | "SALE"
    | "RETURN"
    | "ADJUSTMENT"
    | "EXPIRED"
    | "RESERVE"
    | "RELEASE";

  quantity: number;
  referenceId: Types.ObjectId; // Could be a purchase order ID, sales order ID, etc.
  referenceType: "PURCHASE_ORDER" | "SALE" | "RETURN" | "ADJUSTMENT" | "SYSTEM";
  performedBy: Types.ObjectId; // User ID who performed the movement
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: false },
    movementType: {
      type: String,
      enum: [
        "PURCHASE",
        "SALE",
        "RETURN",
        "ADJUSTMENT",
        "EXPIRED",
        "RESERVE",
        "RELEASE",
      ],
      required: true,
    },
    quantity: { type: Number, required: true },
    referenceId: { type: Schema.Types.ObjectId, required: true },
    referenceType: {
      type: String,
      enum: ["PURCHASE_ORDER", "SALE", "RETURN", "ADJUSTMENT", "SYSTEM"],
      required: true,
    },

    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    remarks: { type: String, default: "" },
  },
  { timestamps: true },
);
inventoryMovementSchema.index({ medicineId: 1, createdAt: -1 });
inventoryMovementSchema.index({ batchId: 1 });
inventoryMovementSchema.index({ movementType: 1 });
inventoryMovementSchema.index({ referenceId: 1 });

const InventoryMovement = model<IInventoryMovement>(
  "InventoryMovement",
  inventoryMovementSchema,
);

export default InventoryMovement;
