import { Schema, Document, model } from "mongoose";

export interface IUnit extends Document {
  name: string;
  description: string;
  isActive: boolean;
}

const unitSchema = new Schema<IUnit>(
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
      required: true,
      unique: true,
      trim: true,
      maxlength: 10,
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

export const Unit = model<IUnit>("Unit", unitSchema);
