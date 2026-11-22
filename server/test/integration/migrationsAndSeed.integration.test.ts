import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcrypt";

import { Brand } from "../../src/modules/medicine/models/brand.model.ts";
import { Category } from "../../src/modules/medicine/models/category.model.ts";
import { GenericName } from "../../src/modules/medicine/models/genericName.model.ts";
import { Unit } from "../../src/modules/medicine/models/unit.model.ts";
import { User } from "../../src/modules/user/model/user.model.ts";
import Batch from "../../src/modules/batch/model/medicineBatch.model.ts";
import Inventory from "../../src/modules/inventory/model/inventory.model.ts";
import SalesItem from "../../src/modules/sales/model/salesItem.model.ts";
import { MIGRATIONS } from "../../src/database/migrations/registry.ts";
import { runMigrations } from "../../src/database/migrations/runner.ts";
import { runSeed } from "../../src/database/seeders/seed.ts";

let mongod: MongoMemoryServer | undefined;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: "spims_migrations" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is unavailable");
  }
  await db.dropDatabase();
  await Promise.all([
    Brand.init(),
    Category.init(),
    GenericName.init(),
    Unit.init(),
    User.init(),
    Batch.init(),
    Inventory.init(),
    SalesItem.init(),
  ]);
});

describe("migrations", () => {
  it("backfills sale item cost and inventory version once", async () => {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("MongoDB connection is unavailable");
    }

    const medicineId = new mongoose.Types.ObjectId();
    const batch = await Batch.create({
      medicineId,
      purchaseOrderId: new mongoose.Types.ObjectId(),
      batchNumber: "SEED-BATCH-1",
      expiryDate: new Date("2027-01-01T00:00:00.000Z"),
      manufacturingDate: new Date("2025-01-01T00:00:00.000Z"),
      purchasePrice: 12.5,
      sellingPrice: 18,
      quantityReceived: 10,
      quantityRemaining: 5,
    });

    await db.collection("salesitems").insertOne({
      salesId: new mongoose.Types.ObjectId(),
      batchId: batch._id,
      medicineId,
      quantity: 1,
      unitPrice: 18,
      discount: 0,
      totalPrice: 18,
      returnedQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection("inventories").insertOne({
      medicineId,
      currentStock: 5,
      reservedStock: 0,
      availableStock: 5,
      lastUpdated: new Date(),
    });

    const first = await runMigrations({ db, migrations: MIGRATIONS });
    expect(first.applied).toEqual(MIGRATIONS.map((item) => item.id));

    const saleItem = await db.collection("salesitems").findOne({});
    expect(saleItem?.purchasePrice).toBe(12.5);

    const inventory = await db.collection("inventories").findOne({});
    expect(inventory?.version).toBe(0);

    const second = await runMigrations({ db, migrations: MIGRATIONS });
    expect(second.applied).toEqual([]);
    expect(second.skipped).toHaveLength(MIGRATIONS.length);
    expect(
      await db.collection("migrations").countDocuments(),
    ).toBe(MIGRATIONS.length);
  });

  it("reports pending migrations in a dry run without writing the ledger", async () => {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("MongoDB connection is unavailable");
    }

    const result = await runMigrations({
      db,
      migrations: MIGRATIONS,
      dryRun: true,
    });

    expect(result.pending).toEqual(MIGRATIONS.map((item) => item.id));
    expect(await db.collection("migrations").countDocuments()).toBe(0);
  });
});

describe("seeders", () => {
  it("creates an owner and baseline lookups idempotently", async () => {
    const email = "seed-owner@example.com";
    const password = "seed-password-123";

    const first = await runSeed({ email, password, name: "Seed Owner" });
    expect(first.owner.created).toBe(true);
    expect(first.lookups.units.created).toBeGreaterThan(0);
    expect(first.lookups.categories.created).toBeGreaterThan(0);

    const owner = await User.findOne({ email }).select("+password").lean();
    expect(owner).toMatchObject({ role: "owner", emailVerified: true });
    expect(await bcrypt.compare(password, owner?.password ?? "")).toBe(true);

    const second = await runSeed({ email, password, name: "Seed Owner" });
    expect(second.owner).toMatchObject({ created: false, existing: true });
    expect(second.lookups.units.created).toBe(0);
    expect(second.lookups.units.existing).toBeGreaterThan(0);
    expect(second.lookups.categories.created).toBe(0);
    expect(await Unit.countDocuments()).toBe(first.lookups.units.created);
  });

  it("plans without writing in a dry run", async () => {
    const result = await runSeed({
      email: "dry-run@example.com",
      password: "seed-password-123",
      dryRun: true,
    });

    expect(result.owner).toMatchObject({ created: false, planned: true });
    expect(result.lookups.units.planned).toBeGreaterThan(0);
    expect(await User.countDocuments()).toBe(0);
    expect(await Unit.countDocuments()).toBe(0);
  });

  it("refuses to promote an existing non-owner account", async () => {
    await User.create({
      name: "Pharmacist",
      email: "pharmacist@example.com",
      password: "not-used",
      role: "pharmacist",
      emailVerified: true,
      isActive: true,
    });

    await expect(
      runSeed({
        email: "pharmacist@example.com",
        password: "seed-password-123",
      }),
    ).rejects.toThrow("refusing to promote");
  });
});
