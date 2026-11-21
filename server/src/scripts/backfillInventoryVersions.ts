/**
 * Adds `version: 0` to inventory rows created before optimistic concurrency.
 *
 * Usage:
 *   npm run inventory:backfill-versions
 */
import mongoose from "mongoose";

import { connectDB } from "../config/db.config.ts";
import InventoryModel from "../modules/inventory/model/inventory.model.ts";

async function run(): Promise<void> {
  await connectDB();
  const result = await InventoryModel.updateMany(
    { version: { $exists: false } },
    { $set: { version: 0 } },
  );
  console.log(`Backfilled ${result.modifiedCount} inventory row(s).`);
}

run()
  .catch((error) => {
    console.error("Inventory version backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
