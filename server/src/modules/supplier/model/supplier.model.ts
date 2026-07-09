import { Schema, model, Document, Types } from "mongoose";

export interface ISupplier extends Document {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  leadTime: number;
  status: "active" | "inactive";
  reliabilityScore?: number;
}

const supplierSchema = new Schema<ISupplier>(
  {
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    leadTime: { type: Number, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    reliabilityScore: { type: Number, default: 0, max: 100, min: 0 },
  },
  {
    timestamps: true,
  },
);

const Supplier = model<ISupplier>("Supplier", supplierSchema);

export default Supplier;
