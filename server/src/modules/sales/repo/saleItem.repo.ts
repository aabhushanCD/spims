import mongoose from "mongoose";
import { roundCurrency } from "../../../shared/finance/money.ts";
import type { ISalesItem } from "../model/salesItem.model.ts";
import type SaleItem from "../model/salesItem.model.ts";
export class SaleItemRepo {
  // Implementation for sale item repository

  constructor(private readonly saleItemModel: typeof SaleItem) {}

  async create(
    saleItemData: Partial<ISalesItem>,
    session?: mongoose.ClientSession,
  ): Promise<ISalesItem> {
    if (session) {
      const saleItem = new this.saleItemModel(saleItemData);
      await saleItem.save({ session });
      return saleItem;
    }
    const saleItem = new this.saleItemModel(saleItemData);
    await saleItem.save();
    return saleItem;
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

  async findBySalesIdDetailed(salesId: string): Promise<ISalesItem[]> {
    return await this.saleItemModel
      .find({ salesId })
      .populate("medicineId", "medicineName strength dosageForm barcode")
      .populate("batchId", "batchNumber expiryDate sellingPrice")
      .sort({ createdAt: 1, _id: 1 })
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

  // async getTopSellingMedicines(
  //   limit: number,
  //   session?: mongoose.ClientSession,
  // ): Promise<
  //   { medicineId: string; totalQuantitySold: number; totalRevenue: number }[]
  // > {
  //   const results = await this.saleItemModel
  //     .aggregate([
  //       {
  //         $group: {
  //           _id: "$medicineId",
  //           totalQuantitySold: { $sum: "$quantity" },
  //           totalRevenue: { $sum: "$totalPrice" },
  //         },
  //       },
  //       { $sort: { totalQuantitySold: -1 } },
  //       { $limit: limit },
  //     ])
  //     .session(session ?? null);

  //   return results.map((r) => ({
  //     medicineId: r._id.toString(),
  //     totalQuantitySold: r.totalQuantitySold,
  //     totalRevenue: r.totalRevenue,
  //   }));
  // }
  async getTopSellingMedicines(
    limit: number,
    session?: mongoose.ClientSession,
  ): Promise<
    {
      medicineId: string;
      medicineName: string;
      strength: string;
      totalQuantitySold: number;
      totalRevenue: number;
    }[]
  > {
    const results = await this.saleItemModel
      .aggregate([
        {
          $lookup: {
            from: "sales",
            localField: "salesId",
            foreignField: "_id",
            as: "sale",
          },
        },
        { $unwind: "$sale" },
        // Cancelled sales never count; returned units are excluded below.
        { $match: { "sale.status": { $ne: "CANCELLED" } } },
        {
          $addFields: {
            netQuantity: {
              $subtract: [
                "$quantity",
                { $ifNull: ["$returnedQuantity", 0] },
              ],
            },
          },
        },
        { $match: { netQuantity: { $gt: 0 } } },
        {
          $group: {
            _id: "$medicineId",
            totalQuantitySold: { $sum: "$netQuantity" },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $gt: ["$quantity", 0] },
                  {
                    $multiply: [
                      "$totalPrice",
                      { $divide: ["$netQuantity", "$quantity"] },
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: "medicines",
            localField: "_id",
            foreignField: "_id",
            as: "medicine",
          },
        },
        {
          $unwind: "$medicine",
        },
        {
          $project: {
            _id: 0,
            medicineId: "$medicine._id",
            medicineName: "$medicine.medicineName",
            strength: "$medicine.strength",
            totalQuantitySold: 1,
            totalRevenue: 1,
          },
        },
        {
          $sort: {
            totalQuantitySold: -1,
          },
        },
        {
          $limit: limit,
        },
      ])
      .session(session ?? null);

    return results.map((item) => ({
      medicineId: item.medicineId.toString(),
      medicineName: item.medicineName,
      strength: item.strength,
      totalQuantitySold: item.totalQuantitySold,
      totalRevenue: item.totalRevenue,
    }));
  }

  /**
   * Cost of goods sold for sales in a half-open period.
   *
   * Cost is reversed only for GOOD returns, because their stock re-enters
   * sellable inventory. DAMAGED/EXPIRED/OPENED units were written off, so
   * their cost stays in COGS. The per-item `purchasePrice` snapshot keeps
   * historical cost stable if the batch is later edited; legacy items fall
   * back to the batch price.
   */
  async getCogsInRange(
    startDate: Date,
    endExclusive: Date,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const [result] = await this.saleItemModel
      .aggregate([
        {
          $lookup: {
            from: "sales",
            localField: "salesId",
            foreignField: "_id",
            as: "sale",
          },
        },
        { $unwind: "$sale" },
        {
          $match: {
            "sale.status": { $ne: "CANCELLED" },
            "sale.saleDate": { $gte: startDate, $lt: endExclusive },
          },
        },
        {
          $lookup: {
            from: "returns",
            let: { saleItemId: "$_id" },
            pipeline: [
              { $match: { status: "COMPLETED" } },
              { $unwind: "$returnItems" },
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$returnItems.saleItemId", "$$saleItemId"] },
                      { $eq: ["$returnItems.condition", "GOOD"] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  quantity: { $sum: "$returnItems.quantity" },
                },
              },
            ],
            as: "restoredReturns",
          },
        },
        {
          $addFields: {
            restoredQuantity: {
              $ifNull: [
                { $arrayElemAt: ["$restoredReturns.quantity", 0] },
                0,
              ],
            },
          },
        },
        {
          $addFields: {
            netQuantity: {
              $cond: [
                {
                  $gt: [
                    {
                      $subtract: ["$quantity", "$restoredQuantity"],
                    },
                    0,
                  ],
                },
                { $subtract: ["$quantity", "$restoredQuantity"] },
                0,
              ],
            },
          },
        },
        {
          $lookup: {
            from: "batches",
            localField: "batchId",
            foreignField: "_id",
            as: "batch",
          },
        },
        {
          $unwind: {
            path: "$batch",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: null,
            cogs: {
              $sum: {
                $multiply: [
                  "$netQuantity",
                  {
                    $ifNull: [
                      "$purchasePrice",
                      { $ifNull: ["$batch.purchasePrice", 0] },
                    ],
                  },
                ],
              },
            },
          },
        },
      ])
      .session(session ?? null);

    return roundCurrency(result?.cogs ?? 0);
  }

  /** True when any sale item references the batch. */
  async existsByBatchId(
    batchId: string,
    session?: mongoose.ClientSession,
  ): Promise<boolean> {
    const query = this.saleItemModel.exists({ batchId });
    const exists = session ? await query.session(session) : await query;
    return !!exists;
  }
  async getDailySalesForMedicine(
    medicineId: string,
    days: number,
    session?: mongoose.ClientSession,
  ): Promise<number[]> {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const results = await this.saleItemModel
      .aggregate([
        { $match: { medicineId: new mongoose.Types.ObjectId(medicineId) } },
        {
          $lookup: {
            from: "sales",
            localField: "salesId",
            foreignField: "_id",
            as: "sale",
          },
        },
        { $unwind: "$sale" },
        { $match: { "sale.saleDate": { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$sale.saleDate" },
            },
            totalQuantity: { $sum: "$quantity" },
          },
        },
      ])
      .session(session ?? null);

    // Zero-fill days with no sales so the array always has exactly `days` entries
    const salesByDate = new Map(results.map((r) => [r._id, r.totalQuantity]));
    const dailySales: number[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      dailySales.push(salesByDate.get(key) ?? 0);
    }
    return dailySales; // index 0 = oldest (day 1), last index = today (day 30)
  }

  async getTotalsByCategory(
    start: Date,
    endExclusive: Date,
  ): Promise<Array<{ categoryId: string; categoryName: string; quantity: number; total: number }>> {
    const rows = await this.saleItemModel
      .aggregate<{
        _id: mongoose.Types.ObjectId;
        quantity: number;
        total: number;
        category?: { name?: string };
      }>([
        {
          $lookup: {
            from: "sales",
            localField: "salesId",
            foreignField: "_id",
            as: "sale",
          },
        },
        { $unwind: "$sale" },
        {
          $match: {
            "sale.status": { $ne: "CANCELLED" },
            "sale.saleDate": { $gte: start, $lt: endExclusive },
          },
        },
        {
          $lookup: {
            from: "medicines",
            localField: "medicineId",
            foreignField: "_id",
            as: "medicine",
          },
        },
        { $unwind: { path: "$medicine", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "categories",
            localField: "medicine.categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$medicine.categoryId",
            quantity: { $sum: "$quantity" },
            total: { $sum: "$totalPrice" },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        { $sort: { total: -1 } },
      ])
      .exec();

    return rows.map((row) => ({
      categoryId: row._id ? String(row._id) : "uncategorized",
      categoryName: row.category?.name ?? "Uncategorized",
      quantity: row.quantity,
      total: roundCurrency(row.total),
    }));
  }
}
