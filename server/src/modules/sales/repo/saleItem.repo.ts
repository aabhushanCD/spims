import mongoose from "mongoose";
import { Types } from "mongoose";
import type { ISalesItem } from "../model/salesItem.model.ts";
import type SaleItem from "../model/salesItem.model.ts";
import { Mongoose } from "mongoose";
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
          $group: {
            _id: "$medicineId",
            totalQuantitySold: { $sum: "$quantity" },
            totalRevenue: { $sum: "$totalPrice" },
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
}
