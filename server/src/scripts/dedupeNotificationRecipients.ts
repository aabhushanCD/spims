/**
 * One-off cleanup for legacy notification recipient duplicates.
 *
 * `{ notificationId, userId }` is now unique; deployments that predate the
 * constraint (or predate the in-service dedupe) can contain duplicates, and
 * creating the unique index would fail. This script keeps one row per pair,
 * merging delivery/read state, then optionally syncs indexes.
 *
 * Usage:
 *   npm run notification:dedupe -- --dry-run
 *   npm run notification:dedupe
 *   npm run notification:dedupe -- --sync-indexes
 */
import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";

import { connectDB } from "../config/db.config.ts";
import NotificationRecipientModel from "../modules/notification/model/notificationRecipient.model.ts";
import type { NotificationRecipientStatus } from "../modules/notification/model/notificationRecipient.model.ts";

interface RecipientRow {
  _id: Types.ObjectId;
  status: NotificationRecipientStatus;
  sentAt: Date | null;
  readAt: Date | null;
  attempts: number;
  error: string | null;
  lastAttemptAt: Date | null;
  nextAttemptAt: Date | null;
  createdAt?: Date;
}

interface DuplicateGroup {
  _id: { notificationId: Types.ObjectId; userId: Types.ObjectId };
  count: number;
  rows: RecipientRow[];
}

const STATUS_RANK: Record<NotificationRecipientStatus, number> = {
  Sent: 4,
  Skipped: 3,
  Failed: 2,
  Pending: 1,
};

const dryRun = process.argv.includes("--dry-run");
const syncIndexes = process.argv.includes("--sync-indexes");

function pickWinner(rows: RecipientRow[]): RecipientRow {
  return [...rows].sort((left, right) => {
    const byStatus = STATUS_RANK[right.status] - STATUS_RANK[left.status];
    if (byStatus !== 0) {
      return byStatus;
    }
    const byAttempts = (right.attempts ?? 0) - (left.attempts ?? 0);
    if (byAttempts !== 0) {
      return byAttempts;
    }
    return right._id.toString().localeCompare(left._id.toString());
  })[0]!;
}

function earliest(readAts: (Date | null | undefined)[]): Date | null {
  const present = readAts.filter((value): value is Date => value != null);
  if (present.length === 0) {
    return null;
  }
  return new Date(Math.min(...present.map((value) => value.getTime())));
}

function latest(readAts: (Date | null | undefined)[]): Date | null {
  const present = readAts.filter((value): value is Date => value != null);
  if (present.length === 0) {
    return null;
  }
  return new Date(Math.max(...present.map((value) => value.getTime())));
}

function merge(rows: RecipientRow[]): Partial<RecipientRow> {
  const winner = pickWinner(rows);
  const status =
    rows.reduce<NotificationRecipientStatus>(
      (best, row) =>
        STATUS_RANK[row.status] > STATUS_RANK[best] ? row.status : best,
      "Pending",
    );

  return {
    status,
    sentAt: latest(rows.map((row) => row.sentAt)),
    // Keep a read receipt even if a duplicate had already been marked read.
    readAt: earliest(rows.map((row) => row.readAt)),
    attempts: Math.max(...rows.map((row) => row.attempts ?? 0)),
    error: status === "Sent" || status === "Skipped" ? null : winner.error,
    lastAttemptAt: latest(rows.map((row) => row.lastAttemptAt)),
    nextAttemptAt: status === "Failed" ? winner.nextAttemptAt : null,
  };
}

async function run(): Promise<void> {
  dotenv.config();
  await connectDB();

  const groups = await NotificationRecipientModel.aggregate<DuplicateGroup>([
    {
      $group: {
        _id: { notificationId: "$notificationId", userId: "$userId" },
        count: { $sum: 1 },
        rows: { $push: "$$ROOT" },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]).exec();

  console.log(
    `${groups.length} duplicate { notificationId, userId } group(s) found${dryRun ? " (dry run)" : ""}`,
  );

  let removed = 0;

  for (const group of groups) {
    const winner = pickWinner(group.rows);
    const losers = group.rows.filter(
      (row) => row._id.toString() !== winner._id.toString(),
    );
    const merged = merge(group.rows);

    console.log(
      `  notification ${group._id.notificationId.toString()} / user ${group._id.userId.toString()}: keep ${winner._id.toString()} (${winner.status} -> ${merged.status}), remove ${losers.length}`,
    );

    if (dryRun) {
      continue;
    }

    await NotificationRecipientModel.updateOne(
      { _id: winner._id },
      { $set: merged },
      { timestamps: false },
    );
    const result = await NotificationRecipientModel.deleteMany({
      _id: { $in: losers.map((row) => row._id) },
    });
    removed += result.deletedCount ?? 0;
  }

  if (dryRun) {
    console.log("Dry run: no rows were changed.");
    return;
  }

  console.log(`Done. Removed ${removed} duplicate row(s).`);

  if (syncIndexes) {
    console.log("Syncing indexes...");
    await NotificationRecipientModel.syncIndexes();
    console.log("Indexes synced.");
  } else {
    console.log(
      "Run with --sync-indexes (or deploy the unique index separately) once dedupe is complete.",
    );
  }
}

run()
  .catch((error) => {
    console.error("Dedupe failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
