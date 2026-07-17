import mongoose from "mongoose";
import type { ISalesReturn } from "../model/return.model.ts";
import type Return from "../model/return.model.ts";

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

  async findAll(session?: mongoose.ClientSession): Promise<ISalesReturn[]> {
    if (session) {
      return this.returnModel.find().session(session).lean().exec();
    }
    return this.returnModel.find().lean().exec();
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
  async getTotalRefundAmount(
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const result = await this.returnModel
      .aggregate([
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

  async approveReturn(
    returnId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn | null> {
    const options = {
      new: true,
      ...(session ? { session } : {}),
    };

    if (session) {
      const updatedReturn = await this.returnModel
        .findByIdAndUpdate(returnId, { status: "APPROVED" }, options)
        .lean()
        .exec();

      return updatedReturn;
    }
    const updatedReturn = await this.returnModel
      .findByIdAndUpdate(returnId, { status: "APPROVED" }, options)
      .lean()
      .exec();

    return updatedReturn;
  }

  async rejectReturn(
    returnId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn | null> {
    const options = {
      new: true,
      ...(session ? { session } : {}),
    };

    if (session) {
      const updatedReturn = await this.returnModel
        .findByIdAndUpdate(returnId, { status: "REJECTED" }, options)
        .lean()
        .exec();

      return updatedReturn;
    }
    const updatedReturn = await this.returnModel
      .findByIdAndUpdate(returnId, { status: "REJECTED" }, options)
      .lean()
      .exec();
    return updatedReturn;
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
    const totalReturnsQuery = this.returnModel.countDocuments();
    const totalRefundAmountQuery = this.returnModel
      .aggregate([
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

  async cancelReturn(
    returnId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISalesReturn | null> {
    const options = {
      new: true,
      ...(session ? { session } : {}),
    };

    if (session) {
      const updatedReturn = await this.returnModel
        .findByIdAndUpdate(returnId, { status: "CANCELLED" }, options)
        .lean()
        .exec();

      return updatedReturn;
    }
    const updatedReturn = await this.returnModel
      .findByIdAndUpdate(returnId, { status: "CANCELLED" }, options)
      .lean()
      .exec();
    return updatedReturn;
  }
}
