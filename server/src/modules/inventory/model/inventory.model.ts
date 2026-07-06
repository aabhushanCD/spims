import { Schema, model, Document, Types } from "mongoose";

export interface IInventory extends Document {
  medicineId: Types.ObjectId;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lastUpdated: Date;
}

const inventorySchema = new Schema<IInventory>({
  medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
  currentStock: { type: Number, required: true, default: 0 },
  reservedStock: { type: Number, required: true, default: 0 },
  availableStock: {
    type: Number,
    required: true,
    default: 0,
    validate: {
      validator: function (value: number) {
        return (
          value >= 0 &&
          value <=
            (this as IInventory).currentStock -
              (this as IInventory).reservedStock
        );
      },
    },
  },
  lastUpdated: { type: Date, required: true, default: Date.now },
});

const Inventory = model<IInventory>("Inventory", inventorySchema);

export default Inventory;
