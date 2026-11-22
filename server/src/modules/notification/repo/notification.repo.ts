// notification.repo.ts
import { Types } from "mongoose";
import type mongoose from "mongoose";
import type { INotification } from "../model/notification.model.ts";
import type NotificationModel from "../model/notification.model.ts";
import type { PageCursor } from "../utils/notification.pagination.ts";

function cursorFilter(cursor: PageCursor | null): Record<string, unknown> {
  if (!cursor) {
    return {};
  }
  return {
    $or: [
      { createdAt: { $lt: cursor.createdAt } },
      {
        createdAt: cursor.createdAt,
        _id: { $lt: new Types.ObjectId(cursor.id) },
      },
    ],
  };
}

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

  async findByIds(
    ids: string[],
    session?: mongoose.ClientSession,
  ): Promise<INotification[]> {
    if (ids.length === 0) {
      return [];
    }
    if (session) {
      return this.notificationModel
        .find({ _id: { $in: ids } })
        .session(session)
        .lean()
        .exec();
    }
    return this.notificationModel
      .find({ _id: { $in: ids } })
      .lean()
      .exec();
  }

  async findAll(session?: mongoose.ClientSession): Promise<INotification[]> {
    if (session) {
      return this.notificationModel.find().session(session).lean().exec();
    }
    return this.notificationModel.find().lean().exec();
  }

  async findAllPaged(
    cursor: PageCursor | null,
    limit: number,
    filters: {
      status?: INotification["status"];
      type?: INotification["type"];
    } = {},
    session?: mongoose.ClientSession,
  ): Promise<INotification[]> {
    const query = this.notificationModel
      .find({
        ...cursorFilter(cursor),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1);

    if (session) {
      query.session(session);
    }

    return query.lean().exec();
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
