/**
 * Read-only preflight for unique indexes introduced in Phase 5.
 *
 * Deployments can contain duplicate data that prevents MongoDB from building a
 * unique index. Run this before deploying (or before syncIndexes) and clean up
 * the reported rows with the corresponding maintenance script.
 *
 * Usage:
 *   npm run index:check
 */
import mongoose from "mongoose";

import { connectDB } from "../config/db.config.ts";
import InventoryModel from "../modules/inventory/model/inventory.model.ts";
import SalesModel from "../modules/sales/model/sales.model.ts";
import SmartReorderModel from "../modules/smartReorder/model/smartReorder.model.ts";
import SupplierModel from "../modules/supplier/model/supplier.model.ts";

interface DuplicateGroup {
  _id: unknown;
  count: number;
}

async function duplicates(
  model: mongoose.Model<unknown>,
  field: string,
  extraMatch: Record<string, unknown> = {},
): Promise<DuplicateGroup[]> {
  return model
    .aggregate<DuplicateGroup>([
      { $match: { [field]: { $ne: null }, ...extraMatch } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 50 },
    ])
    .exec();
}

async function run(): Promise<void> {
  await connectDB();

  const checks: Array<{
    label: string;
    model: mongoose.Model<unknown>;
    field: string;
    extraMatch?: Record<string, unknown>;
  }> = [
    {
      label: "suppliers.phone",
      model: SupplierModel as unknown as mongoose.Model<unknown>,
      field: "phone",
    },
    {
      label: "inventories.medicineId",
      model: InventoryModel as unknown as mongoose.Model<unknown>,
      field: "medicineId",
    },
    {
      label: "smartreorders pending medicineId",
      model: SmartReorderModel as unknown as mongoose.Model<unknown>,
      field: "medicineId",
      extraMatch: { status: "PENDING" },
    },
    {
      label: "sales.idempotencyKey",
      model: SalesModel as unknown as mongoose.Model<unknown>,
      field: "idempotencyKey",
    },
  ];

  let hasDuplicates = false;
  for (const check of checks) {
    const groups = await duplicates(
      check.model,
      check.field,
      check.extraMatch,
    );
    if (groups.length === 0) {
      console.log(`${check.label}: OK`);
      continue;
    }
    hasDuplicates = true;
    console.error(`${check.label}: ${groups.length} duplicate group(s)`);
    for (const group of groups) {
      console.error(`  ${String(group._id)} x${group.count}`);
    }
  }

  if (hasDuplicates) {
    process.exitCode = 1;
  }
}

run()
  .catch((error) => {
    console.error("Index readiness check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
