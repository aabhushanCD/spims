// notification.service.ts
import mongoose, { Types } from "mongoose";
import type { AppError } from "../../../shared/error.ts";
import type { NotificationRepo } from "../repo/notification.repo.ts";
import type { NotificationRecipientRepo } from "../repo/notificationRecipient.repo.ts";
import type { UserRepository } from "../../user/repo/user.repo.ts";
import type { UserRole } from "../../user/model/user.model.ts";
import type { INotification } from "../model/notification.model.ts";
import type {
  INotificationRecipient,
  NotificationRecipientStatus,
} from "../model/notificationRecipient.model.ts";
import { push } from "../../../shared/provider/websocker.provider.ts";
import { sendEmail } from "../../../shared/provider/email.provider.ts";
import {
  NonRetryableDeliveryError,
  sendSms,
} from "../../../shared/provider/sms.provider.ts";
import {
  decodeCursor,
  encodeCursor,
} from "../utils/notification.pagination.ts";

import {
  MAX_ERROR_LENGTH,
  MAX_NOTIFICATION_RECIPIENTS,
  MAX_SEND_ATTEMPTS,
  RETRY_DELAYS_MS,
  STALE_IN_FLIGHT_MS,
} from "../notification.constants.ts";

export {
  DEFAULT_PAGE_LIMIT,
  MAX_ERROR_LENGTH,
  MAX_NOTIFICATION_RECIPIENTS,
  MAX_PAGE_LIMIT,
  MAX_SEND_ATTEMPTS,
  RETRY_DELAYS_MS,
  STALE_IN_FLIGHT_MS,
} from "../notification.constants.ts";

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: "Email" | "SMS" | "InApp";
  userIds: string[];
  critical?: boolean | undefined;
}

export interface NotificationViewer {
  userId: string;
  role: UserRole;
}

export interface DispatchOptions {
  force?: boolean | undefined;
}

export interface PageOptions {
  cursor?: string | undefined;
  limit: number;
}

export interface NotificationView {
  _id: Types.ObjectId;
  title: string;
  message: string;
  type: "Email" | "SMS" | "InApp";
  status: "Pending" | "Sent" | "Failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface InboxItem extends NotificationView {
  recipientStatus: NotificationRecipientStatus;
  sentAt: Date | null;
  readAt: Date | null;
}

export interface NotificationListPage {
  items: NotificationView[];
  nextCursor: string | null;
}

export interface InboxPage {
  items: InboxItem[];
  nextCursor: string | null;
  unreadCount: number;
}

interface RecipientViewBase {
  _id: string;
  userId: string;
  status: NotificationRecipientStatus;
  sentAt: Date | null;
  readAt: Date | null;
}

interface OwnerRecipientView extends RecipientViewBase {
  error: string | null;
  attempts: number;
  lastAttemptAt: Date | null;
  nextAttemptAt: Date | null;
}

type RecipientView = RecipientViewBase | OwnerRecipientView;

export interface NotificationDetail extends NotificationView {
  recipients: RecipientView[];
}

export function nextRetryDelayMs(attemptNumber: number): number | null {
  if (attemptNumber >= MAX_SEND_ATTEMPTS) {
    return null;
  }
  return RETRY_DELAYS_MS[attemptNumber - 1] ?? null;
}

export function toErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw.slice(0, MAX_ERROR_LENGTH);
}

const ROLE_RANK: Record<UserRole, number> = {
  owner: 3,
  pharmacist: 2,
  inventory_manager: 1,
};

function roleRank(role: string): number | null {
  if (role === "owner" || role === "pharmacist" || role === "inventory_manager") {
    return ROLE_RANK[role];
  }
  return null;
}

function isPermanentEmailError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const responseCode = (error as { responseCode?: unknown }).responseCode;
  return (
    typeof responseCode === "number" &&
    responseCode >= 500 &&
    responseCode < 600
  );
}

function publicNotification(notification: INotification): NotificationView {
  return {
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    status: notification.status,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepo,
    private readonly recipientRepo: NotificationRecipientRepo,
    private readonly userRepo: UserRepository,
    private readonly appError: typeof AppError,
    private readonly connection: mongoose.Connection,
  ) {}

  // Creates the notification + one recipient row per unique user, all Pending.
  // Delivery happens asynchronously after the transaction commits.
  async createNotification(dto: CreateNotificationDto) {
    const normalizedUserIds: string[] = [];
    for (const rawUserId of dto.userIds) {
      if (!/^[a-fA-F0-9]{24}$/.test(rawUserId)) {
        throw this.appError.badRequest(`Invalid user id: ${rawUserId}`);
      }
      normalizedUserIds.push(new Types.ObjectId(rawUserId).toString());
    }

    const userIds = [...new Set(normalizedUserIds)];
    if (userIds.length === 0) {
      throw this.appError.badRequest("At least one recipient is required");
    }
    if (userIds.length > MAX_NOTIFICATION_RECIPIENTS) {
      throw this.appError.badRequest(
        `At most ${MAX_NOTIFICATION_RECIPIENTS} recipients are allowed`,
      );
    }

    // Validate all users exist up front rather than failing halfway through fan-out.
    const users = await this.userRepo.findByIds(userIds);
    const existingUserIds = new Set(
      users.map((user) => user._id.toString()),
    );
    for (const userId of userIds) {
      if (!existingUserIds.has(userId)) {
        throw this.appError.notFound(`User not found: ${userId}`);
      }
    }

    const session = await this.connection.startSession();
    try {
      const notification = await session.withTransaction(async () => {
        const created = await this.notificationRepo.create(
          {
            title: dto.title,
            message: dto.message,
            type: dto.type,
            status: "Pending",
            isCritical: dto.critical ?? false,
          },
          session,
        );

        await this.recipientRepo.createMany(
          userIds.map((userId) => ({
            notificationId: created._id,
            userId: new Types.ObjectId(userId),
            status: "Pending" as const,
            attempts: 0,
          })),
          session,
        );

        return created;
      });

      this.dispatch(notification._id.toString()).catch((err) => {
        console.error(
          `Failed to dispatch notification ${notification._id.toString()}:`,
          err,
        );
      });
      return publicNotification(notification);
    } finally {
      await session.endSession();
    }
  }

  // Dispatches eligible recipients. Per-recipient status is the real source of
  // truth for delivery outcome; the parent Notification.status is a summary.
  async dispatch(notificationId: string, options: DispatchOptions = {}) {
    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) {
      throw this.appError.notFound("Notification not found");
    }

    const recipients =
      await this.recipientRepo.findByNotificationId(notificationId);
    const now = new Date();
    const force = options.force === true;
    const eligible = recipients.filter((recipient) =>
      this.isEligible(recipient, now, force),
    );

    for (const recipient of eligible) {
      const userId = recipient.userId.toString();
      const attempts = recipient.attempts ?? 0;

      // Optimistic claim: only one dispatcher (request path or sweep) may send
      // this row. `lastAttemptAt` also marks the delivery as in flight.
      const claimed = await this.recipientRepo.claimForDispatch(
        recipient._id.toString(),
        recipient.status,
        attempts,
        recipient.lastAttemptAt ?? null,
        now,
      );
      if (!claimed) {
        continue;
      }

      try {
        const outcome = await this.dispatchToRecipient(notification, userId);
        if (outcome === "skipped") {
          await this.recipientRepo.update(recipient._id.toString(), {
            status: "Skipped",
            error: "Recipient opted out",
            attempts: 0,
            sentAt: null,
            lastAttemptAt: now,
            nextAttemptAt: null,
          });
          continue;
        }

        await this.recipientRepo.update(recipient._id.toString(), {
          status: "Sent",
          sentAt: now,
          lastAttemptAt: now,
          attempts: attempts + 1,
          error: null,
          nextAttemptAt: null,
        });
      } catch (error) {
        const newAttempts = attempts + 1;
        const nonRetryable =
          error instanceof NonRetryableDeliveryError ||
          (notification.type === "Email" && isPermanentEmailError(error));
        const delay = nonRetryable ? null : nextRetryDelayMs(newAttempts);

        await this.recipientRepo.update(recipient._id.toString(), {
          status: "Failed",
          sentAt: null,
          lastAttemptAt: now,
          attempts: newAttempts,
          error: toErrorMessage(error),
          nextAttemptAt:
            delay === null ? null : new Date(now.getTime() + delay),
        });
      }
    }

    const allRecipients =
      await this.recipientRepo.findByNotificationId(notificationId);
    const anySent = allRecipients.some((recipient) => recipient.status === "Sent");
    const allTerminal =
      allRecipients.length > 0 &&
      allRecipients.every(
        (recipient) =>
          recipient.status === "Skipped" ||
          (recipient.status === "Failed" && recipient.nextAttemptAt == null),
      );
    const status = anySent ? "Sent" : allTerminal ? "Failed" : "Pending";

    await this.notificationRepo.update(notificationId, { status });

    const fresh = await this.notificationRepo.findById(notificationId);
    if (!fresh) {
      throw this.appError.notFound("Notification not found");
    }
    return publicNotification(fresh);
  }

  async retryScheduled(): Promise<{ attempted: number }> {
    const now = new Date();
    const notificationIds =
      await this.recipientRepo.findRetryableNotificationIds(
        now,
        new Date(now.getTime() - STALE_IN_FLIGHT_MS),
        MAX_SEND_ATTEMPTS,
      );

    for (const notificationId of notificationIds) {
      try {
        await this.dispatch(notificationId);
      } catch (error) {
        console.error(
          `Failed to retry notification ${notificationId}:`,
          error,
        );
      }
    }

    return { attempted: notificationIds.length };
  }

  private isEligible(
    recipient: INotificationRecipient,
    now: Date,
    force: boolean,
  ): boolean {
    const attempts = recipient.attempts ?? 0;

    if (recipient.status === "Pending") {
      if (attempts >= MAX_SEND_ATTEMPTS) {
        return false;
      }
      // Never attempted, or a claim older than the in-flight window (crash).
      if (recipient.lastAttemptAt == null) {
        return true;
      }
      return (
        recipient.lastAttemptAt.getTime() <=
        now.getTime() - STALE_IN_FLIGHT_MS
      );
    }

    if (recipient.status !== "Failed") {
      return false;
    }
    if (force) {
      return true;
    }
    return (
      recipient.nextAttemptAt != null &&
      recipient.nextAttemptAt.getTime() <= now.getTime() &&
      attempts < MAX_SEND_ATTEMPTS
    );
  }

  private async dispatchToRecipient(
    notification: INotification,
    userId: string,
  ): Promise<"sent" | "skipped"> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NonRetryableDeliveryError("User not found at dispatch time");
    }

    if (notification.type === "InApp") {
      push(userId, {
        title: notification.title,
        message: notification.message,
      });
      return "sent";
    }

    const preferences = user.notificationPreferences;
    const optedOut =
      notification.type === "Email"
        ? preferences?.email === false
        : preferences?.sms === false;

    if (!notification.isCritical && optedOut) {
      return "skipped";
    }

    if (notification.type === "Email") {
      await sendEmail({
        to: user.email,
        subject: notification.title,
        text: notification.message,
      });
      return "sent";
    }

    const phone = user.phone?.trim();
    if (!phone) {
      throw new NonRetryableDeliveryError("Recipient has no phone number");
    }

    await sendSms({ to: phone, message: notification.message });
    return "sent";
  }

  async getById(
    id: string,
    viewer: NotificationViewer,
  ): Promise<NotificationDetail> {
    if (viewer.role !== "owner" && viewer.role !== "pharmacist") {
      throw this.appError.forbidden(
        "You cannot view this notification detail",
      );
    }

    const notification = await this.notificationRepo.findById(id);
    if (!notification) {
      throw this.appError.notFound("Notification not found");
    }

    const recipients = await this.recipientRepo.findByNotificationId(id);
    const isOwner = viewer.role === "owner";
    const recipientViews: RecipientView[] = recipients.map((recipient) => {
      const base: RecipientViewBase = {
        _id: recipient._id.toString(),
        userId: recipient.userId.toString(),
        status: recipient.status,
        sentAt: recipient.sentAt ?? null,
        readAt: recipient.readAt ?? null,
      };

      if (!isOwner) {
        return base;
      }

      return {
        ...base,
        error: recipient.error ?? null,
        attempts: recipient.attempts ?? 0,
        lastAttemptAt: recipient.lastAttemptAt ?? null,
        nextAttemptAt: recipient.nextAttemptAt ?? null,
      };
    });

    return { ...publicNotification(notification), recipients: recipientViews };
  }

  async getAll(page: PageOptions): Promise<NotificationListPage> {
    const cursor = page.cursor ? decodeCursor(page.cursor) : null;
    const rows = await this.notificationRepo.findAllPaged(cursor, page.limit);
    const hasMore = rows.length > page.limit;
    const items = hasMore ? rows.slice(0, page.limit) : rows;
    const last = items.at(-1);
    const nextCursor =
      hasMore && last
        ? encodeCursor(last.createdAt, last._id.toString())
        : null;

    return {
      items: items.map((notification) => publicNotification(notification)),
      nextCursor,
    };
  }

  async getForUser(
    targetUserId: string,
    viewer: NotificationViewer,
    page: PageOptions,
  ): Promise<InboxPage> {
    await this.assertCanViewInbox(targetUserId, viewer);

    const cursor = page.cursor ? decodeCursor(page.cursor) : null;
    const rows = await this.recipientRepo.findByUserIdPaged(
      targetUserId,
      cursor,
      page.limit,
    );
    const hasMore = rows.length > page.limit;
    const pageRows = hasMore ? rows.slice(0, page.limit) : rows;

    const notifications = await this.notificationRepo.findByIds(
      pageRows.map((row) => row.notificationId.toString()),
    );
    const byId = new Map(
      notifications.map((notification) => [
        notification._id.toString(),
        notification,
      ]),
    );

    const items: InboxItem[] = [];
    for (const row of pageRows) {
      const notification = byId.get(row.notificationId.toString());
      if (!notification) {
        continue;
      }
      items.push({
        ...publicNotification(notification),
        recipientStatus: row.status,
        sentAt: row.sentAt ?? null,
        readAt: row.readAt ?? null,
      });
    }

    const lastRow = pageRows.at(-1);
    const nextCursor =
      hasMore && lastRow
        ? encodeCursor(lastRow.createdAt, lastRow._id.toString())
        : null;
    const unreadCount = await this.recipientRepo.countUnread(targetUserId);

    return { items, nextCursor, unreadCount };
  }

  async markRead(userId: string, notificationId: string) {
    const recipient = await this.recipientRepo.markRead(
      userId,
      notificationId,
    );
    if (!recipient) {
      throw this.appError.notFound("Notification not found");
    }
    return { readAt: recipient.readAt ?? null };
  }

  async markAllRead(userId: string) {
    const updated = await this.recipientRepo.markAllRead(userId);
    return { updated };
  }

  async getPreferences(targetUserId: string, viewer: NotificationViewer) {
    await this.assertCanViewPreferences(targetUserId, viewer);
    const preferences =
      await this.userRepo.getNotificationPreferences(targetUserId);
    if (!preferences) {
      throw this.appError.notFound("User not found");
    }
    return preferences;
  }

  async updatePreferences(
    targetUserId: string,
    viewer: NotificationViewer,
    patch: { email?: boolean | undefined; sms?: boolean | undefined },
  ) {
    if (viewer.userId !== targetUserId && viewer.role !== "owner") {
      throw this.appError.forbidden(
        "Only owners can update another user's notification preferences",
      );
    }

    const preferences = await this.userRepo.updateNotificationPreferences(
      targetUserId,
      patch,
    );
    if (!preferences) {
      throw this.appError.notFound("User not found");
    }
    return preferences;
  }

  async delete(id: string) {
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.recipientRepo.deleteByNotificationId(id, session);
        const deleted = await this.notificationRepo.delete(id, session);
        if (!deleted) {
          throw this.appError.notFound("Notification not found");
        }
      });
    } finally {
      await session.endSession();
    }
  }

  private async assertCanViewInbox(
    targetUserId: string,
    viewer: NotificationViewer,
  ): Promise<void> {
    if (viewer.userId === targetUserId) {
      return;
    }

    const target = await this.userRepo.findById(targetUserId);
    if (!target) {
      throw this.appError.notFound("User not found");
    }

    const viewerRank = roleRank(viewer.role);
    const targetRank = roleRank(target.role);
    if (
      viewerRank === null ||
      targetRank === null ||
      viewerRank < targetRank
    ) {
      throw this.appError.forbidden(
        "You cannot view this user's notifications",
      );
    }
  }

  private async assertCanViewPreferences(
    targetUserId: string,
    viewer: NotificationViewer,
  ): Promise<void> {
    if (viewer.userId === targetUserId) {
      return;
    }
    if (viewer.role !== "owner") {
      throw this.appError.forbidden(
        "Only owners can view another user's notification preferences",
      );
    }
  }
}
