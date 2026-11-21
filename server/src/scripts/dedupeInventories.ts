/**
 * One-off cleanup for legacy duplicate aggregate inventory rows.
 *
 * `inventories.medicineId` is now unique. Deployments that predate the
 * constraint can contain multiple rows for one medicine, which prevents the
 * unique index from building. This script keeps one row per medicine,
 * reconciles it against sellable batch truth, merges outstanding reservations,
 * and removes the rest.
 *
 * Usage:
 *   npm run inventory:dedupe -- --dry-run
 *   npm run inventory:dedupe
 *   npm run inventory:dedupe -- --sync-indexes
 */
import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";

import { connectDB } from "../config/db.config.ts";
import BatchModel from "../modules/batch/model/medicineBatch.model.ts";
import InventoryModel from "../modules/inventory/model/inventory.model.ts";

interface InventoryRow {
  _id: Types.ObjectId;
  medicineId: Types.ObjectId;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lastUpdated?: Date;
}

interface DuplicateGroup {
  _id: Types.ObjectId;
  count: number;
  rows: InventoryRow[];
}

const dryRun = process.argv.includes("--dry-run");
const syncIndexes = process.argv.includes("--sync-indexes");

function pickWinner(rows: InventoryRow[]): InventoryRow {
  return [...rows].sort((left, right) => {
    const byUpdated =
      (right.lastUpdated?.getTime() ?? 0) -
      (left.lastUpdated?.getTime() ?? 0);
    if (byUpdated !== 0) {
      return byUpdated;
    }
    const byStock = (right.currentStock ?? 0) - (left.currentStock ?? 0);
    if (byStock !== 0) {
      return byStock;
    }
    return right._id.toString().localeCompare(left._id.toString());
  })[0]!;
}

async function getSellableTotal(medicineId: Types.ObjectId): Promise<number> {
  const [result] = await BatchModel.aggregate<{ total: number }>([
    {
      $match: {
        medicineId,
        quantityRemaining: { $gt: 0 },
        expiryDate: { $gt: new Date() },
        isExpired: false,
      },
    },
    { $group: { _id: null, total: { $sum: "$quantityRemaining" } } },
  ]).exec();
  return result?.total ?? 0;
}

async function run(): Promise<void> {
  dotenv.config();
  await connectDB();

  const groups = await InventoryModel.aggregate<DuplicateGroup>([
    {
      $group: {
        _id: "$medicineId",
        count: { $sum: 1 },
        rows: { $push: "$$ROOT" },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]).exec();

  console.log(
    `${groups.length} duplicate inventory medicineId group(s) found${dryRun ? " (dry run)" : ""}`,
  );

  let removed = 0;

  for (const group of groups) {
    const winner = pickWinner(group.rows);
    const losers = group.rows.filter(
      (row) => row._id.toString() !== winner._id.toString(),
    );
    const totalStock = await getSellableTotal(group._id);
    const reservedStock = Math.max(
      0,
      Math.min(
        group.rows.reduce(
          (sum, row) => sum + Math.max(0, row.reservedStock ?? 0),
          0,
        ),
        totalStock,
      ),
    );
    const availableStock = totalStock - reservedStock;

    console.log(
      `  medicine ${group._id.toString()}: keep ${winner._id.toString()} (current ${winner.currentStock} -> ${totalStock}, reserved ${winner.reservedStock} -> ${reservedStock}), remove ${losers.length}`,
    );

    if (dryRun) {
      continue;
    }

    await InventoryModel.updateOne(
      { _id: winner._id },
      {
        $set: {
          currentStock: totalStock,
          reservedStock,
          availableStock,
          lastUpdated: new Date(),
        },
      },
    );
    const result = await InventoryModel.deleteMany({
      _id: { $in: losers.map((row) => row._id) },
    });
    removed += result.deletedCount ?? 0;
  }

  if (dryRun) {
    console.log("Dry run: no rows were changed.");
    return;
  }

  console.log(`Done. Removed ${removed} duplicate inventory row(s).`);

  if (syncIndexes) {
    console.log("Syncing indexes...");
    await InventoryModel.syncIndexes();
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
