import type mongoose from "mongoose";
import type { IInventory } from "../model/inventory.model.js";
import type Inventory from "../model/inventory.model.js";

export class InventoryRepo {
  constructor(private readonly inventoryModel: typeof Inventory) {}

  async create(
    inventoryData: Partial<IInventory>,
    session?: mongoose.ClientSession,
  ): Promise<IInventory> {
    const inventory = new this.inventoryModel(inventoryData);
    if (session) {
      return await inventory.save({ session });
    }
    return await inventory.save();
  }

  async findById(id: string): Promise<IInventory | null> {
    return await this.inventoryModel.findById(id).exec();
  }

  async findByMedicineId(medicineId: string): Promise<IInventory | null> {
    return await this.inventoryModel.findOne({ medicineId }).exec();
  }

  async update(
    id: string,
    updateData: Partial<IInventory>,
    session?: mongoose.ClientSession,
  ): Promise<IInventory | null> {
    if (session) {
      return await this.inventoryModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .session(session)
        .exec();
    }
    return await this.inventoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IInventory | null> {
    if (session) {
      return await this.inventoryModel
        .findByIdAndDelete(id)
        .session(session)
        .exec();
    }
    return await this.inventoryModel.findByIdAndDelete(id).exec();
  }
}
