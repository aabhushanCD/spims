import type { Db } from "mongodb";

import type {
  Migration,
  MigrationRecord,
} from "./types.ts";

export const MIGRATIONS_COLLECTION = "migrations";

export interface RunMigrationsOptions {
  db: Db;
  migrations: Migration[];
  dryRun?: boolean;
  log?: (message: string) => void;
}

export interface MigrationRunResult {
  applied: string[];
  pending: string[];
  skipped: string[];
}

function assertUniqueIds(migrations: Migration[]): void {
  const seen = new Set<string>();

  for (const migration of migrations) {
    if (!migration.id.trim()) {
      throw new Error("Migration id must not be empty");
    }
    if (seen.has(migration.id)) {
      throw new Error(`Duplicate migration id: ${migration.id}`);
    }
    seen.add(migration.id);
  }
}

/**
 * Applies pending migrations in registry order and records each one in the
 * `migrations` collection. Migrations should be idempotent so a crash between
 * `up()` and the ledger insert can be retried safely.
 */
export async function runMigrations(
  options: RunMigrationsOptions,
): Promise<MigrationRunResult> {
  const { db, migrations, dryRun = false } = options;
  const log = options.log ?? (() => undefined);

  assertUniqueIds(migrations);

  const collection = db.collection<MigrationRecord>(MIGRATIONS_COLLECTION);
  await collection.createIndex({ id: 1 }, { unique: true });

  const appliedRows = await collection
    .find({}, { projection: { id: 1 } })
    .toArray();
  const appliedIds = new Set(appliedRows.map((row) => row.id));

  const pending = migrations.filter(
    (migration) => !appliedIds.has(migration.id),
  );
  const skipped = migrations
    .filter((migration) => appliedIds.has(migration.id))
    .map((migration) => migration.id);

  if (dryRun) {
    for (const migration of pending) {
      log(`would apply ${migration.id} — ${migration.description}`);
    }
    return { applied: [], pending: pending.map((item) => item.id), skipped };
  }

  const applied: string[] = [];

  for (const migration of pending) {
    const startedAt = Date.now();
    log(`applying ${migration.id} — ${migration.description}`);

    try {
      await migration.up({ db, log });
    } catch (error) {
      throw new Error(
        `Migration ${migration.id} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error },
      );
    }

    const record: MigrationRecord = {
      id: migration.id,
      description: migration.description,
      appliedAt: new Date(),
      durationMs: Date.now() - startedAt,
    };
    await collection.insertOne(record);
    applied.push(migration.id);
    log(`applied ${migration.id} in ${record.durationMs}ms`);
  }

  return { applied, pending: [], skipped };
}

export async function getMigrationStatus(
  db: Db,
  migrations: Migration[],
): Promise<{ applied: string[]; pending: string[] }> {
  assertUniqueIds(migrations);
  const collection = db.collection<MigrationRecord>(MIGRATIONS_COLLECTION);
  const rows = await collection
    .find({}, { projection: { id: 1 } })
    .toArray();
  const applied = new Set(rows.map((row) => row.id));

  return {
    applied: migrations
      .filter((migration) => applied.has(migration.id))
      .map((migration) => migration.id),
    pending: migrations
      .filter((migration) => !applied.has(migration.id))
      .map((migration) => migration.id),
  };
}
