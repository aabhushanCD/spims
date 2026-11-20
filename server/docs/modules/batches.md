  # Batches and Expiry

## 1. Purpose

Track inventory at batch level: quantity, cost, selling price, manufacturing/expiry dates, and expiry state. Batches are the physical stock unit used by FEFO sales and purchase receiving.

## 2. Responsibilities

- Batch CRUD and lookup by medicine.
- Identify sellable batches.
- Deduct/increase/adjust batch quantity.
- Flag expired batches.
- Confirm disposal of expired stock.
- Provide batch data to sales, purchasing, dashboard, and smart reorder.

## 3. Structure

```text
modules/batch/
├── controller/batch.controller.ts
├── model/medicineBatch.model.ts
├── repo/medicineBatch.repo.ts
├── routes/batch.routes.ts
├── schema/batch.schema.ts        # present but unused
├── service/batch.service.ts
└── types/batchAllocation.type.ts
```

## 4. Routes

Base: `/api/batches`, roles: all three. No Zod middleware.

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | List batches |
| GET | `/:id` | Get batch |
| POST | `/` | Create batch |
| PATCH | `/:id` | Update batch |
| DELETE | `/:id` | Hard delete |
| GET | `/medicine/:medicineId` | First batch for medicine |
| GET | `/medicine/:medicineId/available` | Sellable batches |
| GET | `/medicine/:medicineId/allocate?quantity=` | Allocation (destructive) |
| GET | `/expired` | Batches past expiry date |
| GET | `/expired/awaiting-disposal` | Expired with stock |
| GET | `/low-stock?threshold=` | Per-batch low stock |
| POST | `/mark-expired` | Flag expired |
| POST | `/:id/deduct` | Deduct quantity |
| POST | `/:id/increase` | Increase quantity |
| POST | `/:id/adjust` | Set absolute quantity |
| GET | `/:id/history` | Batch metadata |
| POST | `/:id/confirm-disposal` | Dispose expired stock |

Full contracts: [endpoints.md](../api/endpoints.md#batches).

## 5. Controller

`BatchController` wraps handlers with `asyncHandler`.

- Numeric query/body checks are manual (`threshold`, `quantity`).
- `confirmDisposal` requires an authenticated user for movement attribution.
- All other actions do not pass a user id to the service.

## 6. Service

`BatchService` (`modules/batch/service/batch.service.ts`):

| Method | Behavior |
|---|---|
| `createBatch` | Requires the purchase order to exist, then creates the batch. No inventory sync. **Blocked by the `isActive` validator for any positive `quantityRemaining`.** |
| `getBatchById` / `getAllBatches` | Reads. Missing batch throws plain `Error` → 500. |
| `getAvailableBatches` | All batches for medicine with `quantityRemaining > 0` and `expiryDate > now` (does not check `isExpired`). |
| `updateBatch` / `deleteBatch` | Generic update/delete; no sync or movement. |
| `deductQuantity` | Checks remaining, subtracts, updates. No movement. |
| `increaseQuantity` | Adds, updates. No movement and no upper bound check. |
| `adjustStock` | Sets absolute `quantityRemaining`, then syncs aggregate. No movement. |
| `markExpiredBatches` | Sets `isExpired: true` for batches with stock whose `expiryDate < now`; returns affected ids. |
| `getExpiredBatches` | Filters by `expiryDate < now` only. |
| `confirmDisposal` | Requires `isExpired` and stock > 0; sets batch to 0; calls `InventoryService.decreaseStock`, which records the movement as `SALE` despite the requested `EXPIRED` type. |
| `getExpiredAwaitingDisposal` | `isExpired && quantityRemaining > 0`. |
| `getLowStockBatches` | Per-batch threshold filter. |
| `allocateStock` | FEFO loop that deducts stock and syncs, but returns an empty allocation array. |
| `getBatchByMedicineId` | `findOne`, not a list. |
| `getBatchHistory` | Returns batch metadata only, not movements. |

## 7. Model

`Batch` (`modules/batch/model/medicineBatch.model.ts`). Fields, indexes, and validators: [Schema and relationships](../database/schema-and-relationships.md#51-batches-batch).

Important validators:

```text
expiryDate > manufacturingDate
quantityRemaining <= quantityReceived
isActive === true only if quantityRemaining === 0
```

The last validator is inverted relative to its message and conflicts with the default `isActive: true`. **Confirmed:** validating a new batch with `quantityRemaining: 5` using the installed Mongoose version fails with `Batch can only be marked as inactive if quantity remaining is zero`. This blocks `POST /batches` and every purchase receipt, because both insert batches with positive quantity. A zero-quantity batch can validate, but receiving requires positive received quantities.

Reproduction (no database needed):

```ts
const batch = new Batch({ /* required fields */ quantityReceived: 10, quantityRemaining: 10 });
await batch.validate(); // throws the isActive validator error
```

## 8. Validation

`modules/batch/schema/batch.schema.ts` exists but is not imported by the router. The only request checks are:

- positive `quantity` on deduct/increase;
- non-negative `quantity` on adjust;
- non-negative `threshold`;
- positive `quantity` on allocate;
- authenticated user on disposal.

No date, price, or quantity relationship checks at the HTTP layer; only Mongoose validators on `save()`.

## 9. Middleware

`verifyToken` + `authorize` at `/api/batches`. No module-specific middleware.

## 10. Business rules

### Sellable definition

A batch is sellable when:

```text
quantityRemaining > 0
AND expiryDate > now
AND isExpired === false
```

This is enforced in `findSellableBatches` (used by sales) but **not** in `getAvailableBatches` (used by the available-batches endpoint), which omits the `isExpired` check.

### Expiry

- Expired means `expiryDate < now`, regardless of `isExpired`.
- `isExpired` is set by `POST /batches/mark-expired` and by the nightly cron.
- Sales exclude both expired dates and flagged batches.
- Expired batches are not removed from inventory until disposal is confirmed.
- The expiry cron sends an in-app notification to all pharmacists but does not zero stock.

### Disposal

1. Batch must be flagged `isExpired`.
2. Batch must have remaining quantity.
3. Set `quantityRemaining = 0`.
4. Decrease aggregate stock by the disposed quantity.
5. Write a movement — but note that `decreaseStock` hardcodes `movementType: "SALE"`, so the `EXPIRED` type passed in the context is lost.

No transaction; a failure between steps leaves partial state.

### Adjustment

- `POST /:id/adjust` is an absolute set, not a delta.
- No check against `quantityReceived` (validators are skipped by `findByIdAndUpdate`).
- No movement record.
- Aggregate is synced after the update.

### Allocation endpoint

`GET /batches/medicine/:medicineId/allocate?quantity=N`:

- Loads all batches for the medicine (unsorted).
- Filters sellable by quantity and date.
- Deducts across batches.
- Syncs aggregate after each batch.
- **Never appends to the `allocation` array**, so the response is `[]`.
- Uses GET for a state-changing operation.
- Writes no movements.

Treat this endpoint as broken and unsafe.

## 11. Dependencies

- `PurchaseOrderRepo` (batch creation validation)
- `InventoryService` (sync and disposal)
- Used by `InventoryService.sellMedicine`, `DashboardService`, `SmartReorderService`, `PurchaseOrderService`

## 12. Workflows

### Receiving creates batches

```mermaid
sequenceDiagram
  participant PS as PurchaseOrderService
  participant BS as BatchService
  participant BR as BatchRepo
  participant IS as InventoryService

  PS->>BS: createBatch({medicineId, purchaseOrderId, ...})
  BS->>BR: purchaseOrder exists?
  BS->>BR: save batch
  PS->>IS: syncInventoryFromBatch(medicineId, PURCHASE ctx)
```

### Nightly expiry check

```mermaid
sequenceDiagram
  participant Cron
  participant BS as BatchService
  participant Repo as UserRepo
  participant NS as NotificationService

  Cron->>BS: markExpiredBatches()
  BS->>BS: flag expiryDate < now and qty > 0
  Cron->>Repo: findIdsByRole("pharmacist")
  Cron->>NS: createNotification(InApp)
  NS-->>Cron: dispatched asynchronously
```

## 13. Limitations and risks

| Issue | Status |
|---|---|
| `isActive` validator blocks positive-quantity creation | Confirmed defect |
| No movement on deduct/increase/adjust | Defect |
| `allocateStock` returns empty array and mutates on GET | Defect |
| `getBatchByMedicineId` returns one batch | Limitation |
| `getBatchHistory` lacks movement history | Not Implemented |
| Available endpoint ignores `isExpired` | Inconsistency |
| No partial receiving/batch split | Not Implemented |
| No batch merge/transfer | Not Implemented |
| No transaction around disposal | Limitation |
| No request validation | Partially Implemented |
| Deletion allowed with stock | Risk |

## Related documents

- [FEFO/FIFO](../business-logic/fefo-fifo.md)
- [Inventory data model](../database/inventory-data-model.md)
- [Inventory management](../business-logic/inventory-management.md)
- [Purchases](purchases.md)
