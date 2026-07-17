import { model, Document, Schema, Types } from "mongoose";

export interface ICategory extends Document {
 
  name: string;
  description?: string;
  isActive: boolean;

}

const CategorySchema = new Schema(
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

export const Category = model<ICategory>("Category", CategorySchema);
