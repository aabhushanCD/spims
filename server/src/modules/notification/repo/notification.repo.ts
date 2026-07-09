// notification.repo.ts
import type mongoose from "mongoose";
import type { INotification } from "../model/notification.model.ts";
import type NotificationModel from "../model/notification.model.ts";

export class NotificationRepo {
  constructor(private readonly notificationModel: typeof NotificationModel) {}

  async create(
    data: Partial<INotification>,
    session?: mongoose.ClientSession,
  ): Promise<INotification> {
    const notification = new this.notificationModel(data);
    if (session) {
      return await notification.save({ session });
    }
    return await notification.save();
  }

  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<INotification | null> {
    if (session) {
      return this.notificationModel.findById(id).session(session).lean().exec();
    }
    return this.notificationModel.findById(id).lean().exec();
  }

  async findAll(session?: mongoose.ClientSession): Promise<INotification[]> {
    if (session) {
      return this.notificationModel.find().session(session).lean().exec();
    }
    return this.notificationModel.find().lean().exec();
  }

  async update(
    id: string,
    updateData: Partial<INotification>,
    session?: mongoose.ClientSession,
  ): Promise<INotification | null> {
    if (session) {
      return this.notificationModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .session(session)
        .lean()
        .exec();
    }
    return this.notificationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<INotification | null> {
    if (session) {
      return this.notificationModel
        .findByIdAndDelete(id)
        .session(session)
        .lean()
        .exec();
    }
    return this.notificationModel.findByIdAndDelete(id).lean().exec();
  }

 
}
