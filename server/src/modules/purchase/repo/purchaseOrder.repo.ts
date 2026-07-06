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
    return await this.purchaseOrderModel.find().exec();
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
}
