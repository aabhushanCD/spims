import mongoose from "mongoose";
import type { ISalesReturn } from "../model/return.model.ts";
import type Return from "../model/return.model.ts";
import type { ReturnStatus } from "../types/return.type.ts";

export interface OutstandingReturnQuantity {
  saleItemId: string;
  quantity: number;
}

export interface RefundTotals {
  grossRefunds: number;
  refundVat: number;
}

export class ReturnRepo {
  constructor(private readonly returnModel: typeof Return) {}

  async create(
    returnData: Partial<ISalesReturn>,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn> {
    if (session) {
      const salesReturn = new this.returnModel(returnData);
      await salesReturn.save({ session });
      return salesReturn;
    }
    const salesReturn = new this.returnModel(returnData);
    return await salesReturn.save();
  }

  async findById(
    returnId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn | null> {
    if (session) {
      return this.returnModel
        .findById(returnId)
        .populate("salesId")
        .populate("returnedBy", "name email")
        .session(session)
        .lean()
        .exec();
    }
    return this.returnModel.findById(returnId).lean().exec();
  }

  /** Loads a return without populating references (used inside transactions). */
  async findByIdRaw(
    returnId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn | null> {
    if (session) {
      return this.returnModel
        .findById(returnId)
        .session(session)
        .lean()
        .exec();
    }
    return this.returnModel.findById(returnId).lean().exec();
  }

  async findBySale(
    salesId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn[]> {
    if (session) {
      return this.returnModel
        .find({ salesId: new mongoose.Types.ObjectId(salesId) })
        .populate("salesId")
        .session(session)
        .lean()
        .exec();
    }
    return this.returnModel
      .find({ salesId: new mongoose.Types.ObjectId(salesId) })
      .lean()
      .exec();
  }

  async findAll(
    status?: ReturnStatus,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn[]> {
    const filter: Record<string, string> = {};
    if (status) {
      filter.status = status;
    }

    if (session) {
      return this.returnModel
        .find(filter)
        .session(session)
        .lean()
        .exec();
    }
    return this.returnModel.find(filter).lean().exec();
  }

  async findByReturnNumber(
    returnNumber: string,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn | null> {
    const query = this.returnModel.findOne({ returnNumber });

    return session ? query.session(session).lean().exec() : query.lean().exec();
  }

  async existsByReturnNumber(
    returnNumber: string,
    session?: mongoose.ClientSession,
  ): Promise<boolean> {
    const exists = session
      ? await this.returnModel.exists({ returnNumber }).session(session)
      : await this.returnModel.exists({ returnNumber });

    return !!exists;
  }

  async findPendingReturns(
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn[]> {
    const query = this.returnModel.find({
      status: "PENDING",
    });

    return session ? query.session(session).lean().exec() : query.lean().exec();
  }

  async update(
    returnId: string,
    updateData: Partial<ISalesReturn>,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn | null> {
    const options = {
      new: true,
      ...(session ? { session } : {}),
    };
    if (session) {
      return this.returnModel
        .findByIdAndUpdate(returnId, updateData, options)
        .session(session)
        .lean()
        .exec();
    }
    return this.returnModel
      .findByIdAndUpdate(returnId, updateData, options)
      .lean()
      .exec();
  }

  /**
   * Atomically transitions a return when it is still in `from`. Returns null
   * when the document does not exist or is already in another state.
   */
  async transitionStatus(
    returnId: string,
    from: ReturnStatus,
    to: ReturnStatus,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn | null> {
    const options = {
      new: true,
      ...(session ? { session } : {}),
    };
    if (session) {
      return this.returnModel
        .findOneAndUpdate({ _id: returnId, status: from }, { status: to }, options)
        .session(session)
        .lean()
        .exec();
    }
    return this.returnModel
      .findOneAndUpdate({ _id: returnId, status: from }, { status: to }, options)
      .lean()
      .exec();
  }

  async getTotalRefundAmount(
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const result = await this.returnModel
      .aggregate([
        { $match: { status: "COMPLETED" } },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$refundAmount",
            },
          },
        },
      ])
      .session(session ?? null);

    return result[0]?.total ?? 0;
  }

  async getReturnsByDateRange(
    startDate: Date,
    endDate: Date,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn[]> {
    const query = this.returnModel.find({
      returnDate: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    return session ? query.session(session).lean().exec() : query.lean().exec();
  }

  async getRecentReturns(
    limit: number,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn[]> {
    const query = this.returnModel.find().sort({ returnDate: -1 }).limit(limit);
    return session ? query.session(session).lean().exec() : query.lean().exec();
  }

  async getReturnStatistics(
    session?: mongoose.ClientSession,
  ): Promise<{ totalReturns: number; totalRefundAmount: number }> {
    const totalReturnsQuery = this.returnModel.countDocuments({
      status: "COMPLETED",
    });
    const totalRefundAmountQuery = this.returnModel
      .aggregate([
        { $match: { status: "COMPLETED" } },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$refundAmount",
            },
          },
        },
      ])
      .session(session ?? null);

    const [totalReturns, totalRefundAmount] = await Promise.all([
      totalReturnsQuery,
      totalRefundAmountQuery,
    ]);

    return {
      totalReturns,
      totalRefundAmount: totalRefundAmount[0]?.total ?? 0,
    };
  }

  /**
   * Refunds recognised in a half-open period. Only COMPLETED returns count.
   * Legacy completed returns have no embedded VAT, so `refundVat` is 0 for
   * them; their `refundAmount` was already VAT-exclusive.
   */
  async getRefundTotalsInRange(
    start: Date,
    endExclusive: Date,
    session?: mongoose.ClientSession,
  ): Promise<RefundTotals> {
    const [result] = await this.returnModel
      .aggregate([
        {
          $match: {
            status: "COMPLETED",
            returnDate: { $gte: start, $lt: endExclusive },
          },
        },
        {
          $project: {
            refundAmount: { $ifNull: ["$refundAmount", 0] },
            vat: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$returnItems", []] },
                  as: "item",
                  in: { $ifNull: ["$$item.VAT", 0] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            grossRefunds: { $sum: "$refundAmount" },
            refundVat: { $sum: "$vat" },
          },
        },
      ])
      .session(session ?? null);

    return {
      grossRefunds: result?.grossRefunds ?? 0,
      refundVat: result?.refundVat ?? 0,
    };
  }

  /**
   * Quantities already promised by PENDING/APPROVED returns for the supplied
   * sale items, so a second request cannot commit the same units twice.
   */
  async sumOutstandingBySaleItemIds(
    saleItemIds: string[],
    session?: mongoose.ClientSession,
  ): Promise<OutstandingReturnQuantity[]> {
    if (!saleItemIds.length) {
      return [];
    }

    const ids = saleItemIds.map((id) => new mongoose.Types.ObjectId(id));
    const results = await this.returnModel
      .aggregate([
        {
          $match: {
            status: { $in: ["PENDING", "APPROVED"] },
            "returnItems.saleItemId": { $in: ids },
          },
        },
        { $unwind: "$returnItems" },
        { $match: { "returnItems.saleItemId": { $in: ids } } },
        {
          $group: {
            _id: "$returnItems.saleItemId",
            quantity: { $sum: "$returnItems.quantity" },
          },
        },
      ])
      .session(session ?? null);

    return results.map((row) => ({
      saleItemId: row._id.toString(),
      quantity: row.quantity,
    }));
  }

  /** True when a sale has returns that still reference it. */
  async hasActiveBySale(
    salesId: string,
    session?: mongoose.ClientSession,
  ): Promise<boolean> {
    const query = this.returnModel.exists({
      salesId: new mongoose.Types.ObjectId(salesId),
      status: { $in: ["PENDING", "APPROVED", "COMPLETED"] },
    });
    const exists = session ? await query.session(session) : await query;
    return !!exists;
  }
}
