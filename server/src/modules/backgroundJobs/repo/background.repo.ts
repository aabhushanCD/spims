// backgroundJob.repo.ts
import type mongoose from "mongoose";
import type BackgroundJobModel from "../model/backgroud.model.ts";
import type { IBackgroundJob } from "../model/backgroud.model.ts";

export class BackgroundJobRepo {
  constructor(private readonly backgroundJobModel: typeof BackgroundJobModel) {}

  async create(
    data: Partial<IBackgroundJob>,
    session?: mongoose.ClientSession,
  ): Promise<IBackgroundJob> {
    const job = new this.backgroundJobModel(data);
    if (session) {
      await job.save({ session });
    }
    return await job.save();
  }

  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IBackgroundJob | null> {
    if (session) {
      return this.backgroundJobModel
        .findById(id)
        .session(session)
        .lean()
        .exec();
    }
    return this.backgroundJobModel.findById(id).lean().exec();
  }

  async findAll(session?: mongoose.ClientSession): Promise<IBackgroundJob[]> {
    if (session) {
      return this.backgroundJobModel
        .find()
        .session(session)
        .sort({ scheduledAt: -1 })
        .lean()
        .exec();
    }
    return this.backgroundJobModel
      .find()
      .sort({ scheduledAt: -1 })
      .lean()
      .exec();
  }

  async findByJobName(
    jobName: string,
    session?: mongoose.ClientSession,
  ): Promise<IBackgroundJob[]> {
    if (session) {
      return this.backgroundJobModel
        .find({ jobName })
        .session(session)
        .sort({ scheduledAt: -1 })
        .lean()
        .exec();
    }
    return this.backgroundJobModel
      .find({ jobName })
      .sort({ scheduledAt: -1 })
      .lean()
      .exec();
  }

  async findByStatus(
    status: IBackgroundJob["status"],
    session?: mongoose.ClientSession,
  ): Promise<IBackgroundJob[]> {
    if (session) {
      return this.backgroundJobModel
        .find({ status })
        .session(session)
        .lean()
        .exec();
    }
    return this.backgroundJobModel.find({ status }).lean().exec();
  }

  // Finds the most recent run of a given job — useful for "has this already
  // run today" checks before scheduling a duplicate.
  async findLatestByJobName(
    jobName: string,
    session?: mongoose.ClientSession,
  ): Promise<IBackgroundJob | null> {
    if (session) {
      return this.backgroundJobModel
        .findOne({ jobName })
        .session(session)
        .sort({ scheduledAt: -1 })
        .lean()
        .exec();
    }
    return this.backgroundJobModel
      .findOne({ jobName })
      .sort({ scheduledAt: -1 })
      .lean()
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<IBackgroundJob>,
    session?: mongoose.ClientSession,
  ): Promise<IBackgroundJob | null> {
    if (session) {
      return this.backgroundJobModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .session(session)
        .lean()
        .exec();
    }
    return this.backgroundJobModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IBackgroundJob | null> {
    if (session) {
      return this.backgroundJobModel
        .findByIdAndDelete(id)
        .session(session)
        .lean()
        .exec();
    }
    return this.backgroundJobModel.findByIdAndDelete(id).lean().exec();
  }
}
