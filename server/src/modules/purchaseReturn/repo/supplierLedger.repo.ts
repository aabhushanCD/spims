import mongoose from "mongoose";

import type SupplierLedgerEntry from "../model/supplierLedger.model.ts";
import type { ISupplierLedgerEntry } from "../model/supplierLedger.model.ts";

export class SupplierLedgerRepo {
  constructor(private readonly model: typeof SupplierLedgerEntry) {}

  async create(
    data: Partial<ISupplierLedgerEntry>,
    session?: mongoose.ClientSession,
  ): Promise<ISupplierLedgerEntry> {
    const doc = new this.model(data);
    return session ? await doc.save({ session }) : await doc.save();
  }

  async findBySupplier(
    supplierId: string,
  ): Promise<ISupplierLedgerEntry[]> {
    return await this.model
      .find({ supplierId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getBalance(supplierId: string): Promise<number> {
    const result = await this.model
      .aggregate<{ balance: number }>([
        { $match: { supplierId: new mongoose.Types.ObjectId(supplierId) } },
        { $group: { _id: null, balance: { $sum: "$amount" } } },
      ])
      .exec();
    return result[0]?.balance ?? 0;
  }

  async hasForReturn(purchaseReturnId: string): Promise<boolean> {
    return (await this.model.countDocuments({ purchaseReturnId })) > 0;
  }
}
