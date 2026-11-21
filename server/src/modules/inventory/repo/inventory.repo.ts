import type mongoose from "mongoose";
import type { PipelineStage } from "mongoose";
import { escapeRegex } from "../../../shared/utils/escapeRegex.ts";
import {
  cursorFilter,
  type PageCursor,
} from "../../../shared/pagination/cursor.ts";
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

  async findAll(session?: mongoose.ClientSession): Promise<IInventory[]> {
    if (session) {
      return await this.inventoryModel.find().session(session).exec();
    }
    return await this.inventoryModel
      .find()
      .populate("medicineId")
      .lean()
      .exec();
  }

  async findPage(
    filters: {
      search?: string;
      stockStatus?: "in" | "low" | "out";
      medicineId?: string;
    },
    cursor: PageCursor | null,
    limit: number,
  ): Promise<Record<string, unknown>[]> {
    const conditions: Record<string, unknown>[] = [];
    if (filters.medicineId) {
      conditions.push({ medicineId: filters.medicineId });
    }
    if (filters.stockStatus === "in") {
      conditions.push({ availableStock: { $gt: 0 } });
    }
    if (filters.stockStatus === "out") {
      conditions.push({ availableStock: { $lte: 0 } });
    }
    const cursorClause = cursorFilter("lastUpdated", cursor);
    if (Object.keys(cursorClause).length > 0) {
      conditions.push(cursorClause);
    }

    const pipeline: PipelineStage[] = [
      ...(conditions.length > 0 ? [{ $match: { $and: conditions } }] : []),
      {
        $lookup: {
          from: "medicines",
          localField: "medicineId",
          foreignField: "_id",
          as: "medicine",
        },
      },
      { $unwind: "$medicine" },
      { $match: { "medicine.isActive": true } },
    ];

    if (filters.search) {
      const pattern = escapeRegex(filters.search);
      pipeline.push({
        $match: {
          $or: [
            { "medicine.medicineName": { $regex: pattern, $options: "i" } },
            { "medicine.strength": { $regex: pattern, $options: "i" } },
            { "medicine.barcode": { $regex: pattern, $options: "i" } },
          ],
        },
      });
    }
    if (filters.stockStatus === "low") {
      pipeline.push({
        $match: {
          availableStock: { $gt: 0 },
          $expr: { $lte: ["$availableStock", "$medicine.reorderLevel"] },
        },
      });
    }

    pipeline.push(
      { $sort: { lastUpdated: -1, _id: -1 } },
      { $limit: limit },
      { $addFields: { medicineId: "$medicine" } },
      { $project: { medicine: 0 } },
    );

    return this.inventoryModel.aggregate(pipeline).exec();
  }

  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IInventory | null> {
    if (session) {
      return await this.inventoryModel.findById(id).session(session).exec();
    }
    return await this.inventoryModel.findById(id).exec();
  }

  async findByMedicineId(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<IInventory | null> {
    if (session) {
      return await this.inventoryModel
        .findOne({ medicineId })
        .session(session)
        .exec();
    }

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

  async updateWithVersion(
    id: string,
    expectedVersion: number,
    updateData: Partial<IInventory>,
    session?: mongoose.ClientSession,
  ): Promise<IInventory | null> {
    const versionFilter =
      expectedVersion === 0
        ? { $or: [{ version: 0 }, { version: { $exists: false } }] }
        : { version: expectedVersion };
    const query = this.inventoryModel.findOneAndUpdate(
      { _id: id, ...versionFilter },
      { $set: updateData, $inc: { version: 1 } },
      { new: true },
    );
    if (session) {
      query.session(session);
    }
    return query.exec();
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

  async getTotalInventoryValue(
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const [result] = await this.inventoryModel
      .aggregate([
        {
          $lookup: {
            from: "batches",
            localField: "medicineId",
            foreignField: "medicineId",
            as: "batches",
          },
        },
        { $unwind: { path: "$batches", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [
                  "$batches.quantityRemaining",
                  "$batches.sellingPrice",
                ],
              },
            },
          },
        },
      ])
      .session(session ?? null);
    return result?.total ?? 0;
  }

  async getLowStockCount(session?: mongoose.ClientSession): Promise<number> {
    const query = this.inventoryModel.aggregate([
      {
        $lookup: {
          from: "medicines",
          localField: "medicineId",
          foreignField: "_id",
          as: "medicine",
        },
      },
      { $unwind: "$medicine" },
      {
        $match: {
          $expr: {
            $and: [
              { $gt: ["$availableStock", 0] },
              { $lte: ["$availableStock", "$medicine.reorderLevel"] },
            ],
          },
        },
      },
      {
        $count: "count",
      },
    ]);
    if (session) {
      query.session(session);
    }
    const result = await query.exec();
    return result[0]?.count ?? 0;
  }

  async getOutOfStockCount(session?: mongoose.ClientSession): Promise<number> {
    return this.inventoryModel
      .countDocuments({ availableStock: { $lte: 0 } })
      .session(session ?? null)
      .exec();
  }

  async searchMedicines(query: string) {
    const pattern = escapeRegex(query);
    return this.inventoryModel.aggregate([
      // Only medicines with stock
      {
        $match: {
          availableStock: { $gt: 0 },
        },
      },

      // Join medicine
      {
        $lookup: {
          from: "medicines",
          localField: "medicineId",
          foreignField: "_id",
          as: "medicine",
        },
      },
      {
        $unwind: "$medicine",
      },
      {
        $match: {
          "medicine.isActive": true,
        },
      },

      // Search by medicine fields
      {
        $match: {
          $or: [
            {
              "medicine.medicineName": {
                $regex: pattern,
                $options: "i",
              },
            },
            {
              "medicine.strength": {
                $regex: pattern,
                $options: "i",
              },
            },
            {
              "medicine.barcode": {
                $regex: pattern,
                $options: "i",
              },
            },
          ],
        },
      },

      // Fetch the first FEFO batch
      {
        $lookup: {
          from: "batches",
          let: {
            medicineId: "$medicineId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$medicineId", "$$medicineId"],
                },
                quantityRemaining: {
                  $gt: 0,
                },
                isExpired: false,
              },
            },
            {
              $sort: {
                expiryDate: 1, // FEFO
              },
            },
            {
              $limit: 1,
            },
          ],
          as: "nextBatch",
        },
      },

      {
        $unwind: "$nextBatch",
      },

      // Return only required fields
      {
        $project: {
          _id: 1,
          medicineId: 1,
          currentStock: 1,
          availableStock: 1,

          medicine: {
            _id: "$medicine._id",
            medicineName: "$medicine.medicineName",
            strength: "$medicine.strength",
            dosageForm: "$medicine.dosageForm",
            barcode: "$medicine.barcode",
          },

          nextBatch: {
            _id: "$nextBatch._id",
            batchNumber: "$nextBatch.batchNumber",
            expiryDate: "$nextBatch.expiryDate",
            sellingPrice: "$nextBatch.sellingPrice",
            quantityRemaining: "$nextBatch.quantityRemaining",
          },
        },
      },
    ]);
  }
}
