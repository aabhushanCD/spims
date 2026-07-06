import type mongoose from "mongoose";
import type { IBatch } from "../model/medicineBatch.model.js";
import type Batch from "../model/medicineBatch.model.js";

export class MedicineBatchRepo {
  constructor(private readonly batchModel: typeof Batch) {}

  async create(
    batchData: Partial<IBatch>,
    session?: mongoose.ClientSession,
  ): Promise<IBatch> {
    const batch = new this.batchModel(batchData);
    if (session) {
      return await batch.save({ session });
    }
    return batch.save();
  }

  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch | null> {
    if (session) {
      return await this.batchModel.findById(id).session(session).lean().exec();
    }
    return await this.batchModel.findById(id).lean().exec();
  }

  async findAll(session?: mongoose.ClientSession): Promise<IBatch[]> {
    if (session) {
      return await this.batchModel.find().session(session).lean().exec();
    }
    return await this.batchModel.find().lean().exec();
  }
  async findByMedicineId(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch | null> {
    if (session) {
      return await this.batchModel
        .findOne({ medicineId })
        .session(session)
        .lean()
        .exec();
    }
    return await this.batchModel.findOne({ medicineId }).lean().exec();
  }
  async findAllByMedicineId(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch[]> {
    if (session) {
      return await this.batchModel
        .find({ medicineId })
        .session(session)
        .lean()
        .exec();
    }
    return await this.batchModel.find({ medicineId }).lean().exec();
  }

  async getTotalStock(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const findOptions: any = { medicineId };
    if (session) {
      findOptions.session = session;
    }
    const batches = await this.batchModel.find(findOptions).lean().exec();

    if (!batches.length) return 0;

    return batches.reduce((total, batch) => total + batch.quantityRemaining, 0);
  }

  async update(
    id: string,
    updateData: Partial<IBatch>,
    session?: mongoose.ClientSession,
  ): Promise<IBatch | null> {
    if (session) {
      return await this.batchModel
        .findByIdAndUpdate(id, updateData, { new: true, session })
        .lean()
        .exec();
    }
    return await this.batchModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch | null> {
    if (session) {
      return await this.batchModel
        .findByIdAndDelete(id, { session })
        .lean()
        .exec();
    }
    return await this.batchModel.findByIdAndDelete(id).lean().exec();
  }
}
