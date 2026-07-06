import type mongoose from "mongoose";

import type StockAdjustment from "../model/stockAdjustment.model.js";
import type { IStockAdjustment } from "../model/stockAdjustment.model.js";

export class StockAdjustmentRepo {
  constructor(private readonly inventoryModel: typeof StockAdjustment) {}

  async create(
    inventoryData: Partial<IStockAdjustment>,
    session?: mongoose.ClientSession,
  ): Promise<IStockAdjustment> {
    const inventory = new this.inventoryModel(inventoryData);
    if (session) {
      return await inventory.save({ session });
    }
    return await inventory.save();
  }

  async findById(id: string): Promise<IStockAdjustment | null> {
    return await this.inventoryModel.findById(id).exec();
  }

  async findByMedicineId(medicineId: string): Promise<IStockAdjustment | null> {
    return await this.inventoryModel.findOne({ medicineId }).exec();
  }

  async update(
    id: string,
    updateData: Partial<IStockAdjustment>,
  ): Promise<IStockAdjustment | null> {
    return await this.inventoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<IStockAdjustment | null> {
    return await this.inventoryModel.findByIdAndDelete(id).exec();
  }
}
