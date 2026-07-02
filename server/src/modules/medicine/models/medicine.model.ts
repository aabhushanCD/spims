import { Schema, Document, model, Types } from "mongoose";

export interface IMedicine extends Document {
  medicineName: string;
  genericNameId: Types.ObjectId;
  categoryId: Types.ObjectId;
  brandId: Types.ObjectId;
  manufacturer?: string;
  barcode?: string;
  unitId: Types.ObjectId;
  dosageForm?: string;
  strength: string;
  reorderLevel?: number;
  description?: string;
  isActive: boolean;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    genericNameId: {
      type: Schema.Types.ObjectId,
      ref: "GenericName",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    manufacturer: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    barcode: {
      type: String,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    dosageForm: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    strength: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    reorderLevel: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Medicine = model<IMedicine>("Medicine", MedicineSchema);
