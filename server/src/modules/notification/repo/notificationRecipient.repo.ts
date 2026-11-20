// notificationRecipient.repo.ts
import { Types } from "mongoose";
import type mongoose from "mongoose";
import type {
  INotificationRecipient,
  NotificationRecipientStatus,
} from "../model/notificationRecipient.model.ts";
import NotificationRecipientModel from "../model/notificationRecipient.model.ts";
import NotificationModel from "../model/notification.model.ts";
import type { PageCursor } from "../utils/notification.pagination.ts";

const NOTIFICATIONS_COLLECTION = NotificationModel.collection.name;

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

  async findByUserIdPaged(
    userId: string,
    cursor: PageCursor | null,
    limit: number,
    session?: mongoose.ClientSession,
  ): Promise<INotificationRecipient[]> {
    const query = this.recipientModel
      .find({ userId, ...cursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1);

    if (session) {
      query.session(session);
    }

    return query.lean().exec();
  }

  async countUnread(userId: string): Promise<number> {
    const result = await this.recipientModel
      .aggregate<{ count: number }>([
        { $match: { userId: new Types.ObjectId(userId), readAt: null } },
        {
          $lookup: {
            from: NOTIFICATIONS_COLLECTION,
            localField: "notificationId",
            foreignField: "_id",
            as: "notification",
          },
        },
        { $match: { notification: { $ne: [] } } },
        { $count: "count" },
      ])
      .exec();
    return result[0]?.count ?? 0;
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<INotificationRecipient | null> {
    const newlyRead = await this.recipientModel
      .findOneAndUpdate(
        { userId, notificationId, readAt: null },
        { $set: { readAt: new Date() } },
        { new: true },
      )
      .lean()
      .exec();
    if (newlyRead) {
      return newlyRead;
    }

    // Already read: return the existing row without moving readAt.
    return this.recipientModel
      .findOne({ userId, notificationId })
      .lean()
      .exec();
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.recipientModel
      .updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } })
      .exec();
    return result.modifiedCount;
  }

  async findRetryableNotificationIds(
    now: Date,
    staleBefore: Date,
    maxAttempts: number,
  ): Promise<string[]> {
    const ids = await this.recipientModel
      .distinct("notificationId", {
        $or: [
          {
            status: "Failed",
            attempts: { $lt: maxAttempts },
            nextAttemptAt: { $ne: null, $lte: now },
          },
          {
            status: "Pending",
            attempts: { $lt: maxAttempts },
            $or: [
              { lastAttemptAt: null },
              { lastAttemptAt: { $lte: staleBefore } },
            ],
          },
        ],
      })
      .exec();
    return ids.map((id) => String(id));
  }

  /**
   * Atomically claims a recipient for one dispatcher.
   *
   * `status`, `attempts`, and `lastAttemptAt` form a compare-and-swap: the
   * first claim moves `lastAttemptAt`, so a concurrent dispatcher that read the
   * old value no longer matches and skips the row. `lastAttemptAt` also marks
   * the delivery as in flight for the stale sweep.
   */
  async claimForDispatch(
    id: string,
    expectedStatus: NotificationRecipientStatus,
    expectedAttempts: number,
    expectedLastAttemptAt: Date | null,
    claimedAt: Date,
  ): Promise<INotificationRecipient | null> {
    return this.recipientModel
      .findOneAndUpdate(
        {
          _id: id,
          status: expectedStatus,
          attempts: expectedAttempts,
          lastAttemptAt: expectedLastAttemptAt,
        },
        { $set: { lastAttemptAt: claimedAt } },
        { new: true },
      )
      .lean()
      .exec();
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

  async deleteByNotificationId(
    notificationId: string,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    const query = this.recipientModel.deleteMany({ notificationId });
    if (session) {
      query.session(session);
    }
    const result = await query.exec();
    return result.deletedCount ?? 0;
  }

  async countByStatus(
    status: NotificationRecipientStatus,
    session?: mongoose.ClientSession,
  ): Promise<number> {
    return this.recipientModel
      .countDocuments({ status })
      .session(session ?? null)
      .exec();
  }
}
