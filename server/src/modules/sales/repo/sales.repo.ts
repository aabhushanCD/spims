import type { ISales } from "../model/sales.model.ts";
import type mongoose from "mongoose";
import type Sales from "../model/sales.model.ts";
export class SalesRepo {
  constructor(private readonly salesModel: typeof Sales) {}

  async create(
    salesData: Partial<ISales>,
    session?: mongoose.ClientSession,
  ): Promise<ISales> {
    if (session) {
      const sales = new this.salesModel(salesData);
      await sales.save({ session });
      return sales;
    }
    const sales = new this.salesModel(salesData);
    await sales.save();
    return sales;
  }

  async findById(
    salesId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISales | null> {
    if (session) {
      return this.salesModel.findById(salesId).session(session).lean().exec();
    }
    return this.salesModel.findById(salesId).lean().exec();
  }

  async findAll(session?: mongoose.ClientSession): Promise<ISales[]> {
    if (session) {
      return this.salesModel
        .find()
        .populate("cashierId", "name email role")
        .session(session)
        .lean()
        .exec();
    }
    return this.salesModel
      .find()
      .populate("cashierId", "name email role")
      .lean()
      .exec();
  }

  async update(
    salesId: string,
    updateData: Partial<ISales>,
    session?: mongoose.ClientSession,
  ): Promise<ISales | null> {
    if (session) {
      return this.salesModel
        .findByIdAndUpdate(salesId, updateData, { new: true })
        .session(session)
        .lean()
        .exec();
    }
    return this.salesModel
      .findByIdAndUpdate(salesId, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(
    salesId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISales | null> {
    if (session) {
      return this.salesModel
        .findByIdAndDelete(salesId)
        .session(session)
        .lean()
        .exec();
    }
    return this.salesModel.findByIdAndDelete(salesId).lean().exec();
  }

  async getTotalSales(session?: mongoose.ClientSession): Promise<number> {
    if (session) {
      const result = await this.salesModel
        .aggregate([
          { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
        ])
        .session(session)
        .exec();
      return result[0]?.totalSales || 0;
    }
    const result = await this.salesModel
      .aggregate([
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
      ])
      .exec();
    return result[0]?.totalSales || 0;
  }

  async getSalesByMonth(
    monthsBack: number,
    year: number,
    session?: mongoose.ClientSession,
  ): Promise<{ month: number; total: number; count: number }[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const results = await this.salesModel
      .aggregate([
        { $match: { saleDate: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $month: "$saleDate" },
            total: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .session(session ?? null);

    return results.map((r) => ({
      month: r._id,
      total: r.total,
      count: r.count,
    }));
  }
  async getTotalSalesInRange(
    startDate: Date,
    endDate: Date,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const [result] = await this.salesModel
      .aggregate([
        { $match: { saleDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ])
      .session(session ?? null);
    return result?.total ?? 0;
  }
}
