# Database Overview

## 1. Technology and connection

| Item | Value |
|---|---|
| Database | MongoDB |
| ODM | Mongoose 9 |
| Connection | `mongoose.connect(process.env.MONGO_URI)` |
| Connection file | `server/src/config/db.config.ts` |
| Failure behavior | Logs the error and calls `process.exit(1)` |
| Transactions | Used in several multi-collection flows; requires a replica set |
| Migrations | `src/database/migrations` runner + `migrations` ledger |
| Seeders | `src/database/seeders` baseline owner/lookups |
| Schema sync | Mongoose model registration; default `autoIndex` behavior |

Source: `server/src/config/db.config.ts`

Collections and indexes are created by Mongoose when a model is first used
(subject to `autoIndex`, which is enabled by default and is not overridden
anywhere). Ordered data migrations run only when `npm run db:migrate` is
invoked; they are not executed at application boot. Each applied migration is
recorded in the `migrations` collection.

The baseline seeder is idempotent and creates default units/categories/brands/
generic names plus the first owner. The owner password must be supplied through
`SEED_OWNER_PASSWORD`; there is no default password. See
[migrations and seeding](../development/migrations-and-seeding.md).

One-off operational fixes still live under `server/src/scripts/` (for example
`npm --prefix server run notification:backfill`). New ordered data changes
should be added as migrations instead.

## 2. Collections

26 models are registered:

| Domain | Collections |
|---|---|
| Identity | `users`, `authsessions` |
| Audit | `auditlogs` |
| Catalog | `medicines`, `brands`, `categories`, `genericnames`, `units` |
| Supply | `suppliers`, `purchaseorders`, `purchaseorderitems`, `purchasereturns` |
| Inventory | `batches`, `inventories`, `inventorymovements`, `stockadjustments` |
| Sales | `sales`, `salesitems`, `returns`, `counters`, `customers`, `payments` |
| Recommendations | `smartreorders` |
| Notifications | `notifications`, `notificationrecipients` |
| Operations | `backgroundjobs` |

## 3. Schema conventions

- All schemas are declared in TypeScript with an `I<Name> extends Document` interface.
- `authsessions` has a TTL index on `expiresAt` and an index on `userId`. The user collection has sparse indexes on the verification and reset token hashes.
- Most schemas use `{ timestamps: true }`. `Inventory`, `SmartReorder`, and `BackgroundJob` do not; `AuditLog` records only `createdAt`. `StockAdjustment` has both `timestamps: true` and its own `adjustedAt` field, but the model/service is currently unreachable.
- No schema uses Mongoose `strict: false`; unknown fields are dropped.
- No schema uses `versionKey: false`; documents carry `__v`.
- Enums are enforced by Mongoose validators for document `save()` calls. Updates through `findByIdAndUpdate` do **not** run validators unless `runValidators: true` is set, and no repository sets it.
- No soft-delete plugin. "Soft" state is expressed through `isActive` / `status` fields, but delete endpoints generally hard-delete.

## 4. Transactions

MongoDB sessions are passed into repository calls and used in:

| Flow | File |
|---|---|
| Sale creation | `modules/sales/services/sales.service.ts` |
| Sale deletion | same |
| Sales return | `modules/sales/services/return.service.ts` |
| Purchase order creation | `modules/purchase/services/purchaseOrder.service.ts` |
| Purchase order receiving | same |
| Notification creation and deletion | `modules/notification/services/notification.service.ts` |

Inventory increase/decrease, reservations, batch adjustments, batch creation, and disposal run through `StockMutationService`, which joins a caller session or owns a transaction. The unique inventory index must be deployed after existing duplicate rows are deduped.

## 5. Constraints and indexes

### 5.1 Unique constraints

| Collection | Field(s) | Source |
|---|---|---|
| `users` | `email` | `user.model.ts` |
| `medicines` | `barcode` (partial unique on string values) | `medicine.model.ts` |
| `brands` | `name` | `brand.model.ts` |
| `categories` | `name` | `category.model.ts` |
| `genericnames` | `name` | `genericName.model.ts` |
| `units` | `name`, `description` | `unit.model.ts` |
| `suppliers` | `email` | `supplier.model.ts` |
| `suppliers` | `phone` | `supplier.model.ts` |
| `batches` | compound `{ medicineId, batchNumber }` | `medicineBatch.model.ts` |
| `inventories` | `medicineId` | `inventory.model.ts` |
| `sales` | `invoiceNumber` | `sales.model.ts` |
| `sales` | `idempotencyKey` (partial unique on string values) | `sales.model.ts` |
| `smartreorders` | partial `{ medicineId }` where `status = "PENDING"` | `smartReorder.model.ts` |
| `counters` | `name` | `counter.model.ts` |

`suppliers.phone` is now a unique index. Run `npm run index:check` before deploying to catch pre-existing duplicates.

### 5.2 Explicit non-unique indexes

| Collection | Index | Purpose |
|---|---|---|
| `batches` | `{ expiryDate: 1 }` | expiry scans |
| `batches` | `{ medicineId: 1, expiryDate: 1 }` | FEFO batch lookup |
| `batches` | `{ isExpired: 1 }` | expiry filters |
| `batches` | `{ isActive: 1 }` | active filters |
| `batches` | `{ medicineId: 1, createdAt: -1 }` | batch list pagination |
| `batches` | `{ isExpired: 1, quantityRemaining: 1 }` | disposal queue |
| `inventorymovements` | `{ medicineId: 1, createdAt: -1 }` | medicine ledger |
| `inventorymovements` | `{ batchId: 1 }` | batch ledger |
| `inventorymovements` | `{ movementType: 1 }` | type filters |
| `inventorymovements` | `{ referenceId: 1 }` | reference lookup |
| `salesitems` | `{ salesId: 1 }`, `{ batchId: 1 }`, `{ medicineId: 1, createdAt: -1 }` | sale detail, return creation, COGS/top-selling |
| `sales` | `{ status: 1, saleDate: -1 }`, `{ saleDate: -1 }`, `{ cashierId: 1, saleDate: -1 }` | analytics, list filters |
| `returns` | `{ salesId: 1 }`, `{ status: 1, returnDate: -1 }`, `{ returnDate: -1 }` | sale-side lookup, list filters |
| `purchaseorders` | `{ supplierId: 1, orderDate: -1 }`, `{ status: 1, orderDate: -1 }`, `{ orderDate: -1 }` | dashboard, smart reorder, list filters |
| `smartreorders` | `{ medicineId: 1, status: 1, generatedAt: -1 }`, `{ status: 1, generatedAt: -1 }` | pending list, per-medicine |
| `medicines` | `{ isActive: 1, createdAt: -1 }` | catalog pagination |
| `suppliers` | `{ status: 1, companyName: 1 }` | supplier list |
| `notificationrecipients` | `{ notificationId, userId }` unique, `{ userId, createdAt, _id }`, `{ status, nextAttemptAt }` | inbox, retry sweep, counts |
| `notifications` | `{ createdAt: -1, _id: -1 }` | cursor pagination |

### 5.3 Remaining index notes

`stockadjustments.medicineId` is still unindexed because the adjustment service is unreachable. `users.lastLogin` and `users.role` remain unindexed admin filters. Deploy the new unique indexes only after `npm run index:check` reports no duplicates.

## 6. Enumerations

| Collection.field | Values |
|---|---|
| `users.role` | `owner`, `pharmacist`, `inventory_manager` |
| `users.provider` | `local`, `google` |
| `suppliers.status` | `active`, `inActive` |
| `inventorymovements.movementType` | `PURCHASE`, `SALE`, `RETURN`, `ADJUSTMENT`, `EXPIRED`, `RESERVE`, `RELEASE` |
| `inventorymovements.referenceType` | `PURCHASE_ORDER`, `PURCHASE`, `SALE`, `RETURN`, `SALES_RETURN`, `ADJUSTMENT`, `RESERVE`, `RELEASE`, `SYSTEM` |
| `purchaseorders.status` | `pending`, `approved`, `received`, `cancelled` |
| `sales.status` | `COMPLETED`, `PARTIALLY_RETURNED`, `RETURNED`, `CANCELLED`, `PENDING` |
| `returns.status` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED` |
| `returns.returnItems.condition` | `GOOD`, `DAMAGED`, `EXPIRED`, `OPENED` |
| `notifications.type` | `Email`, `SMS`, `InApp` |
| `notifications.status` | `Pending`, `Sent`, `Failed` |
| `notificationrecipients.status` | `Pending`, `Sent`, `Failed`, `Skipped` |
| `smartreorders.status` | `PENDING`, `APPROVED`, `REJECTED` |
| `backgroundjobs.status` | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED` |

## 7. Referential integrity

MongoDB does not enforce foreign keys. The application validates some references (supplier on purchase creation, catalog references on medicine creation, users on notification creation) but not all:

- `Inventory.medicineId` is not validated before creation through `POST /inventory`.
- Purchase order items are not validated against existing medicines on creation.
- Deleting a supplier, medicine, batch, sale, or user does not cascade or block based on dependent documents.
- `batchId` is required by `InventoryMovementService.createMovement` even though the schema defines it as optional.

## 8. Data lifecycle and deletion

| Entity | DELETE behavior |
|---|---|
| Medicine | `DELETE /medicines/:id` sets `isActive: false` (soft) |
| Brand/category/generic name/unit | Hard delete |
| Supplier | Hard delete |
| Batch | Hard delete; blocked while `quantityRemaining > 0`; movements and sale items retain dangling references |
| Inventory | Hard delete; blocked while stock or reservations exist |
| Sales | Hard delete and restores `quantity - returnedQuantity` to the original batch |
| Sale item | No delete route |
| Return | No delete route |
| Notification | Hard delete plus recipient rows |
| User | Hard delete |
| Smart reorder | Hard delete (owner only) |

## 9. Numeric and date handling

- Money fields are JavaScript `Number` (IEEE-754 doubles), not Decimal128. No currency field exists.
- VAT is stored as a percentage value on purchase orders (default `13`), but as an amount on sales (`VAT` is the computed tax).
- Dates are stored as BSON `Date`; Zod uses `z.coerce.date()` in the schemas that exist.
- No timezone configuration; server-local time and UTC are mixed:
  - `new Date()` and `setHours` are used in analytics (server-local).
  - `$month` grouping and `$dateToString` use UTC by default.
- Identifiers are BSON `ObjectId` strings at the API boundary.

## 10. Operational notes

- Because `autoIndex` is on, the first startup against an empty database will build indexes. Large collections can make this slow.
- There is no read/write concern configuration, retry policy, or connection pooling tuning.
- Repositories frequently use `.lean()`; returned objects are plain documents without Mongoose methods.
- Some repository methods return Mongoose documents (not lean) and some return lean objects; services treat both similarly.

## Related documents

- [Schema and relationships](schema-and-relationships.md)
- [Inventory data model](inventory-data-model.md)
- [Transactions and workflows](../business-logic/business-workflows.md)
- [Project status](../project-status.md)
