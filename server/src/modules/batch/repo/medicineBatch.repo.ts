import type { IBatch } from "../model/medicineBatch.model.js";
import type Batch from "../model/medicineBatch.model.js";
import mongoose from "mongoose";
import { escapeRegex } from "../../../shared/utils/escapeRegex.ts";
import {
  cursorFilter,
  type PageCursor,
} from "../../../shared/pagination/cursor.ts";
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
    expectedQuantity: number,
    session?: mongoose.ClientSession,
  ): Promise<IBatch | null> {
    const options = { new: true, session: session ?? null };
    const updatedBatch = await this.batchModel
      .findOneAndUpdate(
        {
          _id: { $eq: batchId },
          quantityRemaining: { $eq: expectedQuantity },
        },
        { $inc: { quantityRemaining: quantity } },
        options,
      )
      .lean()
      .exec();
    return updatedBatch;
  }

  async setBatchStock(
    batchId: string,
    expectedQuantity: number,
    newQuantity: number,
    session?: mongoose.ClientSession,
  ): Promise<IBatch | null> {
    return this.batchModel
      .findOneAndUpdate(
        {
          _id: { $eq: batchId },
          quantityRemaining: { $eq: expectedQuantity },
        },
        { $set: { quantityRemaining: newQuantity } },
        { new: true, session: session ?? null },
      )
      .lean()
      .exec();
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
      return await this.batchModel
        .find()
        .session(session)
        .populate("medicineId", "medicineName")
        .lean()
        .exec();
    }
    return await this.batchModel
      .find()
      .populate("medicineId", "medicineName")
      .lean()
      .exec();
  }
  async findPage(
    filters: {
      search?: string;
      medicineId?: string;
      isExpired?: boolean;
      isActive?: boolean;
      expiringInDays?: number;
    },
    cursor: PageCursor | null,
    limit: number,
  ): Promise<IBatch[]> {
    const conditions: Record<string, unknown>[] = [];
    if (filters.medicineId) {
      conditions.push({ medicineId: filters.medicineId });
    }
    if (filters.isExpired !== undefined) {
      conditions.push({ isExpired: filters.isExpired });
    }
    if (filters.isActive !== undefined) {
      conditions.push({ isActive: filters.isActive });
    }
    if (filters.expiringInDays !== undefined) {
      const now = new Date();
      const cutoff = new Date(
        now.getTime() + filters.expiringInDays * 24 * 60 * 60 * 1000,
      );
      conditions.push({ expiryDate: { $gte: now, $lte: cutoff } });
    }
    if (filters.search) {
      const regex = new RegExp(escapeRegex(filters.search), "i");
      conditions.push({ batchNumber: regex });
    }
    const cursorClause = cursorFilter("createdAt", cursor);
    if (Object.keys(cursorClause).length > 0) {
      conditions.push(cursorClause);
    }
    const query = conditions.length > 0 ? { $and: conditions } : {};

    return this.batchModel
      .find(query)
      .populate("medicineId", "medicineName")
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
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
    const query = this.batchModel
      .find({ medicineId })
      .sort({ createdAt: -1, _id: -1 });
    if (session) {
      return await query.session(session).lean().exec();
    }
    return await query.lean().exec();
  }

  async getTotalStock(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const query = this.batchModel.find({
      medicineId: { $eq: medicineId },
      quantityRemaining: {
        $gt: 0,
      },
      expiryDate: {
        $gt: new Date(),
      },
      isExpired: false,
    });

    if (session) {
      query.session(session);
    }

    const batches = await query.lean().exec();

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
    const filter = {
      _id: { $eq: batchId },
      quantityRemaining: { $gte: quantity },
    };
    const options = { new: true, session: session ?? null };

    return this.batchModel
      .findOneAndUpdate(
        filter,
        {
          $inc: {
            quantityRemaining: -quantity,
          },
        },
        options,
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
      .countDocuments({
        quantityRemaining: { $gt: 0 },
        expiryDate: { $gt: new Date() },
        isExpired: false,
      })
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

  async findExpiredCandidates(
    now: Date,
    session?: mongoose.ClientSession,
  ): Promise<IBatch[]> {
    const query = this.batchModel.find({
      expiryDate: { $lt: now },
      quantityRemaining: { $gt: 0 },
      isExpired: false,
    });
    return session ? query.session(session).lean().exec() : query.lean().exec();
  }

  async findExpired(
    now: Date,
    session?: mongoose.ClientSession,
  ): Promise<IBatch[]> {
    const query = this.batchModel.find({ expiryDate: { $lt: now } });
    return session ? query.session(session).lean().exec() : query.lean().exec();
  }

  async findExpiredAwaitingDisposal(
    session?: mongoose.ClientSession,
  ): Promise<IBatch[]> {
    const query = this.batchModel.find({
      isExpired: true,
      quantityRemaining: { $gt: 0 },
    });
    return session ? query.session(session).lean().exec() : query.lean().exec();
  }

  async findLowStock(
    threshold: number,
    session?: mongoose.ClientSession,
  ): Promise<IBatch[]> {
    const query = this.batchModel.find({
      quantityRemaining: { $gt: 0, $lte: threshold },
    });
    return session ? query.session(session).lean().exec() : query.lean().exec();
  }

  async existsByPurchaseOrderId(
    purchaseOrderId: string,
    session?: mongoose.ClientSession,
  ): Promise<boolean> {
    const query = this.batchModel.exists({ purchaseOrderId });
    const exists = session ? await query.session(session) : await query;
    return !!exists;
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
    const filter = {
      medicineId,
      expiryDate: { $gt: expiryCutoff },
      quantityRemaining: { $gt: 0 },
      isExpired: false,
    };
    const batches = session
      ? await this.batchModel.find(filter).session(session).lean().exec()
      : await this.batchModel.find(filter).lean().exec();

    if (!batches.length) return 0;
    return batches.reduce((total, batch) => total + batch.quantityRemaining, 0);
  }

  async getExpiringUnits(
    medicineId: string,
    from: Date,
    expiryCutoff: Date,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const filter = {
      medicineId,
      expiryDate: { $gt: from, $lte: expiryCutoff },
      quantityRemaining: { $gt: 0 },
      isExpired: false,
    };
    const batches = session
      ? await this.batchModel.find(filter).session(session).lean().exec()
      : await this.batchModel.find(filter).lean().exec();

    if (!batches.length) return 0;
    return batches.reduce((total, batch) => total + batch.quantityRemaining, 0);
  }
}
