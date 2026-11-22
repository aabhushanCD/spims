// smartReorder.repo.ts

import type mongoose from "mongoose";
import type { Types } from "mongoose";
import type SmartReorderModel from "../model/smartReorder.model.ts";
import type { ISmartReorder } from "../model/smartReorder.model.ts";
import { isDuplicateKeyError } from "../../../shared/utils/mongoError.ts";

const STATUS_FILTERS: Record<
  ISmartReorder["status"],
  { status: ISmartReorder["status"] }
> = {
  PENDING: { status: "PENDING" },
  APPROVED: { status: "APPROVED" },
  REJECTED: { status: "REJECTED" },
};

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

  /**
   * Updates the single pending recommendation for a medicine, or creates one.
   * Combined with the partial unique index on `{ medicineId }` for PENDING
   * rows, this prevents duplicate open recommendations.
   */
  async upsertPending(
    data: Partial<ISmartReorder> & { medicineId: Types.ObjectId },
    session?: mongoose.ClientSession,
  ): Promise<ISmartReorder> {
    const { medicineId, ...fields } = data;
    const run = () =>
      this.smartReorderModel
        .findOneAndUpdate(
          { medicineId, status: "PENDING" },
          {
            $set: { ...fields, status: "PENDING" },
            $setOnInsert: { medicineId },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
            ...(session ? { session } : {}),
          },
        )
        .lean()
        .exec();

    try {
      const result = await run();
      if (!result) {
        throw new Error("Smart reorder upsert returned no document");
      }
      return result;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
      // A concurrent request inserted the pending row first. Update it.
      const result = await this.smartReorderModel
        .findOneAndUpdate(
          { medicineId, status: "PENDING" },
          { $set: { ...fields, status: "PENDING" } },
          { new: true, runValidators: true, ...(session ? { session } : {}) },
        )
        .lean()
        .exec();
      if (!result) {
        throw error;
      }
      return result;
    }
  }

  async findPendingByMedicineId(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<ISmartReorder | null> {
    const query = this.smartReorderModel.findOne({
      medicineId,
      status: "PENDING",
    });
    if (session) {
      return query.session(session).lean().exec();
    }
    return query.lean().exec();
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

  async findAll(
    status?: ISmartReorder["status"],
    session?: mongoose.ClientSession,
  ): Promise<ISmartReorder[]> {
    const filter = status ? STATUS_FILTERS[status] : {};

    if (session) {
      return this.smartReorderModel
        .find(filter)
        .populate("medicineId")
        .session(session)
        .lean()
        .exec();
    }
    return this.smartReorderModel
      .find(filter)
      .populate("medicineId")
      .lean()
      .exec();
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
    const filter = STATUS_FILTERS[status];

    if (session) {
      return this.smartReorderModel
        .find(filter)
        .session(session)
        .lean()
        .exec();
    }
    return this.smartReorderModel.find(filter).lean().exec();
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
