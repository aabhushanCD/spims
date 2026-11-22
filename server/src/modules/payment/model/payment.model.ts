import { Schema, model, Types, type Document } from "mongoose";

export type PaymentType = "PAYMENT" | "REFUND" | "REFUND_REVERSAL";

export interface IPayment extends Document {
  saleId: Types.ObjectId;
  returnId?: Types.ObjectId | null;
  type: PaymentType;
  method: string;
  amount: number;
  reference?: string | null;
  performedBy: Types.ObjectId;
  paidAt: Date;
  idempotencyKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    saleId: { type: Schema.Types.ObjectId, ref: "Sales", required: true },
    returnId: { type: Schema.Types.ObjectId, ref: "Return", default: null },
    type: {
      type: String,
      enum: ["PAYMENT", "REFUND", "REFUND_REVERSAL"],
      required: true,
    },
    method: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    reference: { type: String, default: null, trim: true, maxlength: 200 },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidAt: { type: Date, required: true, default: Date.now },
    idempotencyKey: { type: String, default: null },
  },
  { timestamps: true },
);

paymentSchema.index({ saleId: 1, paidAt: -1 });
paymentSchema.index({ returnId: 1 });
paymentSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);

const Payment = model<IPayment>("Payment", paymentSchema);

export default Payment;
