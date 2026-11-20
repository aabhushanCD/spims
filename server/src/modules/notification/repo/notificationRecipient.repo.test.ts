import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import { NotificationRecipientRepo } from "./notificationRecipient.repo.ts";

const USER_ID = "507f1f77bcf86cd799439011";
const NOTIFICATION_ID = "507f1f77bcf86cd799439021";
const RECIPIENT_ID = "507f1f77bcf86cd799439031";

function buildRepo() {
  const model = {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
    distinct: vi.fn(),
    aggregate: vi.fn(),
    deleteMany: vi.fn(),
  };

  return {
    repo: new NotificationRecipientRepo(model as never),
    model,
  };
}

describe("NotificationRecipientRepo", () => {
  it("finds due failed retries and abandoned in-flight rows", async () => {
    const { repo, model } = buildRepo();
    const now = new Date("2026-11-20T10:00:00.000Z");
    const staleBefore = new Date("2026-11-20T09:45:00.000Z");
    const ids = [new Types.ObjectId(), new Types.ObjectId()];
    const exec = vi.fn().mockResolvedValue(ids);
    model.distinct.mockReturnValue({ exec });

    const result = await repo.findRetryableNotificationIds(
      now,
      staleBefore,
      3,
    );

    expect(model.distinct).toHaveBeenCalledWith("notificationId", {
      $or: [
        {
          status: "Failed",
          attempts: { $lt: 3 },
          nextAttemptAt: { $ne: null, $lte: now },
        },
        {
          status: "Pending",
          attempts: { $lt: 3 },
          $or: [
            { lastAttemptAt: null },
            { lastAttemptAt: { $lte: staleBefore } },
          ],
        },
      ],
    });
    expect(result).toEqual(ids.map((id) => String(id)));
  });

  it("claims a row using status, attempts, and lastAttemptAt as a compare-and-swap", async () => {
    const { repo, model } = buildRepo();
    const claimedAt = new Date("2026-11-20T10:00:00.000Z");
    const previousAttempt = new Date("2026-11-20T09:00:00.000Z");
    const claimed = { _id: new Types.ObjectId(RECIPIENT_ID) };
    const exec = vi.fn().mockResolvedValue(claimed);
    model.findOneAndUpdate.mockReturnValue({ lean: () => ({ exec }) });

    const result = await repo.claimForDispatch(
      RECIPIENT_ID,
      "Failed",
      1,
      previousAttempt,
      claimedAt,
    );

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: RECIPIENT_ID,
        status: "Failed",
        attempts: 1,
        lastAttemptAt: previousAttempt,
      },
      { $set: { lastAttemptAt: claimedAt } },
      { new: true },
    );
    expect(result).toBe(claimed);
  });

  it("returns null when another dispatcher already claimed the row", async () => {
    const { repo, model } = buildRepo();
    const exec = vi.fn().mockResolvedValue(null);
    model.findOneAndUpdate.mockReturnValue({ lean: () => ({ exec }) });

    const result = await repo.claimForDispatch(
      RECIPIENT_ID,
      "Pending",
      0,
      null,
      new Date("2026-11-20T10:00:00.000Z"),
    );

    expect(result).toBeNull();
  });

  it("counts only unread rows whose parent notification exists", async () => {
    const { repo, model } = buildRepo();
    const exec = vi.fn().mockResolvedValue([{ count: 3 }]);
    model.aggregate.mockReturnValue({ exec });

    const count = await repo.countUnread(USER_ID);

    expect(count).toBe(3);
    const pipeline = model.aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    const match = pipeline[0]?.$match as {
      userId: Types.ObjectId;
      readAt: null;
    };
    expect(match.userId.toString()).toBe(USER_ID);
    expect(match.readAt).toBeNull();
    expect(pipeline[1]?.$lookup).toMatchObject({
      from: "notifications",
      localField: "notificationId",
      foreignField: "_id",
      as: "notification",
    });
    expect(pipeline[2]?.$match).toEqual({ notification: { $ne: [] } });
    expect(pipeline[3]?.$count).toBe("count");
  });

  it("does not rewrite readAt when the row is already read", async () => {
    const { repo, model } = buildRepo();
    const existing = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(USER_ID),
      notificationId: new Types.ObjectId(NOTIFICATION_ID),
      readAt: new Date("2026-11-20T09:00:00.000Z"),
    };
    const updateExec = vi.fn().mockResolvedValue(null);
    model.findOneAndUpdate.mockReturnValue({
      lean: () => ({ exec: updateExec }),
    });
    const findExec = vi.fn().mockResolvedValue(existing);
    model.findOne.mockReturnValue({
      lean: () => ({ exec: findExec }),
    });

    const result = await repo.markRead(USER_ID, NOTIFICATION_ID);

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: USER_ID, notificationId: NOTIFICATION_ID, readAt: null },
      { $set: { readAt: expect.any(Date) } },
      { new: true },
    );
    expect(model.findOne).toHaveBeenCalledWith({
      userId: USER_ID,
      notificationId: NOTIFICATION_ID,
    });
    expect(result).toBe(existing);
  });

  it("deletes recipients for a notification in one call", async () => {
    const { repo, model } = buildRepo();
    const session = { id: "session-1" };
    const exec = vi.fn().mockResolvedValue({ deletedCount: 2 });
    const sessionFn = vi.fn();
    const query = { session: sessionFn, exec };
    sessionFn.mockReturnValue(query);
    model.deleteMany.mockReturnValue(query);

    const deleted = await repo.deleteByNotificationId(
      NOTIFICATION_ID,
      session as never,
    );

    expect(model.deleteMany).toHaveBeenCalledWith({
      notificationId: NOTIFICATION_ID,
    });
    expect(sessionFn).toHaveBeenCalledWith(session);
    expect(deleted).toBe(2);
  });
});
