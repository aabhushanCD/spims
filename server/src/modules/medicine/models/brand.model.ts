import mongoose, { Schema, Document, model } from "mongoose";

export interface IBrand extends Document {
  name: string;
  description: string;
  isActive: boolean;
}

const BrandSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
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

export const Brand = model<IBrand>("Brand", BrandSchema);
