import "../config/env.ts";
import mongoose from "mongoose";

import { connectDB } from "../config/db.config.ts";
import {
  getMigrationStatus,
  runMigrations,
} from "../database/migrations/runner.ts";
import { MIGRATIONS } from "../database/migrations/registry.ts";

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function run(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is unavailable");
  }

  if (hasFlag("--status")) {
    const status = await getMigrationStatus(db, MIGRATIONS);
    console.log("applied:");
    for (const id of status.applied) {
      console.log(`  ${id}`);
    }
    console.log("pending:");
    for (const id of status.pending) {
      console.log(`  ${id}`);
    }
    return;
  }

  const dryRun = hasFlag("--dry-run");
  const result = await runMigrations({
    db,
    migrations: MIGRATIONS,
    dryRun,
    log: (message) => console.log(message),
  });

  if (dryRun) {
    console.log(
      `dry run: ${result.pending.length} pending, ${result.skipped.length} already applied`,
    );
  } else {
    console.log(
      `migrations: ${result.applied.length} applied, ${result.skipped.length} skipped`,
    );
  }
}

connectDB()
  .then(run)
  .catch((error) => {
    console.error(
      "Migration run failed:",
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
