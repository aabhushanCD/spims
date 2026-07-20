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

  async increaseBatchStock(
    batchId: string,
    quantity: number,
    session?: mongoose.ClientSession,
  ): Promise<IBatch | null> {
    const options = { new: true, session: session ?? null };
    const updatedBatch = await this.batchModel
      .findByIdAndUpdate(
        batchId,
        { $inc: { quantityRemaining: quantity } },
        options,
      )
      .lean()
      .exec();
    return updatedBatch;
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
      return await this.batchModel.find().session(session).populate("medicineId", "medicineName").lean().exec();
    }
    return await this.batchModel.find().populate("medicineId", "medicineName").lean().exec();
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
    const batches = session
      ? await this.batchModel
          .find({
            medicineId,
            quantityRemaining: {
              $gt: 0,
            },
            expiryDate: {
              $gt: new Date(),
            },
            isExpired: false,
          })
          .session(session)
          .lean()
          .exec()
      : await this.batchModel.find({ medicineId }).lean().exec();

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
  async deductBatchStock(
    batchId: string,
    quantity: number,
    session?: mongoose.ClientSession,
  ) {
    return this.batchModel
      .findOneAndUpdate(
        {
          _id: batchId,
          quantityRemaining: { $gte: quantity },
        },
        {
          $inc: {
            quantityRemaining: -quantity,
          },
        },
        {
          new: true,
          session,
        },
      )
      .lean()
      .exec();
  }
  async findSellableBatches(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch[]> {
    const query = this.batchModel
      .find({
        medicineId,
        quantityRemaining: { $gt: 0 },
        expiryDate: { $gt: new Date() },
        isExpired: false,
      })
      .sort({
        expiryDate: 1,
        manufacturingDate: 1,
        createdAt: 1,
      });

    return session ? query.session(session).lean().exec() : query.lean().exec();
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

  async getTotalMedicineBatches(
    session?: mongoose.ClientSession,
  ): Promise<number> {
    return this.batchModel
      .countDocuments()
      .session(session ?? null)
      .exec();
  }

  async getExpiringSoonCount(
    days: number,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.batchModel
      .countDocuments({
        expiryDate: { $gte: now, $lte: cutoff },
        quantityRemaining: { $gt: 0 },
      })
      .session(session ?? null)
      .exec();
  }

  async findMostRecentPurchaseOrderId(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<mongoose.Types.ObjectId | null> {
    const query = this.batchModel
      .findOne({ medicineId })
      .sort({ createdAt: -1 });

    const batch = session
      ? await query.session(session).lean().exec()
      : await query.lean().exec();

    return batch?.purchaseOrderId ?? null;
  }

  async getUsableStock(
    medicineId: string,
    expiryCutoff: Date,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const filter = { medicineId, expiryDate: { $gt: expiryCutoff } };
    const batches = session
      ? await this.batchModel.find(filter).session(session).lean().exec()
      : await this.batchModel.find(filter).lean().exec();

    if (!batches.length) return 0;
    return batches.reduce((total, batch) => total + batch.quantityRemaining, 0);
  }

  async getExpiringUnits(
    medicineId: string,
    expiryCutoff: Date,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const filter = {
      medicineId,
      expiryDate: { $lte: expiryCutoff },
      quantityRemaining: { $gt: 0 },
    };
    const batches = session
      ? await this.batchModel.find(filter).session(session).lean().exec()
      : await this.batchModel.find(filter).lean().exec();

    if (!batches.length) return 0;
    return batches.reduce((total, batch) => total + batch.quantityRemaining, 0);
  }
}
