// notification.service.ts
import mongoose, { Types } from "mongoose";
import type { AppError } from "../../../shared/error.ts";
import type { NotificationRepo } from "../repo/notification.repo.ts";
import type { NotificationRecipientRepo } from "../repo/notificationRecipient.repo.ts";
import type { UserRepository } from "../../user/repo/user.repo.ts";
import { push } from "../../../shared/provider/websocker.provider.ts";
import { sendEmail } from "../../../shared/provider/email.provider.ts";
export interface CreateNotificationDto {
  title: string;
  message: string;
  type: "Email" | "SMS" | "InApp";
  userIds: string[]; // recipients to fan out to
}

export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepo,
    private readonly recipientRepo: NotificationRecipientRepo,
    private readonly userRepo: UserRepository,
    private readonly appError: typeof AppError,
    private readonly connection: mongoose.Connection,
  ) {}

  // Creates the notification + one recipient row per user, all Pending.
  // Does NOT send yet — call dispatch() separately (or right after, see below).
  async createNotification(dto: CreateNotificationDto) {
    if (!dto.userIds || dto.userIds.length === 0) {
      throw this.appError.badRequest("At least one recipient is required");
    }

    // Validate all users exist up front rather than failing halfway through fan-out
    for (const userId of dto.userIds) {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw this.appError.notFound(`User not found: ${userId}`);
      }
    }

    const session = await this.connection.startSession();
    try {
      let notification: any;
      await session.withTransaction(async () => {
        notification = await this.notificationRepo.create(
          {
            title: dto.title,
            message: dto.message,
            type: dto.type,
            status: "Pending",
          },
          session,
        );

        await this.recipientRepo.createMany(
          dto.userIds.map((userId) => ({
            notificationId: notification._id,
            userId: new Types.ObjectId(userId),
            status: "Pending" as const,
          })),
          session,
        );
      });
      this.dispatch(notification._id.toString()).catch((err) => {
        console.error(
          `Failed to dispatch notification ${notification._id.toString()}:`,
          err,
        );
      });
      return notification;
    } finally {
      await session.endSession();
    }
  }

  // Dispatches to every Pending recipient of a notification. Per-recipient
  // status is the real source of truth for delivery outcome; the parent
  // Notification.status here just reflects "a dispatch attempt happened",
  async dispatch(notificationId: string) {
    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) {
      throw this.appError.notFound("Notification not found");
    }

    const recipients =
      await this.recipientRepo.findByNotificationId(notificationId);
    const pending = recipients.filter((r) => r.status === "Pending");

    for (const recipient of pending) {
      try {
        await this.dispatchToRecipient(
          notification,
          recipient.userId.toString(),
        );
        await this.recipientRepo.update(recipient._id.toString(), {
          status: "Sent",
          sentAt: new Date(),
        });
      } catch {
        await this.recipientRepo.update(recipient._id.toString(), {
          status: "Failed",
        });
      }
    }

    const allRecipients =
      await this.recipientRepo.findByNotificationId(notificationId);
    const anySent = allRecipients.some((r) => r.status === "Sent");
    const allFailed = allRecipients.every((r) => r.status === "Failed");

    await this.notificationRepo.update(notificationId, {
      status: allFailed ? "Failed" : anySent ? "Sent" : "Pending",
    });

    return await this.notificationRepo.findById(notificationId);
  }

  // STUB — replace with your real provider call (SendGrid/Twilio/push
  // service/etc). Currently just resolves the user and no-ops so status
  // tracking works end-to-end without a real integration wired in yet.
  private async dispatchToRecipient(
    notification: { title: string; message: string; type: string },
    userId: string,
  ): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("User not found at dispatch time");
    }
    if (notification.type === "InApp") {
      push(userId, {
        title: notification.title,
        message: notification.message,
      });
    }
    if (notification.type === "Email") {
      await sendEmail(user.email, notification.title, notification.message);
    }
  }

  async getById(id: string) {
    const notification = await this.notificationRepo.findById(id);
    if (!notification) {
      throw this.appError.notFound("Notification not found");
    }
    const recipients = await this.recipientRepo.findByNotificationId(id);
    return { ...notification, recipients };
  }

  async getAll() {
    return await this.notificationRepo.findAll();
  }

  async getForUser(userId: string) {
    const recipientRows = await this.recipientRepo.findByUserId(userId);
    const notifications = await Promise.all(
      recipientRows.map(async (row) => {
        const notification = await this.notificationRepo.findById(
          row.notificationId.toString(),
        );
        return {
          ...notification,
          recipientStatus: row.status,
          sentAt: row.sentAt,
        };
      }),
    );
    return notifications;
  }

  async delete(id: string) {
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const recipients = await this.recipientRepo.findByNotificationId(
          id,
          session,
        );
        for (const recipient of recipients) {
          await this.recipientRepo.delete(recipient._id.toString(), session);
        }
        const deleted = await this.notificationRepo.delete(id, session);
        if (!deleted) {
          throw this.appError.notFound("Notification not found");
        }
      });
    } finally {
      await session.endSession();
    }
  }
}
