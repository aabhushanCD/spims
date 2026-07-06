import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { ISalesItem } from "../model/salesItem.model.ts";
import type SaleItem from "../model/salesItem.model.ts";
export class SaleItemRepo {
  // Implementation for sale item repository

  constructor(private readonly saleItemModel: typeof SaleItem) {}

  async create(
    saleItemData: Partial<ISalesItem>,
    session?: mongoose.ClientSession,
  ): Promise<ISalesItem> {
    const saleItem = new this.saleItemModel(saleItemData, { session });
    return await saleItem.save();
  }

  async findById(
    saleItemId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISalesItem | null> {
    if (session) {
      return this.saleItemModel
        .findById(saleItemId)
        .session(session)
        .lean()
        .exec();
    }
    return this.saleItemModel.findById(saleItemId).lean().exec();
  }

  async findAll(session?: mongoose.ClientSession): Promise<ISalesItem[]> {
    if (session) {
      return this.saleItemModel.find().session(session).lean().exec();
    }
    return this.saleItemModel.find().lean().exec();
  }

  async update(
    saleItemId: string,
    updateData: Partial<ISalesItem>,
    session?: mongoose.ClientSession,
  ): Promise<ISalesItem | null> {
    if (session) {
      return this.saleItemModel
        .findByIdAndUpdate(saleItemId, updateData, { new: true })
        .session(session)
        .lean()
        .exec();
    }
    return this.saleItemModel
      .findByIdAndUpdate(saleItemId, updateData, { new: true })
      .lean()
      .exec();
  }

  async findBySalesId(
    salesId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISalesItem[]> {
    if (session) {
      return this.saleItemModel
        .find({
          salesId: new (await import("mongoose")).Types.ObjectId(salesId),
        })
        .session(session)
        .lean()
        .exec();
    }
    return this.saleItemModel
      .find({ salesId: new (await import("mongoose")).Types.ObjectId(salesId) })
      .lean()
      .exec();
  }

  async delete(
    saleItemId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISalesItem | null> {
    if (session) {
      return this.saleItemModel
        .findByIdAndDelete(saleItemId)
        .session(session)
        .lean()
        .exec();
    }
    return this.saleItemModel.findByIdAndDelete(saleItemId).lean().exec();
  }
}
