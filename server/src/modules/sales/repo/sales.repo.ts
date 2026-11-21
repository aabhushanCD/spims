import type { ISales } from "../model/sales.model.ts";
import type mongoose from "mongoose";
import type Sales from "../model/sales.model.ts";
import {
  getElapsedMonthsInYear,
  getYearRange,
} from "../../../shared/utils/reportingPeriod.ts";

export interface SalesTotals {
  gross: number;
  vat: number;
}

export interface MonthlySalesPoint {
  month: number;
  total: number;
  count: number;
}

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

  async getSalesTotalsInRange(
    startDate: Date,
    endExclusive: Date,
    session?: mongoose.ClientSession,
  ): Promise<SalesTotals> {
    const [result] = await this.salesModel
      .aggregate([
        {
          $match: {
            status: { $ne: "CANCELLED" },
            saleDate: { $gte: startDate, $lt: endExclusive },
          },
        },
        {
          $group: {
            _id: null,
            gross: { $sum: "$totalAmount" },
            vat: { $sum: "$VAT" },
          },
        },
      ])
      .session(session ?? null);

    return {
      gross: result?.gross ?? 0,
      vat: result?.vat ?? 0,
    };
  }

  /**
   * Calendar-year monthly series. The series always starts in January of the
   * requested year; `months` caps how many entries are returned. Past years
   * return 12 entries, the current year returns January..current month, and
   * future years return an empty series.
   */
  async getSalesByMonth(input: {
    year: number;
    months?: number;
    timeZone: string;
    now?: Date;
    session?: mongoose.ClientSession;
  }): Promise<MonthlySalesPoint[]> {
    const { year, timeZone } = input;
    const months = input.months ?? 12;
    const now = input.now ?? new Date();
    const session = input.session;

    const elapsedMonths = getElapsedMonthsInYear(year, now, timeZone);
    const monthCount = Math.min(months, elapsedMonths);
    if (monthCount <= 0) {
      return [];
    }

    const range = getYearRange(year, timeZone);

    const results = await this.salesModel
      .aggregate([
        {
          $match: {
            status: { $ne: "CANCELLED" },
            saleDate: {
              $gte: range.start,
              $lt: range.endExclusive,
            },
          },
        },
        {
          $group: {
            _id: {
              $month: { date: "$saleDate", timezone: timeZone },
            },
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

    const salesMap = new Map(
      results.map((row) => [
        row._id,
        { total: row.total, count: row.count },
      ]),
    );

    return Array.from({ length: monthCount }, (_, index) => {
      const month = index + 1;
      const data = salesMap.get(month);
      return {
        month,
        total: data?.total ?? 0,
        count: data?.count ?? 0,
      };
    });
  }

  /** Gross sales (VAT-inclusive) in a half-open period. */
  async getTotalSalesInRange(
    startDate: Date,
    endExclusive: Date,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const totals = await this.getSalesTotalsInRange(
      startDate,
      endExclusive,
      session,
    );
    return totals.gross;
  }
}
