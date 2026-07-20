import type mongoose from "mongoose";

import type InventoryMovement from "../model/inventoryMovement.model.js";
import type { IInventoryMovement } from "../model/inventoryMovement.model.js";

export class InventoryMovementRepo {
  constructor(private readonly inventoryModel: typeof InventoryMovement) {}

  async create(
    inventoryData: Partial<IInventoryMovement>,
    session?: mongoose.ClientSession,
  ): Promise<IInventoryMovement> {
    const inventory = new this.inventoryModel(inventoryData);
    if (session) {
      return await inventory.save({ session });
    }
    return await inventory.save();
  }

  async findById(id: string): Promise<IInventoryMovement | null> {
    return await this.inventoryModel.findById(id).exec();
  }
  async findRecent(limit: number): Promise<IInventoryMovement[]> {
    return this.inventoryModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("medicineId", "medicineName strength")
      .populate("batchId", "batchNumber expiryDate")
      .populate("performedBy", "name")
      .lean()
      .exec();
  }
  async findByBatchId(batchId: string): Promise<IInventoryMovement | null> {
    return await this.inventoryModel.findOne({ batchId }).lean().exec();
  }

  async findAllByBatchId(batchId: string): Promise<IInventoryMovement[]> {
    return await this.inventoryModel.find({ batchId }).lean().exec();
  }
  async findAllByReference(referenceId: string): Promise<IInventoryMovement[]> {
    return await this.inventoryModel.find({ referenceId }).lean().exec();
  }

  async findAllByMedicineId(medicineId: string): Promise<IInventoryMovement[]> {
    return await this.inventoryModel.find({ medicineId }).lean().exec();
  }

  async findByMedicineId(
    medicineId: string,
  ): Promise<IInventoryMovement | null> {
    return await this.inventoryModel.findOne({ medicineId }).lean().exec();
  }

  async update(
    id: string,
    updateData: Partial<IInventoryMovement>,
  ): Promise<IInventoryMovement | null> {
    return await this.inventoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<IInventoryMovement | null> {
    return await this.inventoryModel.findByIdAndDelete(id).exec();
  }
}
