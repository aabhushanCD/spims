// smartReorder.repo.ts

import type mongoose from "mongoose";
import type SmartReorderModel from "../model/smartReorder.model.ts";
import type { ISmartReorder } from "../model/smartReorder.model.ts";

export class SmartReorderRepo {
  constructor(private readonly smartReorderModel: typeof SmartReorderModel) {}

  async create(
    data: Partial<ISmartReorder>,
    session?: mongoose.ClientSession,
  ): Promise<ISmartReorder> {
    const reorder = new this.smartReorderModel(data);
    if (session) {
      return await reorder.save({ session });
    }
    return await reorder.save();
  }

  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<ISmartReorder | null> {
    if (session) {
      return this.smartReorderModel.findById(id).session(session).lean().exec();
    }
    return this.smartReorderModel.findById(id).lean().exec();
  }

  async findAll(session?: mongoose.ClientSession): Promise<ISmartReorder[]> {
    if (session) {
      return this.smartReorderModel.find().populate("medicineId").session(session).lean().exec();
    }
    return this.smartReorderModel.find({status: "PENDING"}).populate("medicineId").lean().exec();
  }

  async findByMedicineId(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISmartReorder[]> {
    if (session) {
      return this.smartReorderModel
        .find({ medicineId })
        .session(session)
        .lean()
        .exec();
    }
    return this.smartReorderModel.find({ medicineId }).lean().exec();
  }

  async findByStatus(
    status: ISmartReorder["status"],
    session?: mongoose.ClientSession,
  ): Promise<ISmartReorder[]> {
    if (session) {
      return this.smartReorderModel
        .find({ status })
        .session(session)
        .lean()
        .exec();
    }
    return this.smartReorderModel.find({ status }).lean().exec();
  }

  async update(
    id: string,
    updateData: Partial<ISmartReorder>,
    session?: mongoose.ClientSession,
  ): Promise<ISmartReorder | null> {
    if (session) {
      return this.smartReorderModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .session(session)
        .lean()
        .exec();
    }
    return this.smartReorderModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<ISmartReorder | null> {
    if (session) {
      return this.smartReorderModel
        .findByIdAndDelete(id)
        .session(session)
        .lean()
        .exec();
    }
    return this.smartReorderModel.findByIdAndDelete(id).lean().exec();
  }
}
