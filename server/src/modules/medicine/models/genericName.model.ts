import { Document, Schema, model } from "mongoose";

export interface IGenericName extends Document {
  name: string;
  description: string;
  isActive: boolean;
}

const GenericNameSchema = new Schema<IGenericName>(
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
      maxlength: 200,
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

export const GenericName = model<IGenericName>(
  "GenericName",
  GenericNameSchema,
);
