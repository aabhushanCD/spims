import bcrypt from "bcrypt";

import { Brand } from "../../modules/medicine/models/brand.model.ts";
import { Category } from "../../modules/medicine/models/category.model.ts";
import { GenericName } from "../../modules/medicine/models/genericName.model.ts";
import { Unit } from "../../modules/medicine/models/unit.model.ts";
import { User } from "../../modules/user/model/user.model.ts";
import {
  DEFAULT_BRANDS,
  DEFAULT_CATEGORIES,
  DEFAULT_GENERIC_NAMES,
  DEFAULT_UNITS,
  type LookupRow,
} from "./lookupData.ts";

interface LookupModel {
  findOne(filter: { name: string }): { lean(): Promise<unknown> };
  create(data: LookupRow & { isActive: boolean }): Promise<unknown>;
}

export interface LookupSeedCount {
  created: number;
  existing: number;
  planned: number;
}

export type LookupSeedResult = Record<
  "units" | "categories" | "brands" | "genericNames",
  LookupSeedCount
>;

export interface SeedOwnerOptions {
  email: string;
  password: string;
  name?: string;
  dryRun?: boolean;
}

export interface SeedOwnerResult {
  created: boolean;
  existing: boolean;
  planned: boolean;
}

export interface RunSeedOptions extends SeedOwnerOptions {
  dryRun?: boolean;
  log?: (message: string) => void;
}

export interface SeedResult {
  owner: SeedOwnerResult;
  lookups: LookupSeedResult;
  dryRun: boolean;
}

async function ensureLookups(
  label: string,
  model: LookupModel,
  rows: LookupRow[],
  dryRun: boolean,
  log: (message: string) => void,
): Promise<LookupSeedCount> {
  const count: LookupSeedCount = { created: 0, existing: 0, planned: 0 };

  for (const row of rows) {
    const existing = await model.findOne({ name: row.name }).lean();
    if (existing) {
      count.existing += 1;
      continue;
    }

    if (dryRun) {
      count.planned += 1;
      log(`would create ${label}: ${row.name}`);
      continue;
    }

    await model.create({ ...row, isActive: true });
    count.created += 1;
    log(`created ${label}: ${row.name}`);
  }

  return count;
}

export async function seedLookups(
  options: { dryRun?: boolean; log?: (message: string) => void } = {},
): Promise<LookupSeedResult> {
  const dryRun = options.dryRun ?? false;
  const log = options.log ?? (() => undefined);

  return {
    units: await ensureLookups(
      "unit",
      Unit as unknown as LookupModel,
      DEFAULT_UNITS,
      dryRun,
      log,
    ),
    categories: await ensureLookups(
      "category",
      Category as unknown as LookupModel,
      DEFAULT_CATEGORIES,
      dryRun,
      log,
    ),
    brands: await ensureLookups(
      "brand",
      Brand as unknown as LookupModel,
      DEFAULT_BRANDS,
      dryRun,
      log,
    ),
    genericNames: await ensureLookups(
      "generic name",
      GenericName as unknown as LookupModel,
      DEFAULT_GENERIC_NAMES,
      dryRun,
      log,
    ),
  };
}

/**
 * Creates the first owner account. It never silently promotes an existing
 * non-owner account, and it never writes a default password: the caller must
 * supply one through the environment.
 */
export async function seedOwner(
  options: SeedOwnerOptions,
): Promise<SeedOwnerResult> {
  const email = options.email.trim().toLowerCase();
  const password = options.password;

  if (!email.includes("@")) {
    throw new Error("SEED_OWNER_EMAIL must be a valid email address");
  }
  if (password.length < 8) {
    throw new Error("SEED_OWNER_PASSWORD must be at least 8 characters");
  }

  const existing = await User.findOne({ email })
    .select("role")
    .lean<{ role?: string } | null>()
    .exec();

  if (existing) {
    if (existing.role !== "owner") {
      throw new Error(
        `An account with ${email} already exists but is not an owner; refusing to promote it`,
      );
    }
    return { created: false, existing: true, planned: false };
  }

  if (options.dryRun) {
    return { created: false, existing: false, planned: true };
  }

  await User.create({
    name: options.name?.trim() || "SPIMS Owner",
    email,
    password: await bcrypt.hash(password, 10),
    role: "owner",
    provider: "local",
    emailVerified: true,
    isActive: true,
  });

  return { created: true, existing: false, planned: false };
}

export async function runSeed(options: RunSeedOptions): Promise<SeedResult> {
  const dryRun = options.dryRun ?? false;
  const log = options.log ?? (() => undefined);

  log(dryRun ? "seed dry run" : "seeding baseline data");
  const lookups = await seedLookups({ dryRun, log });
  const owner = await seedOwner({ ...options, dryRun });

  return { owner, lookups, dryRun };
}
