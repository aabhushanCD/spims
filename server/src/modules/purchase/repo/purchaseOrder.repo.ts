import type mongoose from "mongoose";
import type { IPurchaseOrder } from "../model/purchaseOrder.model.js";
import type PurchaseOrder from "../model/purchaseOrder.model.js";

export class PurchaseOrderRepo {
  constructor(private readonly purchaseOrderModel: typeof PurchaseOrder) {}

  async create(
    purchaseOrderData: Partial<IPurchaseOrder>,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder> {
    const purchaseOrder = new this.purchaseOrderModel(purchaseOrderData);
    if (session) {
      return await purchaseOrder.save({ session });
    }
    return await purchaseOrder.save();
  }

  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder | null> {
    if (session) {
      return await this.purchaseOrderModel.findById(id).session(session).exec();
    }
    return await this.purchaseOrderModel.findById(id).exec();
  }
  async findAll(session?: mongoose.ClientSession): Promise<IPurchaseOrder[]> {
    if (session) {
      return await this.purchaseOrderModel.find().session(session).exec();
    }
    return await this.purchaseOrderModel
      .find()
      .populate("supplierId", "companyName")
      .lean();
  }
  
  async findByIdWithSupplier(id: string): Promise<IPurchaseOrder | null> {
    return await this.purchaseOrderModel
      .findById(id)
      .populate("supplierId")
      .lean()
      .exec();
  }

  async findBySupplierId(
    supplierId: string,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder[]> {
    if (session) {
      return await this.purchaseOrderModel
        .find({ supplierId })
        .session(session)
        .exec();
    }
    return await this.purchaseOrderModel.find({ supplierId }).exec();
  }

  async update(
    id: string,
    updateData: Partial<IPurchaseOrder>,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder | null> {
    const options: any = { new: true };
    if (session) {
      options.session = session;
    }
    return this.purchaseOrderModel
      .findByIdAndUpdate(id, updateData, options)
      .exec();
  }

  async delete(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder | null> {
    if (session) {
      return await this.purchaseOrderModel
        .findByIdAndDelete(id, { session })
        .exec();
    }
    return await this.purchaseOrderModel.findByIdAndDelete(id).exec();
  }

  async getTotalPurchases(session?: mongoose.ClientSession): Promise<number> {
    const [result] = await this.purchaseOrderModel
      .aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ])
      .session(session ?? null);
    return result?.total ?? 0;
  }

  async getPurchasesByStatus(
    session?: mongoose.ClientSession,
  ): Promise<{ status: string; count: number }[]> {
    const results = await this.purchaseOrderModel
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .session(session ?? null);
    return results.map((r) => ({ status: r._id, count: r.count }));
  }

  async findRecentBySupplier(
    supplierId: string,
    limit: number,
    session?: mongoose.ClientSession,
  ): Promise<IPurchaseOrder[]> {
    return this.purchaseOrderModel
      .find({ supplierId, status: "received", receivedDate: { $exists: true } })
      .sort({ receivedDate: -1 })
      .limit(limit)
      .session(session ?? null)
      .lean()
      .exec();
  }
}
