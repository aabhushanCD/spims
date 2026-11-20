import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import type mongoose from "mongoose";

import { AppError } from "../../../shared/error.ts";
import { sendEmail } from "../../../shared/provider/email.provider.ts";
import { push } from "../../../shared/provider/websocker.provider.ts";
import type { INotification } from "../model/notification.model.ts";
import type { INotificationRecipient } from "../model/notificationRecipient.model.ts";
import type { NotificationRepo } from "../repo/notification.repo.ts";
import type { NotificationRecipientRepo } from "../repo/notificationRecipient.repo.ts";
import type { UserRepository } from "../../user/repo/user.repo.ts";
import {
  MAX_ERROR_LENGTH,
  MAX_NOTIFICATION_RECIPIENTS,
  NotificationService,
  RETRY_DELAYS_MS,
  nextRetryDelayMs,
  type NotificationView,
} from "./notification.service.ts";
import {
  decodeCursor,
  encodeCursor,
} from "../utils/notification.pagination.ts";

vi.mock("../../../shared/provider/websocker.provider.ts", () => ({
  push: vi.fn(),
}));

vi.mock("../../../shared/provider/email.provider.ts", () => ({
  sendEmail: vi.fn(),
}));

type NotificationRecord = {
  _id: Types.ObjectId;
  title: string;
  message: string;
  type: "Email" | "SMS" | "InApp";
  status: "Pending" | "Sent" | "Failed";
  isCritical: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type RecipientRecord = {
  _id: Types.ObjectId;
  notificationId: Types.ObjectId;
  userId: Types.ObjectId;
  sentAt: Date | null;
  status: "Pending" | "Sent" | "Failed" | "Skipped";
  error: string | null;
  attempts: number;
  lastAttemptAt: Date | null;
  nextAttemptAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserRecord = {
  _id: Types.ObjectId;
  email: string;
  role: "owner" | "pharmacist" | "inventory_manager";
  phone: string | null;
  notificationPreferences?: { email: boolean; sms: boolean } | undefined;
};

const NOW = new Date("2026-11-20T10:00:00.000Z");

function makeNotification(
  overrides: Partial<NotificationRecord> = {},
): NotificationRecord {
  return {
    _id: new Types.ObjectId(),
    title: "Alert",
    message: "Body",
    type: "InApp",
    status: "Pending",
    isCritical: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeRecipient(
  notificationId: Types.ObjectId,
  userId: Types.ObjectId,
  overrides: Partial<RecipientRecord> = {},
): RecipientRecord {
  return {
    _id: new Types.ObjectId(),
    notificationId,
    userId,
    sentAt: null,
    status: "Pending",
    error: null,
    attempts: 0,
    lastAttemptAt: null,
    nextAttemptAt: null,
    readAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeUser(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    _id: new Types.ObjectId(),
    email: "user@example.com",
    role: "pharmacist",
    phone: "+15550001111",
    notificationPreferences: { email: true, sms: true },
    ...overrides,
  };
}

function byNewest(
  a: { createdAt: Date; _id: Types.ObjectId },
  b: { createdAt: Date; _id: Types.ObjectId },
): number {
  const byDate = b.createdAt.getTime() - a.createdAt.getTime();
  if (byDate !== 0) {
    return byDate;
  }
  return b._id.toString().localeCompare(a._id.toString());
}

function sortAndPage<T extends { createdAt: Date; _id: Types.ObjectId }>(
  records: T[],
  cursor: { createdAt: Date; id: string } | null,
  limit: number,
): T[] {
  let filtered = [...records].sort(byNewest);
  if (cursor) {
    filtered = filtered.filter(
      (record) =>
        record.createdAt.getTime() < cursor.createdAt.getTime() ||
        (record.createdAt.getTime() === cursor.createdAt.getTime() &&
          record._id.toString() < cursor.id),
    );
  }
  return filtered.slice(0, limit + 1);
}

function createHarness(options: {
  notifications?: NotificationRecord[];
  recipients?: RecipientRecord[];
  users?: UserRecord[];
} = {}) {
  const notifications = options.notifications ?? [];
  const recipients = options.recipients ?? [];
  const users = options.users ?? [];

  const notificationRepo = {
    notifications,
    create: vi.fn(async (data: Partial<INotification>) => {
      const record = makeNotification({
        title: data.title ?? "",
        message: data.message ?? "",
        type: data.type ?? "InApp",
        status: data.status ?? "Pending",
        isCritical: data.isCritical ?? false,
      });
      notifications.push(record);
      return record as unknown as INotification;
    }),
    findById: vi.fn(async (id: string) => {
      const found = notifications.find(
        (notification) => notification._id.toString() === id,
      );
      return (found ?? null) as unknown as INotification | null;
    }),
    findByIds: vi.fn(async (ids: string[]) => {
      const found = notifications.filter((notification) =>
        ids.includes(notification._id.toString()),
      );
      return found as unknown as INotification[];
    }),
    findAllPaged: vi.fn(
      async (cursor: { createdAt: Date; id: string } | null, limit: number) => {
        return sortAndPage(notifications, cursor, limit) as unknown as INotification[];
      },
    ),
    update: vi.fn(async (id: string, patch: Partial<INotification>) => {
      const found = notifications.find(
        (notification) => notification._id.toString() === id,
      );
      if (!found) {
        return null;
      }
      Object.assign(found, patch);
      return found as unknown as INotification;
    }),
    delete: vi.fn(async (id: string) => {
      const index = notifications.findIndex(
        (notification) => notification._id.toString() === id,
      );
      if (index === -1) {
        return null;
      }
      const [removed] = notifications.splice(index, 1);
      return (removed ?? null) as unknown as INotification | null;
    }),
  };

  const recipientRepo = {
    recipients,
    createMany: vi.fn(
      async (data: Partial<INotificationRecipient>[]) => {
        for (const item of data) {
          recipients.push(
            makeRecipient(
              item.notificationId as Types.ObjectId,
              item.userId as Types.ObjectId,
              {
                status: item.status ?? "Pending",
                attempts: item.attempts ?? 0,
              },
            ),
          );
        }
        return recipients as unknown as INotificationRecipient[];
      },
    ),
    findByNotificationId: vi.fn(async (notificationId: string) => {
      return recipients.filter(
        (recipient) =>
          recipient.notificationId.toString() === notificationId,
      ) as unknown as INotificationRecipient[];
    }),
    findByUserIdPaged: vi.fn(
      async (
        userId: string,
        cursor: { createdAt: Date; id: string } | null,
        limit: number,
      ) => {
        const filtered = recipients.filter(
          (recipient) => recipient.userId.toString() === userId,
        );
        return sortAndPage(filtered, cursor, limit) as unknown as INotificationRecipient[];
      },
    ),
    countUnread: vi.fn(async (userId: string) => {
      return recipients.filter(
        (recipient) =>
          recipient.userId.toString() === userId && recipient.readAt === null,
      ).length;
    }),
    markRead: vi.fn(async (userId: string, notificationId: string) => {
      const found = recipients.find(
        (recipient) =>
          recipient.userId.toString() === userId &&
          recipient.notificationId.toString() === notificationId,
      );
      if (!found) {
        return null;
      }
      if (found.readAt === null) {
        found.readAt = new Date();
      }
      return found as unknown as INotificationRecipient;
    }),
    markAllRead: vi.fn(async (userId: string) => {
      let updated = 0;
      for (const recipient of recipients) {
        if (
          recipient.userId.toString() === userId &&
          recipient.readAt === null
        ) {
          recipient.readAt = new Date();
          updated += 1;
        }
      }
      return updated;
    }),
    findRetryableNotificationIds: vi.fn(
      async (now: Date, staleBefore: Date, maxAttempts: number) => {
        const ids = recipients
          .filter((recipient) => {
            const attempts = recipient.attempts ?? 0;
            if (attempts >= maxAttempts) {
              return false;
            }
            if (recipient.status === "Failed") {
              return (
                recipient.nextAttemptAt !== null &&
                recipient.nextAttemptAt.getTime() <= now.getTime()
              );
            }
            if (recipient.status === "Pending") {
              return (
                recipient.lastAttemptAt === null ||
                recipient.lastAttemptAt.getTime() <= staleBefore.getTime()
              );
            }
            return false;
          })
          .map((recipient) => recipient.notificationId.toString());
        return [...new Set(ids)];
      },
    ),
    claimForDispatch: vi.fn(
      async (
        id: string,
        expectedStatus: string,
        expectedAttempts: number,
        expectedLastAttemptAt: Date | null,
        claimedAt: Date,
      ) => {
        const found = recipients.find(
          (recipient) => recipient._id.toString() === id,
        );
        const currentLastAttempt = found?.lastAttemptAt ?? null;
        const expected = expectedLastAttemptAt ?? null;
        const sameLastAttempt =
          currentLastAttempt === null
            ? expected === null
            : expected !== null &&
              currentLastAttempt.getTime() === expected.getTime();

        if (
          !found ||
          found.status !== expectedStatus ||
          (found.attempts ?? 0) !== expectedAttempts ||
          !sameLastAttempt
        ) {
          return null;
        }
        found.lastAttemptAt = claimedAt;
        return found as unknown as INotificationRecipient;
      },
    ),
    update: vi.fn(
      async (id: string, patch: Partial<INotificationRecipient>) => {
        const found = recipients.find(
          (recipient) => recipient._id.toString() === id,
        );
        if (!found) {
          return null;
        }
        Object.assign(found, patch);
        return found as unknown as INotificationRecipient;
      },
    ),
    delete: vi.fn(async (id: string) => {
      const index = recipients.findIndex(
        (recipient) => recipient._id.toString() === id,
      );
      if (index === -1) {
        return null;
      }
      const [removed] = recipients.splice(index, 1);
      return (removed ?? null) as unknown as INotificationRecipient | null;
    }),
    deleteByNotificationId: vi.fn(async (notificationId: string) => {
      const before = recipients.length;
      const remaining = recipients.filter(
        (recipient) =>
          recipient.notificationId.toString() !== notificationId,
      );
      recipients.splice(0, recipients.length, ...remaining);
      return before - remaining.length;
    }),
    countByStatus: vi.fn(async (status: string) => {
      return recipients.filter((recipient) => recipient.status === status)
        .length;
    }),
  };

  const userRepo = {
    users,
    findById: vi.fn(async (id: string) => {
      return (users.find((user) => user._id.toString() === id) ??
        null) as unknown as UserRecord | null;
    }),
    findByIds: vi.fn(async (ids: string[]) => {
      return users.filter((user) =>
        ids.includes(user._id.toString()),
      ) as unknown as UserRecord[];
    }),
    getNotificationPreferences: vi.fn(async (id: string) => {
      const user = users.find((item) => item._id.toString() === id);
      if (!user) {
        return null;
      }
      return {
        email: user.notificationPreferences?.email ?? true,
        sms: user.notificationPreferences?.sms ?? true,
      };
    }),
    updateNotificationPreferences: vi.fn(
      async (
        id: string,
        patch: { email?: boolean | undefined; sms?: boolean | undefined },
      ) => {
        const user = users.find((item) => item._id.toString() === id);
        if (!user) {
          return null;
        }
        user.notificationPreferences = {
          email: patch.email ?? user.notificationPreferences?.email ?? true,
          sms: patch.sms ?? user.notificationPreferences?.sms ?? true,
        };
        return user.notificationPreferences;
      },
    ),
  };

  const connection = {
    startSession: vi.fn(async () => ({
      withTransaction: async <T>(callback: () => Promise<T>): Promise<T> =>
        callback(),
      endSession: async () => undefined,
    })),
  };

  const service = new NotificationService(
    notificationRepo as unknown as NotificationRepo,
    recipientRepo as unknown as NotificationRecipientRepo,
    userRepo as unknown as UserRepository,
    AppError,
    connection as unknown as mongoose.Connection,
  );

  return {
    service,
    notifications,
    recipients,
    users,
    notificationRepo,
    recipientRepo,
    userRepo,
  };
}

describe("NotificationService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
    delete process.env.SMS_WEBHOOK_URL;
    delete process.env.SMS_API_KEY;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete process.env.SMS_WEBHOOK_URL;
    delete process.env.SMS_API_KEY;
  });

  describe("createNotification", () => {
    it("rejects an empty recipient list", async () => {
      const { service } = createHarness();

      await expect(
        service.createNotification({
          title: "Title",
          message: "Message",
          type: "InApp",
          userIds: [],
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "At least one recipient is required",
      });
    });

    it("deduplicates recipients and creates Pending rows", async () => {
      const user = makeUser();
      const harness = createHarness({ users: [user] });
      const dispatch = vi
        .spyOn(harness.service, "dispatch")
        .mockResolvedValue({} as NotificationView);

      const notification = await harness.service.createNotification({
        title: "Title",
        message: "Message",
        type: "InApp",
        userIds: [user._id.toString(), user._id.toString()],
      });

      expect(harness.recipients).toHaveLength(1);
      expect(harness.recipients[0]?.status).toBe("Pending");
      expect(harness.recipients[0]?.attempts).toBe(0);
      expect(dispatch).toHaveBeenCalledWith(notification._id.toString());
    });

    it("rejects an unknown recipient", async () => {
      const harness = createHarness();

      await expect(
        harness.service.createNotification({
          title: "Title",
          message: "Message",
          type: "InApp",
          userIds: [new Types.ObjectId().toString()],
        }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("rejects more than the recipient cap", async () => {
      const harness = createHarness();
      const userIds = Array.from(
        { length: MAX_NOTIFICATION_RECIPIENTS + 1 },
        () => new Types.ObjectId().toString(),
      );

      await expect(
        harness.service.createNotification({
          title: "Title",
          message: "Message",
          type: "InApp",
          userIds,
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: `At most ${MAX_NOTIFICATION_RECIPIENTS} recipients are allowed`,
      });
    });

    it("persists the internal critical flag without exposing it", async () => {
      const user = makeUser();
      const harness = createHarness({ users: [user] });
      vi.spyOn(harness.service, "dispatch").mockResolvedValue(
        {} as NotificationView,
      );

      const notification = await harness.service.createNotification({
        title: "Title",
        message: "Message",
        type: "InApp",
        userIds: [user._id.toString()],
        critical: true,
      });

      expect(notification).not.toHaveProperty("isCritical");
      expect(notification).not.toHaveProperty("__v");
      expect(harness.notifications[0]?.isCritical).toBe(true);
    });

    it("deduplicates case-variant ObjectIds", async () => {
      const user = makeUser();
      const harness = createHarness({ users: [user] });
      vi.spyOn(harness.service, "dispatch").mockResolvedValue(
        {} as NotificationView,
      );

      const lower = user._id.toString();
      const upper = lower.toUpperCase();

      await harness.service.createNotification({
        title: "Title",
        message: "Message",
        type: "InApp",
        userIds: [lower, upper],
      });

      expect(harness.recipients).toHaveLength(1);
      expect(harness.recipients[0]?.userId.toString()).toBe(lower);
    });

    it("resolves recipients with one bulk user lookup", async () => {
      const users = [makeUser(), makeUser()];
      const harness = createHarness({ users });
      vi.spyOn(harness.service, "dispatch").mockResolvedValue(
        {} as NotificationView,
      );
      const userIds = users.map((user) => user._id.toString());

      await harness.service.createNotification({
        title: "Title",
        message: "Message",
        type: "InApp",
        userIds,
      });

      expect(harness.userRepo.findByIds).toHaveBeenCalledTimes(1);
      expect(harness.userRepo.findByIds).toHaveBeenCalledWith(userIds);
      expect(harness.userRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe("dispatch", () => {
    it("delivers InApp notifications even when the user is offline", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "InApp" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(push).mockReturnValue(false);

      const result = await harness.service.dispatch(
        notification._id.toString(),
      );

      expect(push).toHaveBeenCalledWith(user._id.toString(), {
        title: "Alert",
        message: "Body",
      });
      expect(recipient.status).toBe("Sent");
      expect(recipient.sentAt).toEqual(NOW);
      expect(result?.status).toBe("Sent");
      expect(result).not.toHaveProperty("isCritical");
      expect(result).not.toHaveProperty("__v");
    });

    it("marks email delivery Sent on success", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(sendEmail).mockResolvedValue(undefined as never);

      await harness.service.dispatch(notification._id.toString());

      expect(sendEmail).toHaveBeenCalledWith({
        to: user.email,
        subject: "Alert",
        text: "Body",
      });
      expect(recipient.status).toBe("Sent");
      expect(recipient.attempts).toBe(1);
    });

    it("stores a truncated error and schedules the first retry", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(sendEmail).mockRejectedValue(new Error("x".repeat(1500)));

      const result = await harness.service.dispatch(
        notification._id.toString(),
      );

      expect(recipient.status).toBe("Failed");
      expect(recipient.attempts).toBe(1);
      expect(recipient.error).toHaveLength(MAX_ERROR_LENGTH);
      expect(recipient.nextAttemptAt).toEqual(
        new Date(NOW.getTime() + RETRY_DELAYS_MS[0]),
      );
      expect(result?.status).toBe("Pending");
    });

    it("marks SMS Sent on a 2xx webhook response", async () => {
      process.env.SMS_WEBHOOK_URL = "https://sms.example.test/send";
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", fetchMock);
      const user = makeUser();
      const notification = makeNotification({ type: "SMS" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(fetchMock).toHaveBeenCalledWith(
        "https://sms.example.test/send",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ to: user.phone, message: "Body" }),
        }),
      );
      expect(recipient.status).toBe("Sent");
    });

    it("marks SMS Failed on a non-2xx webhook response", async () => {
      process.env.SMS_WEBHOOK_URL = "https://sms.example.test/send";
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: async () => "provider down",
      });
      vi.stubGlobal("fetch", fetchMock);
      const user = makeUser();
      const notification = makeNotification({ type: "SMS" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(recipient.status).toBe("Failed");
      expect(recipient.error).toContain("502");
      expect(recipient.error).toContain("provider down");
      expect(recipient.nextAttemptAt).not.toBeNull();
    });

    it("marks SMS Failed without retry when the webhook is missing", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "SMS" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(recipient.status).toBe("Failed");
      expect(recipient.error).toBe("SMS_WEBHOOK_URL is not configured");
      expect(recipient.nextAttemptAt).toBeNull();
      expect(recipient.attempts).toBe(1);
    });

    it("marks SMS Failed without retry when the user has no phone", async () => {
      process.env.SMS_WEBHOOK_URL = "https://sms.example.test/send";
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const user = makeUser({ phone: null });
      const notification = makeNotification({ type: "SMS" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(recipient.status).toBe("Failed");
      expect(recipient.error).toBe("Recipient has no phone number");
      expect(recipient.nextAttemptAt).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("treats a network failure as retryable", async () => {
      process.env.SMS_WEBHOOK_URL = "https://sms.example.test/send";
      const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
      vi.stubGlobal("fetch", fetchMock);
      const user = makeUser();
      const notification = makeNotification({ type: "SMS" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(recipient.status).toBe("Failed");
      expect(recipient.error).toContain("ECONNREFUSED");
      expect(recipient.nextAttemptAt).not.toBeNull();
    });

    it("skips a recipient already claimed by another dispatcher", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      harness.recipientRepo.claimForDispatch.mockResolvedValueOnce(null);
      vi.mocked(sendEmail).mockResolvedValue(undefined as never);

      await harness.service.dispatch(notification._id.toString());

      expect(sendEmail).not.toHaveBeenCalled();
      expect(recipient.status).toBe("Pending");
      expect(recipient.attempts).toBe(0);
    });

    it("throws 404 when the parent notification disappears mid-dispatch", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(sendEmail).mockResolvedValue(undefined as never);
      harness.notificationRepo.update.mockImplementationOnce(async () => {
        harness.notifications.splice(0, harness.notifications.length);
        return null;
      });

      await expect(
        harness.service.dispatch(notification._id.toString()),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Notification not found",
      });
    });
  });

  describe("retry scheduling", () => {
    it("matches delay boundaries", () => {
      expect(nextRetryDelayMs(1)).toBe(60_000);
      expect(nextRetryDelayMs(2)).toBe(300_000);
      expect(nextRetryDelayMs(3)).toBeNull();
      expect(nextRetryDelayMs(4)).toBeNull();
    });

    it("does not schedule retries for permanent SMTP failures", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(sendEmail).mockRejectedValue(
        Object.assign(new Error("550 mailbox unavailable"), {
          responseCode: 550,
        }),
      );

      await harness.service.dispatch(notification._id.toString());

      expect(recipient.status).toBe("Failed");
      expect(recipient.nextAttemptAt).toBeNull();
      expect(notification.status).toBe("Failed");
    });

    it("schedules +1m, then +5m, then becomes terminal", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(sendEmail).mockRejectedValue(new Error("smtp down"));

      await harness.service.dispatch(notification._id.toString());
      expect(recipient.attempts).toBe(1);
      expect(recipient.nextAttemptAt).toEqual(
        new Date(NOW.getTime() + RETRY_DELAYS_MS[0]),
      );

      await harness.service.dispatch(notification._id.toString(), {
        force: true,
      });
      expect(recipient.attempts).toBe(2);
      expect(recipient.nextAttemptAt).toEqual(
        new Date(NOW.getTime() + RETRY_DELAYS_MS[1]),
      );

      await harness.service.dispatch(notification._id.toString(), {
        force: true,
      });
      expect(recipient.attempts).toBe(3);
      expect(recipient.nextAttemptAt).toBeNull();
      expect(recipient.status).toBe("Failed");
      expect(notification.status).toBe("Failed");
    });

    it("ignores failed rows before nextAttemptAt unless forced", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id, {
        status: "Failed",
        attempts: 1,
        nextAttemptAt: new Date(NOW.getTime() + 60_000),
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(sendEmail).mockResolvedValue(undefined as never);

      await harness.service.dispatch(notification._id.toString(), {
        force: false,
      });
      expect(sendEmail).not.toHaveBeenCalled();
      expect(recipient.status).toBe("Failed");
      expect(notification.status).toBe("Pending");

      await harness.service.dispatch(notification._id.toString(), {
        force: true,
      });
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(recipient.status).toBe("Sent");
    });

    it("retries a failed row once nextAttemptAt has passed", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id, {
        status: "Failed",
        attempts: 1,
        nextAttemptAt: new Date(NOW.getTime() - 1),
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(sendEmail).mockResolvedValue(undefined as never);

      await harness.service.dispatch(notification._id.toString());

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(recipient.status).toBe("Sent");
    });

    it("never retries Skipped rows, even when forced", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id, {
        status: "Skipped",
        error: "Recipient opted out",
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString(), {
        force: true,
      });

      expect(sendEmail).not.toHaveBeenCalled();
      expect(recipient.status).toBe("Skipped");
    });

    it("sweeps never-attempted Pending rows", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(sendEmail).mockResolvedValue(undefined as never);

      const result = await harness.service.retryScheduled();

      expect(result).toEqual({ attempted: 1 });
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(recipient.status).toBe("Sent");
    });

    it("recovers an abandoned in-flight claim after the stale window", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const abandoned = makeRecipient(notification._id, user._id, {
        lastAttemptAt: new Date(NOW.getTime() - 16 * 60_000),
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [abandoned],
        users: [user],
      });
      vi.mocked(sendEmail).mockResolvedValue(undefined as never);

      const result = await harness.service.retryScheduled();

      expect(result).toEqual({ attempted: 1 });
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(abandoned.status).toBe("Sent");
      expect(abandoned.lastAttemptAt).toEqual(NOW);
    });

    it("ignores a Pending row claimed inside the stale window", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const inFlight = makeRecipient(notification._id, user._id, {
        lastAttemptAt: new Date(NOW.getTime() - 60_000),
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [inFlight],
        users: [user],
      });

      const result = await harness.service.retryScheduled();

      expect(result).toEqual({ attempted: 0 });
      expect(sendEmail).not.toHaveBeenCalled();
      expect(inFlight.status).toBe("Pending");
    });

    it("does not sweep Failed rows that exhausted their attempts", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const exhausted = makeRecipient(notification._id, user._id, {
        status: "Failed",
        attempts: 3,
        nextAttemptAt: new Date(NOW.getTime() - 1),
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [exhausted],
        users: [user],
      });

      const result = await harness.service.retryScheduled();

      expect(result).toEqual({ attempted: 0 });
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("sweeps scheduled notifications and isolates per-notification errors", async () => {
      const harness = createHarness();
      harness.recipientRepo.findRetryableNotificationIds.mockResolvedValue([
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
      ]);
      const dispatch = vi
        .spyOn(harness.service, "dispatch")
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce({} as NotificationView);
      const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await harness.service.retryScheduled();

      expect(result).toEqual({ attempted: 2 });
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(errorLog).toHaveBeenCalled();
    });
  });

  describe("parent status", () => {
    it("is Sent when any recipient succeeded", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const sent = makeRecipient(notification._id, user._id, {
        status: "Sent",
        sentAt: NOW,
        attempts: 1,
      });
      const failed = makeRecipient(notification._id, user._id, {
        status: "Failed",
        attempts: 1,
        nextAttemptAt: new Date(NOW.getTime() + 60_000),
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [sent, failed],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(notification.status).toBe("Sent");
    });

    it("is Failed when every recipient is terminal non-success", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const skipped = makeRecipient(notification._id, user._id, {
        status: "Skipped",
      });
      const failed = makeRecipient(notification._id, user._id, {
        status: "Failed",
        attempts: 3,
        nextAttemptAt: null,
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [skipped, failed],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(notification.status).toBe("Failed");
    });

    it("is Pending while a failed recipient still has a scheduled retry", async () => {
      const user = makeUser();
      const notification = makeNotification({ type: "Email" });
      const failed = makeRecipient(notification._id, user._id, {
        status: "Failed",
        attempts: 1,
        nextAttemptAt: new Date(NOW.getTime() + 60_000),
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [failed],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(notification.status).toBe("Pending");
    });
  });

  describe("preferences", () => {
    it("skips an opted-out email recipient without calling the provider", async () => {
      const user = makeUser({
        notificationPreferences: { email: false, sms: true },
      });
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(sendEmail).not.toHaveBeenCalled();
      expect(recipient.status).toBe("Skipped");
      expect(recipient.error).toBe("Recipient opted out");
      expect(recipient.nextAttemptAt).toBeNull();
    });

    it("skips an opted-out SMS recipient", async () => {
      process.env.SMS_WEBHOOK_URL = "https://sms.example.test/send";
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const user = makeUser({
        notificationPreferences: { email: true, sms: false },
      });
      const notification = makeNotification({ type: "SMS" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(fetchMock).not.toHaveBeenCalled();
      expect(recipient.status).toBe("Skipped");
    });

    it("delivers to a legacy user without notificationPreferences", async () => {
      const user = makeUser({ notificationPreferences: undefined });
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(sendEmail).mockResolvedValue(undefined as never);

      await harness.service.dispatch(notification._id.toString());

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(recipient.status).toBe("Sent");
    });

    it("lets critical notifications bypass opt-out", async () => {
      const user = makeUser({
        notificationPreferences: { email: false, sms: false },
      });
      const notification = makeNotification({
        type: "Email",
        isCritical: true,
      });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });
      vi.mocked(sendEmail).mockResolvedValue(undefined as never);

      await harness.service.dispatch(notification._id.toString());

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(recipient.status).toBe("Sent");
    });

    it("always delivers InApp notifications", async () => {
      const user = makeUser({
        notificationPreferences: { email: false, sms: false },
      });
      const notification = makeNotification({ type: "InApp" });
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      await harness.service.dispatch(notification._id.toString());

      expect(push).toHaveBeenCalledTimes(1);
      expect(recipient.status).toBe("Sent");
    });
  });

  describe("read state", () => {
    it("marks only the matching user's recipient row read", async () => {
      const userA = makeUser();
      const userB = makeUser();
      const notification = makeNotification();
      const recipientA = makeRecipient(notification._id, userA._id);
      const recipientB = makeRecipient(notification._id, userB._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipientA, recipientB],
        users: [userA, userB],
      });

      const result = await harness.service.markRead(
        userA._id.toString(),
        notification._id.toString(),
      );

      expect(result.readAt).toEqual(new Date());
      expect(recipientA.readAt).toEqual(new Date());
      expect(recipientB.readAt).toBeNull();
    });

    it("returns 404 when the recipient row does not exist", async () => {
      const harness = createHarness();

      await expect(
        harness.service.markRead(
          new Types.ObjectId().toString(),
          new Types.ObjectId().toString(),
        ),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("marks all of the user's unread rows", async () => {
      const userA = makeUser();
      const userB = makeUser();
      const notification = makeNotification();
      const recipientA = makeRecipient(notification._id, userA._id);
      const recipientARead = makeRecipient(notification._id, userA._id, {
        readAt: new Date(NOW.getTime() - 1),
      });
      const recipientB = makeRecipient(notification._id, userB._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipientA, recipientARead, recipientB],
        users: [userA, userB],
      });

      const result = await harness.service.markAllRead(userA._id.toString());

      expect(result).toEqual({ updated: 1 });
      expect(recipientA.readAt).not.toBeNull();
      expect(recipientB.readAt).toBeNull();
    });

    it("preserves readAt on repeated mark-read calls", async () => {
      const user = makeUser();
      const notification = makeNotification();
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      const first = await harness.service.markRead(
        user._id.toString(),
        notification._id.toString(),
      );
      const firstReadAt = first.readAt;

      vi.setSystemTime(new Date(NOW.getTime() + 1_000));
      const second = await harness.service.markRead(
        user._id.toString(),
        notification._id.toString(),
      );

      expect(second.readAt).toEqual(firstReadAt);
    });

    it("includes readAt and unreadCount in the inbox", async () => {
      const user = makeUser();
      const readNotification = makeNotification({
        createdAt: new Date(NOW.getTime() - 1000),
      });
      const unreadNotification = makeNotification({ createdAt: NOW });
      const readRow = makeRecipient(readNotification._id, user._id, {
        readAt: new Date(NOW.getTime() - 1),
      });
      const unreadRow = makeRecipient(unreadNotification._id, user._id);
      const harness = createHarness({
        notifications: [readNotification, unreadNotification],
        recipients: [readRow, unreadRow],
        users: [user],
      });

      const page = await harness.service.getForUser(
        user._id.toString(),
        { userId: user._id.toString(), role: "pharmacist" },
        { limit: 20 },
      );

      expect(page.unreadCount).toBe(1);
      expect(page.items).toHaveLength(2);
      expect(page.items.map((item) => item.readAt)).toEqual([
        null,
        new Date(NOW.getTime() - 1),
      ]);
    });
  });

  describe("pagination", () => {
    it("round-trips the cursor and rejects malformed values", () => {
      const id = new Types.ObjectId().toString();
      const cursor = encodeCursor(NOW, id);

      expect(decodeCursor(cursor)).toEqual({ createdAt: NOW, id });
      expect(() => decodeCursor("not-a-cursor")).toThrowError(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it("falls back to the ObjectId timestamp when createdAt is missing", () => {
      const id = new Types.ObjectId().toString();
      const cursor = encodeCursor(undefined, id);

      expect(decodeCursor(cursor)).toEqual({
        createdAt: new Types.ObjectId(id).getTimestamp(),
        id,
      });
    });

    it("returns a page and nextCursor from the last returned notification", async () => {
      const first = makeNotification({
        createdAt: new Date(NOW.getTime() - 1000),
      });
      const second = makeNotification({ createdAt: NOW });
      const third = makeNotification({
        createdAt: new Date(NOW.getTime() - 2000),
      });
      const harness = createHarness({
        notifications: [first, second, third],
      });

      const page = await harness.service.getAll({ limit: 2 });

      expect(page.items).toHaveLength(2);
      expect(page.items[0]?._id.toString()).toBe(second._id.toString());
      expect(page.items[1]?._id.toString()).toBe(first._id.toString());
      expect(page.nextCursor).toBe(
        encodeCursor(first.createdAt, first._id.toString()),
      );
    });

    it("uses the last recipient row for the inbox cursor even if its parent is gone", async () => {
      const user = makeUser();
      const existing = makeNotification();
      const missingParent = new Types.ObjectId();
      const newer = makeRecipient(existing._id, user._id, {
        createdAt: NOW,
      });
      const older = makeRecipient(missingParent, user._id, {
        createdAt: new Date(NOW.getTime() - 1000),
      });
      const harness = createHarness({
        notifications: [existing],
        recipients: [newer, older],
        users: [user],
      });

      const page = await harness.service.getForUser(
        user._id.toString(),
        { userId: user._id.toString(), role: "pharmacist" },
        { limit: 1 },
      );

      expect(page.items).toHaveLength(1);
      expect(page.items[0]?._id.toString()).toBe(existing._id.toString());
      expect(page.nextCursor).toBe(
        encodeCursor(newer.createdAt, newer._id.toString()),
      );
    });

    it("filters deleted parent notifications while preserving recipient order", async () => {
      const user = makeUser();
      const notification = makeNotification();
      const first = makeRecipient(new Types.ObjectId(), user._id, {
        createdAt: NOW,
      });
      const second = makeRecipient(notification._id, user._id, {
        createdAt: new Date(NOW.getTime() - 1000),
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [first, second],
        users: [user],
      });

      const page = await harness.service.getForUser(
        user._id.toString(),
        { userId: user._id.toString(), role: "pharmacist" },
        { limit: 20 },
      );

      expect(page.items).toHaveLength(1);
      expect(page.items[0]?._id.toString()).toBe(notification._id.toString());
    });
  });

  describe("delete", () => {
    it("deletes recipient rows in one call and the parent in a transaction", async () => {
      const user = makeUser();
      const notification = makeNotification();
      const recipient = makeRecipient(notification._id, user._id);
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [user],
      });

      await harness.service.delete(notification._id.toString());

      expect(harness.recipientRepo.deleteByNotificationId).toHaveBeenCalledWith(
        notification._id.toString(),
        expect.anything(),
      );
      expect(harness.notificationRepo.delete).toHaveBeenCalledWith(
        notification._id.toString(),
        expect.anything(),
      );
      expect(harness.recipients).toHaveLength(0);
      expect(harness.notifications).toHaveLength(0);
    });
  });

  describe("authorization", () => {
    it("allows a user to read their own inbox", async () => {
      const user = makeUser({ role: "inventory_manager" });
      const harness = createHarness({ users: [user] });

      const page = await harness.service.getForUser(
        user._id.toString(),
        { userId: user._id.toString(), role: "inventory_manager" },
        { limit: 20 },
      );

      expect(page.items).toEqual([]);
    });

    it("allows a peer with an equal role to read the inbox", async () => {
      const viewer = makeUser({ role: "pharmacist" });
      const target = makeUser({ role: "pharmacist" });
      const harness = createHarness({ users: [viewer, target] });

      await expect(
        harness.service.getForUser(
          target._id.toString(),
          { userId: viewer._id.toString(), role: "pharmacist" },
          { limit: 20 },
        ),
      ).resolves.toMatchObject({ items: [], unreadCount: 0 });
    });

    it("rejects a lower role reading a higher role's inbox", async () => {
      const viewer = makeUser({ role: "inventory_manager" });
      const target = makeUser({ role: "pharmacist" });
      const harness = createHarness({ users: [viewer, target] });

      await expect(
        harness.service.getForUser(
          target._id.toString(),
          { userId: viewer._id.toString(), role: "inventory_manager" },
          { limit: 20 },
        ),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("rejects an unknown viewer role", async () => {
      const viewer = makeUser({ role: "pharmacist" });
      const target = makeUser({ role: "pharmacist" });
      const harness = createHarness({ users: [viewer, target] });

      await expect(
        harness.service.getForUser(
          target._id.toString(),
          {
            userId: viewer._id.toString(),
            role: "doctor" as "pharmacist",
          },
          { limit: 20 },
        ),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("returns 404 when the target inbox user does not exist", async () => {
      const viewer = makeUser({ role: "owner" });
      const harness = createHarness({ users: [viewer] });

      await expect(
        harness.service.getForUser(
          new Types.ObjectId().toString(),
          { userId: viewer._id.toString(), role: "owner" },
          { limit: 20 },
        ),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("lets an owner override preferences but not a pharmacist", async () => {
      const owner = makeUser({ role: "owner" });
      const pharmacist = makeUser({ role: "pharmacist" });
      const target = makeUser({ role: "inventory_manager" });
      const harness = createHarness({ users: [owner, pharmacist, target] });

      await expect(
        harness.service.updatePreferences(
          target._id.toString(),
          { userId: owner._id.toString(), role: "owner" },
          { email: false },
        ),
      ).resolves.toEqual({ email: false, sms: true });

      await expect(
        harness.service.updatePreferences(
          target._id.toString(),
          { userId: pharmacist._id.toString(), role: "pharmacist" },
          { sms: false },
        ),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("rejects an inventory manager reading notification detail", async () => {
      const manager = makeUser({ role: "inventory_manager" });
      const notification = makeNotification();
      const harness = createHarness({
        notifications: [notification],
        users: [manager],
      });

      await expect(
        harness.service.getById(notification._id.toString(), {
          userId: manager._id.toString(),
          role: "inventory_manager",
        }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("hides delivery error details from non-owners", async () => {
      const owner = makeUser({ role: "owner" });
      const pharmacist = makeUser({ role: "pharmacist" });
      const notification = makeNotification({ type: "Email" });
      const recipient = makeRecipient(notification._id, pharmacist._id, {
        status: "Failed",
        error: "smtp down",
        attempts: 2,
        lastAttemptAt: NOW,
        nextAttemptAt: new Date(NOW.getTime() + 60_000),
      });
      const harness = createHarness({
        notifications: [notification],
        recipients: [recipient],
        users: [owner, pharmacist],
      });

      const ownerView = await harness.service.getById(
        notification._id.toString(),
        { userId: owner._id.toString(), role: "owner" },
      );
      const pharmacistView = await harness.service.getById(
        notification._id.toString(),
        { userId: pharmacist._id.toString(), role: "pharmacist" },
      );

      expect(ownerView.recipients[0]).toMatchObject({
        error: "smtp down",
        attempts: 2,
      });
      expect(pharmacistView.recipients[0]).not.toHaveProperty("error");
      expect(pharmacistView.recipients[0]).not.toHaveProperty("attempts");
    });
  });
});
