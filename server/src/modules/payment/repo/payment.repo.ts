import mongoose from "mongoose";

import type Payment from "../model/payment.model.ts";
import type { IPayment } from "../model/payment.model.ts";

export interface PaymentSummaryRow {
  payments: number;
  refunds: number;
  refundReversals: number;
}

export class PaymentRepo {
  constructor(private readonly paymentModel: typeof Payment) {}

  async create(
    data: Partial<IPayment>,
    session?: mongoose.ClientSession,
  ): Promise<IPayment> {
    const payment = new this.paymentModel(data);
    return session ? await payment.save({ session }) : await payment.save();
  }

  async findBySale(
    saleId: string,
    session?: mongoose.ClientSession,
  ): Promise<IPayment[]> {
    const query = this.paymentModel
      .find({ saleId })
      .populate("performedBy", "name email role")
      .sort({ paidAt: -1, _id: -1 })
      .lean();
    if (session) {
      query.session(session);
    }
    return await query.exec();
  }

  async findByReturn(returnId: string): Promise<IPayment[]> {
    return await this.paymentModel
      .find({ returnId })
      .sort({ paidAt: -1, _id: -1 })
      .lean()
      .exec();
  }

  async summarizeBySale(saleId: string): Promise<PaymentSummaryRow> {
    const rows = await this.paymentModel.aggregate<{
      _id: string;
      total: number;
    }>([
      { $match: { saleId: new mongoose.Types.ObjectId(saleId) } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);

    const summary: PaymentSummaryRow = {
      payments: 0,
      refunds: 0,
      refundReversals: 0,
    };
    for (const row of rows) {
      if (row._id === "PAYMENT") {
        summary.payments = row.total;
      } else if (row._id === "REFUND") {
        summary.refunds = row.total;
      } else if (row._id === "REFUND_REVERSAL") {
        summary.refundReversals = row.total;
      }
    }
    return summary;
  }
}
