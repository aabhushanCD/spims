# Migrations and seeding

SPIMS uses an explicit, ordered migration runner and an idempotent baseline
seeder. Neither runs automatically at application boot.

## Commands

From the repository root:

```bash
npm run db:migrate:status   # applied and pending migrations
npm run db:migrate:dry-run  # list pending migrations without writing
npm run db:migrate          # apply pending migrations
npm run db:seed:dry-run     # report what the seeder would create
npm run db:seed             # create baseline lookups and the first owner
```

Package-level equivalents work with `npm --prefix server run <script>`.

All commands read `MONGO_URI` from the server environment and close the Mongoose
connection when finished.

## Migration runner

- Registry: `server/src/database/migrations/registry.ts`
- Runner: `server/src/database/migrations/runner.ts`
- Ledger: the `migrations` collection, with a unique index on `id`
- Records: `id`, `description`, `appliedAt`, `durationMs`

The runner applies registry entries in order, skips ids already present in the
ledger, and inserts the ledger row only after `up()` succeeds. A failed migration
is not recorded, so it can be fixed and retried. Migration ids are stable; never
rename or reorder one after it has been deployed.

Migrations should be idempotent. They run without a transaction because some
deployments use a standalone MongoDB, and index creation is not transactional.

### Adding a migration

```ts
// server/src/database/migrations/003-example.ts
import type { Migration } from "./types.ts";

export const exampleMigration: Migration = {
  id: "003-example",
  description: "Explain the data change",
  async up({ db, log }) {
    const result = await db
      .collection("example")
      .updateMany(
        { field: { $exists: false } },
        { $set: { field: 0 } },
      );
    log(`example: updated ${result.modifiedCount}`);
  },
};
```

Register it in `registry.ts`, then run the dry run and the real migration.

### Initial migrations

| Id | Purpose |
|---|---|
| `001-backfill-sale-item-cost-snapshot` | Copy `batches.purchasePrice` into sale items that lack the cost snapshot; items without a surviving batch are skipped |
| `002-backfill-inventory-versions` | Set `version: 0` on inventory rows created before optimistic concurrency |
| `003-backfill-line-vat-rates` | Copy header VAT rates into sale, return, and purchase lines |
| `004-backfill-purchase-received-quantity` | Set `receivedQuantity` for items on already-received POs |

Historical financial backfills that cannot be reconstructed safely (for example
pre-Phase-4 purchase totals) are **not** attempted. They remain documented as an
operational limitation.

## Seeder

- Implementation: `server/src/database/seeders/seed.ts`
- Baseline data: `server/src/database/seeders/lookupData.ts`

The seeder creates:

- default units (Tablet, Capsule, Bottle, ...),
- default categories, brands, and generic names,
- the first owner account.

It is idempotent: existing rows are left untouched. The owner step is
deliberately conservative:

- `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` are required;
- the password must be at least 8 characters and is bcrypt-hashed;
- an existing non-owner account with the same email is **never** promoted;
- in production, `SEED_ALLOW_PRODUCTION=true` is required;
- `--dry-run` reports planned work without writing anything.

```bash
SEED_OWNER_EMAIL=owner@example.com \
SEED_OWNER_PASSWORD='use-a-secret-manager' \
SEED_OWNER_NAME='Pharmacy Owner' \
npm run db:seed
```

Do not put a real password in `.env.example`, the repository, or a shell history
you do not control. Prefer a secret manager or an interactive environment.

## Limitations

- No down migrations; roll forward with a new migration.
- No checksum drift detection; changing an already-applied migration is not
  detected automatically.
- No automatic execution at boot or in CI; deployment runs the commands.
- The seeder creates baseline configuration, not demo sales/purchases.

## Tests

`server/src/database/migrations/runner.test.ts` covers ordering, ledger skips,
dry runs, failures, and duplicate ids. The migration/seeder integration suite
runs the real migrations and seed twice against an in-memory MongoDB to prove
idempotency.
