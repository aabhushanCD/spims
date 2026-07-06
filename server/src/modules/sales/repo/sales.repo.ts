import type { ISales } from "../model/sales.model.ts";
import type mongoose from "mongoose";
import type Sales from "../model/sales.model.ts";
export class SalesRepo {
  constructor(private readonly salesModel: typeof Sales) {}

  async create(
    salesData: Partial<ISales>,
    session?: mongoose.ClientSession,
  ): Promise<ISales> {
    const sales = new this.salesModel(salesData, { session });
    return await sales.save();
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
      return this.salesModel.find().session(session).lean().exec();
    }
    return this.salesModel.find().lean().exec();
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
}
