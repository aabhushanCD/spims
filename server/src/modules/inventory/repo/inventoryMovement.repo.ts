import type mongoose from "mongoose";

import type InventoryMovement from "../model/inventoryMovement.model.js";
import type { IInventoryMovement } from "../model/inventoryMovement.model.js";
import {
  cursorFilter,
  type PageCursor,
} from "../../../shared/pagination/cursor.ts";

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
  async findPage(
    filters: {
      medicineId?: string;
      batchId?: string;
      referenceId?: string;
      movementType?: IInventoryMovement["movementType"];
      referenceType?: IInventoryMovement["referenceType"];
      from?: Date;
      to?: Date;
    },
    cursor: PageCursor | null,
    limit: number,
  ): Promise<IInventoryMovement[]> {
    const conditions: Record<string, unknown>[] = [];
    if (filters.medicineId) {
      conditions.push({ medicineId: filters.medicineId });
    }
    if (filters.batchId) {
      conditions.push({ batchId: filters.batchId });
    }
    if (filters.referenceId) {
      conditions.push({ referenceId: filters.referenceId });
    }
    if (filters.movementType) {
      conditions.push({ movementType: filters.movementType });
    }
    if (filters.referenceType) {
      conditions.push({ referenceType: filters.referenceType });
    }
    if (filters.from || filters.to) {
      conditions.push({
        createdAt: {
          ...(filters.from ? { $gte: filters.from } : {}),
          ...(filters.to ? { $lte: filters.to } : {}),
        },
      });
    }
    const cursorClause = cursorFilter("createdAt", cursor);
    if (Object.keys(cursorClause).length > 0) {
      conditions.push(cursorClause);
    }
    const query = conditions.length > 0 ? { $and: conditions } : {};

    return this.inventoryModel
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .populate("medicineId", "medicineName strength")
      .populate("batchId", "batchNumber expiryDate")
      .populate("performedBy", "name email role")
      .lean()
      .exec();
  }

  async findByBatchIdPage(
    batchId: string,
    limit: number,
  ): Promise<IInventoryMovement[]> {
    return this.inventoryModel
      .find({ batchId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .populate("performedBy", "name email role")
      .lean()
      .exec();
  }

  async existsByBatchId(batchId: string): Promise<boolean> {
    const exists = await this.inventoryModel.exists({ batchId });
    return !!exists;
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
