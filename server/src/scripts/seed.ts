import "../config/env.ts";
import mongoose from "mongoose";

import { connectDB } from "../config/db.config.ts";
import { runSeed } from "../database/seeders/seed.ts";

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function run(): Promise<void> {
  if (hasFlag("--help")) {
    console.log(
      [
        "Usage: npm run db:seed [-- --dry-run]",
        "",
        "Required environment variables:",
        "  SEED_OWNER_EMAIL     owner email",
        "  SEED_OWNER_PASSWORD  owner password (min 8 characters)",
        "Optional:",
        "  SEED_OWNER_NAME      display name (default: SPIMS Owner)",
        "  SEED_ALLOW_PRODUCTION=true  required when NODE_ENV=production",
      ].join("\n"),
    );
    return;
  }

  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD are required. See --help.",
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.SEED_ALLOW_PRODUCTION !== "true"
  ) {
    throw new Error(
      "Refusing to seed production without SEED_ALLOW_PRODUCTION=true",
    );
  }

  const result = await runSeed({
    email,
    password,
    ...(process.env.SEED_OWNER_NAME
      ? { name: process.env.SEED_OWNER_NAME }
      : {}),
    dryRun: hasFlag("--dry-run"),
    log: (message) => console.log(message),
  });

  console.log(JSON.stringify(result, null, 2));
}

connectDB()
  .then(run)
  .catch((error) => {
    console.error(
      "Seed failed:",
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
