/**
 * One-off backfill for notification recipient rows created before
 * `timestamps: true` was added to the schema.
 *
 * The inbox paginates and sorts on `createdAt`, and the retry sweep reads it,
 * so rows without it are effectively unreachable. Mongoose cannot invent the
 * value, but the ObjectId embeds the insert time, which is the best available
 * approximation.
 *
 * Usage:
 *   npm run notification:backfill -- --dry-run
 *   npm run notification:backfill
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../config/db.config.ts";
import NotificationRecipientModel from "../modules/notification/model/notificationRecipient.model.ts";

const BATCH_SIZE = 500;
const dryRun = process.argv.includes("--dry-run");
const MISSING_TIMESTAMP = { createdAt: { $exists: false } };

async function run(): Promise<void> {
  dotenv.config();
  await connectDB();

  const total = await NotificationRecipientModel.countDocuments(
    MISSING_TIMESTAMP,
  );
  console.log(
    `${total} recipient row(s) are missing createdAt${dryRun ? " (dry run)" : ""}`,
  );

  if (dryRun) {
    const sample = await NotificationRecipientModel.find(MISSING_TIMESTAMP)
      .select("_id")
      .limit(5)
      .lean()
      .exec();

    for (const row of sample) {
      console.log(
        `  ${row._id.toString()} -> ${row._id.getTimestamp().toISOString()}`,
      );
    }
    return;
  }

  let updated = 0;

  for (;;) {
    const rows = await NotificationRecipientModel.find(MISSING_TIMESTAMP)
      .select("_id")
      .limit(BATCH_SIZE)
      .lean()
      .exec();

    if (rows.length === 0) {
      break;
    }

    const operations = rows.map((row) => {
      const derived = row._id.getTimestamp();
      return {
        updateOne: {
          filter: { _id: row._id, ...MISSING_TIMESTAMP },
          update: { $set: { createdAt: derived, updatedAt: derived } },
          timestamps: false,
        },
      };
    });

    const result = await NotificationRecipientModel.bulkWrite(operations, {
      ordered: false,
    });
    updated += result.modifiedCount;
    console.log(`  backfilled ${updated}/${total}`);
  }

  const remaining = await NotificationRecipientModel.countDocuments(
    MISSING_TIMESTAMP,
  );
  console.log(`Done. Updated ${updated} row(s); ${remaining} still missing.`);
}

run()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
