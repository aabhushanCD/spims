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

  async findById(id: string): Promise<IPurchaseOrder | null> {
    return await this.purchaseOrderModel.findById(id).exec();
  }
  async findAll(): Promise<IPurchaseOrder[]> {
    return await this.purchaseOrderModel.find().exec();
  }

  async findBySupplierId(supplierId: string): Promise<IPurchaseOrder[]> {
    return await this.purchaseOrderModel.find({ supplierId }).exec();
  }

  async update(
    id: string,
    updateData: Partial<IPurchaseOrder>,
  ): Promise<IPurchaseOrder | null> {
    return await this.purchaseOrderModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<IPurchaseOrder | null> {
    return await this.purchaseOrderModel.findByIdAndDelete(id).exec();
  }
}
