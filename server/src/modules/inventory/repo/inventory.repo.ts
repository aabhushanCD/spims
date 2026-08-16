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

  async getInventoryHealth(session?: mongoose.ClientSession): Promise<{
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringSoonCount: number;
  }> {
    const [totalValue, lowStockCount, outOfStockCount, expiringSoonCount] =
      await Promise.all([
        this.getTotalInventoryValue(session),
        this.getLowStockCount(session),
        this.getOutOfStockCount(session),
        this.getExpiringSoonCount(30, session),
      ]);
    return { totalValue, lowStockCount, outOfStockCount, expiringSoonCount };
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

  async getExpiringSoonCount(
    days: number,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    return this.inventoryModel
      .countDocuments({
        "batches.expiryDate": { $gte: now, $lte: futureDate },
        "batches.quantityRemaining": { $gt: 0 },
      })
      .session(session ?? null)
      .exec();
  }

  async searchMedicines(query: string) {
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

      // Search by medicine fields
      {
        $match: {
          $or: [
            {
              "medicine.medicineName": {
                $regex: query,
                $options: "i",
              },
            },
            {
              "medicine.strength": {
                $regex: query,
                $options: "i",
              },
            },
            {
              "medicine.barcode": {
                $regex: query,
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
