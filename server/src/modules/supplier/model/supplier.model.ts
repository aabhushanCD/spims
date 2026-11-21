import { Schema, model, Document } from "mongoose";

export interface ISupplier extends Document {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  leadTime: number;
  status: "active" | "inActive";
  reliabilityScore?: number;
}

const supplierSchema = new Schema<ISupplier>(
  {
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    leadTime: { type: Number, required: true },
    status: { type: String, enum: ["active", "inActive"], default: "active" },
    reliabilityScore: { type: Number, default: 0, max: 100, min: 0 },
  },
  {
    timestamps: true,
  },
);

supplierSchema.index({ status: 1, companyName: 1 });

const Supplier = model<ISupplier>("Supplier", supplierSchema);

export default Supplier;
