import { Document, Schema, model } from "mongoose";

export interface ICounter extends Document {
  name: string;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
}

const counterSchema = new Schema<ICounter>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sequence: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Counter = model<ICounter>("Counter", counterSchema);
