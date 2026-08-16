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
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    if (session) {
      const result = await this.salesModel
        .aggregate([
          {
            $match: {
              createdAt: {
                $gte: startOfMonth,
                $lt: startOfNextMonth,
              },
            },
          },
          { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
        ])
        .session(session)
        .exec();
      return result[0]?.totalSales || 0;
    }
    const result = await this.salesModel
      .aggregate([
        {
          $match: { createdAt: { $gte: startOfMonth, $lt: startOfNextMonth } },
        },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
      ])
      .exec();
    return result[0]?.totalSales || 0;
  }

  async getSalesByMonth(
    monthBack: number,
    year: number,
    session?: mongoose.ClientSession,
  ): Promise<{ month: number; total: number; count: number }[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), 0, 1);

    const endDate = new Date(now.getFullYear() + 1, 0, 1);

    const results = await this.salesModel
      .aggregate([
        {
          $match: {
            saleDate: {
              $gte: startOfMonth,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: { $month: "$saleDate" },
            total: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ])
      .session(session ?? null);

    // Convert aggregation results into a map
    const salesMap = new Map(
      results.map((r) => [
        r._id,
        {
          total: r.total,
          count: r.count,
        },
      ]),
    );

    // Return all 12 months
    return Array.from({ length: now.getMonth() + 1 }, (_, index) => {
      const month = index + 1;
      const data = salesMap.get(month);
      if (!data) {
        return {
          month,
          total: 0,
          count: 0,
        };
      }
      return {
        month,
        total: data?.total ?? 0,
        count: data?.count ?? 0,
      };
    });
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
