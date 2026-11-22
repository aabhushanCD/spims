import { describe, expect, it, vi } from "vitest";
import type { Db } from "mongodb";

import {
  getMigrationStatus,
  runMigrations,
} from "./runner.ts";
import type { Migration, MigrationRecord } from "./types.ts";

function createDb(applied: string[] = []) {
  const records: MigrationRecord[] = applied.map((id) => ({
    id,
    description: "already applied",
    appliedAt: new Date("2026-01-01T00:00:00.000Z"),
    durationMs: 1,
  }));

  const insertOne = vi.fn(async (record: MigrationRecord) => {
    records.push(record);
    return { acknowledged: true, insertedId: record.id };
  });
  const find = vi.fn(() => ({
    toArray: async () => records.map((record) => ({ id: record.id })),
  }));
  const createIndex = vi.fn().mockResolvedValue("id_1");
  const collection = vi.fn(() => ({ createIndex, find, insertOne }));

  return {
    db: { collection } as unknown as Db,
    records,
    insertOne,
    find,
    createIndex,
  };
}

function migration(id: string): Migration {
  return {
    id,
    description: `migration ${id}`,
    up: vi.fn().mockResolvedValue(undefined),
  };
}

describe("migration runner", () => {
  it("applies pending migrations in registry order and records them", async () => {
    const db = createDb();
    const first = migration("001-first");
    const second = migration("002-second");

    const result = await runMigrations({
      db: db.db,
      migrations: [first, second],
    });

    expect(first.up).toHaveBeenCalledOnce();
    expect(second.up).toHaveBeenCalledOnce();
    expect(result.applied).toEqual(["001-first", "002-second"]);
    expect(result.pending).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(db.insertOne).toHaveBeenCalledTimes(2);
  });

  it("skips migrations already present in the ledger", async () => {
    const db = createDb(["001-first"]);
    const first = migration("001-first");
    const second = migration("002-second");

    const result = await runMigrations({
      db: db.db,
      migrations: [first, second],
    });

    expect(first.up).not.toHaveBeenCalled();
    expect(second.up).toHaveBeenCalledOnce();
    expect(result.skipped).toEqual(["001-first"]);
    expect(result.applied).toEqual(["002-second"]);
  });

  it("does not execute or record anything during a dry run", async () => {
    const db = createDb();
    const first = migration("001-first");

    const result = await runMigrations({
      db: db.db,
      migrations: [first],
      dryRun: true,
    });

    expect(first.up).not.toHaveBeenCalled();
    expect(db.insertOne).not.toHaveBeenCalled();
    expect(result.pending).toEqual(["001-first"]);
  });

  it("does not record a failed migration", async () => {
    const db = createDb();
    const failing: Migration = {
      id: "001-failing",
      description: "fails",
      up: vi.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(
      runMigrations({ db: db.db, migrations: [failing] }),
    ).rejects.toThrow("Migration 001-failing failed: boom");
    expect(db.insertOne).not.toHaveBeenCalled();
  });

  it("rejects duplicate migration ids", async () => {
    const db = createDb();

    await expect(
      runMigrations({
        db: db.db,
        migrations: [migration("001"), migration("001")],
      }),
    ).rejects.toThrow("Duplicate migration id: 001");
  });

  it("reports applied and pending migrations", async () => {
    const db = createDb(["001-first"]);

    await expect(
      getMigrationStatus(db.db, [
        migration("001-first"),
        migration("002-second"),
      ]),
    ).resolves.toEqual({
      applied: ["001-first"],
      pending: ["002-second"],
    });
  });
});
