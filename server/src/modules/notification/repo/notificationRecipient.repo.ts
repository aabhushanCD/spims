// notificationRecipient.repo.ts
import type mongoose from "mongoose";
import type { INotificationRecipient } from "../model/notificationRecipient.model.ts";
import type NotificationRecipientModel from "../model/notificationRecipient.model.ts";

export class NotificationRecipientRepo {
  constructor(
    private readonly recipientModel: typeof NotificationRecipientModel,
  ) {}

  async create(
    data: Partial<INotificationRecipient>,
    session?: mongoose.ClientSession,
  ): Promise<INotificationRecipient> {
    const recipient = new this.recipientModel(data);
    if (session) {
      return await recipient.save({ session });
    }
    return await recipient.save();
  }

  async createMany(
    data: Partial<INotificationRecipient>[],
    session?: mongoose.ClientSession,
  ): Promise<INotificationRecipient[]> {
    if (session) {
      const docs = await this.recipientModel.insertMany(data, { session });
      return docs as unknown as INotificationRecipient[];
    }
    const docs = await this.recipientModel.insertMany(data);

    return docs as unknown as INotificationRecipient[];
  }

  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<INotificationRecipient | null> {
    if (session) {
      return this.recipientModel.findById(id).session(session).lean().exec();
    }
    return this.recipientModel.findById(id).lean().exec();
  }

  async findByNotificationId(
    notificationId: string,
    session?: mongoose.ClientSession,
  ): Promise<INotificationRecipient[]> {
    if (session) {
      return this.recipientModel
        .find({ notificationId })
        .session(session)
        .lean()
        .exec();
    }
    return this.recipientModel.find({ notificationId }).lean().exec();
  }

  async findByUserId(
    userId: string,
    session?: mongoose.ClientSession,
  ): Promise<INotificationRecipient[]> {
    if (session) {
      return this.recipientModel
        .find({ userId })
        .session(session)
        .lean()
        .exec();
    }
    return this.recipientModel.find({ userId }).lean().exec();
  }

  async update(
    id: string,
    updateData: Partial<INotificationRecipient>,
    session?: mongoose.ClientSession,
  ): Promise<INotificationRecipient | null> {
    if (session) {
      return this.recipientModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .session(session)
        .lean()
        .exec();
    }
    return this.recipientModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();
  }

  async delete(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<INotificationRecipient | null> {
    if (session) {
      return this.recipientModel
        .findByIdAndDelete(id)
        .session(session)
        .lean()
        .exec();
    }
    return this.recipientModel.findByIdAndDelete(id).lean().exec();
  }

  async countByStatus(
    status: "Pending" | "Sent" | "Failed",
    session?: mongoose.ClientSession,
  ): Promise<number> {
    return this.recipientModel
      .countDocuments({ status })
      .session(session ?? null)
      .exec();
  }
}
