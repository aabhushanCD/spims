import { Schema, model, type Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 250,
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

customerSchema.index({ name: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });

const Customer = model<ICustomer>("Customer", customerSchema);

export default Customer;
