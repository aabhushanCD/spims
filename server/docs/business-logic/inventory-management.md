# Inventory Management

This document describes the stock rules as implemented. It complements [Inventory data model](../database/inventory-data-model.md), which explains the records.

## 1. One source of truth

`Batch.quantityRemaining` is the physical source of truth. `Inventory` is a derived per-medicine cache.

```text
currentStock   = Σ quantityRemaining over sellable batches
availableStock = currentStock - reservedStock
```

A batch is sellable when:

```text
quantityRemaining > 0
AND expiryDate > now
AND isExpired === false
```

`InventoryMovement` is an audit trail. It is never replayed to rebuild stock.

## 2. Single write path

All stock mutations go through `StockMutationService` (`modules/inventory/services/stockMutation.service.ts`):

- It mutates the batch and/or the aggregate.
- It recomputes the aggregate from batch truth with `syncAggregate`.
- It writes exactly one movement per operation.
- It joins a caller-supplied session, or starts and ends its own transaction when none is supplied.

`InventoryService` and `BatchService` are facades over this service. Sales, purchase receipts, returns, disposal, manual inventory operations, and batch endpoints all use the same path.

## 3. Stock operations

| Operation | Batch effect | Aggregate effect | Movement | Transaction |
|---|---|---|---|---|
| Sale | Deduct per FEFO batch | One sync after allocations | `SALE` per batch | Yes |
| Purchase receipt / direct batch create | Create batch with `quantityRemaining = quantityReceived` | Sync | One `PURCHASE` | Yes |
| GOOD return | `+quantity` on the original batch | Sync | One `RETURN` | Yes |
| DAMAGED/EXPIRED/OPENED return | None (write-off) | None | One `RETURN` | Yes |
| Sale deletion | `+ (quantity - returnedQuantity)` per item | Sync | One `RETURN` per restored item | Yes |
| Disposal | Set batch to 0 | Sync | One `EXPIRED` | Yes |
| Manual increase/decrease | Batch `+/- quantity` (batch id required) | Sync | One movement | Yes |
| Reserve | None | `reservedStock += qty`, `availableStock -= qty` | One `RESERVE` | Yes |
| Release | None | `reservedStock -= qty`, `availableStock += qty` | One `RELEASE` | Yes |
| Batch deduct/increase/adjust | Batch delta/absolute | Sync | One movement | Yes |
| Batch update with quantity change | Absolute set | Sync | One movement when the quantity changes | Yes |

## 4. Aggregate reconciliation

`StockMutationService.syncAggregate(medicineId, { ctx?, session? })`:

1. Loads the aggregate row by medicine.
2. Computes `totalStock = batchRepo.getTotalStock(medicineId, session)`.
3. If the row is missing, creates it with `currentStock = totalStock`, `reservedStock = 0`, and `availableStock = totalStock`.
4. If the row exists, sets `currentStock = totalStock` and `availableStock = totalStock - reservedStock`.
5. Writes one `ADJUSTMENT` movement only when a context is supplied and `currentStock` changed.

The sellable filter is applied with or without a session. Expired, flagged, and zero-quantity batches are excluded.

### Reservations

Reservations are advisory and not linked to orders yet. `reserveStock` and `releaseStock` maintain `reservedStock` and `availableStock` together, and over-release is rejected. Because sales do not yet honor reservations, reconciliation clamps `reservedStock` to `totalStock` if batch truth falls below outstanding reservations. `availableStock` is never persisted negative.

## 5. Validation and guard rails

| Guard | Where |
|---|---|
| Sufficient batch quantity | `deductBatchStock` conditional update; `StockMutationService` |
| Increase cannot exceed `quantityReceived` | `StockMutationService.increaseBatchStock` |
| Absolute quantity within `quantityReceived` | `StockMutationService.setBatchStock`, `BatchService.updateBatch` |
| Positive quantities | `StockMutationService` and controllers |
| Batch belongs to medicine | `StockMutationService`, `InventoryMovementService` |
| User exists | `InventoryMovementService` |
| Batch exists | `StockMutationService`, `InventoryMovementService` |
| One inventory row per medicine | unique index on `inventories.medicineId`; duplicate key → 409 |
| No deleting a batch with stock | `BatchService.deleteBatch` returns 409 |
| No deleting inventory with stock or reservations | `InventoryService.deleteInventory` returns 409 |
| No direct `currentStock` / `availableStock` updates | `InventoryService.updateInventory` returns 400 |

Remaining gaps:

- No idempotency: retrying a sale or receipt can duplicate effects unless the transaction failed outright.
- No optimistic locking on aggregate read-modify-write; MongoDB transaction conflicts abort writes, but there is no retry policy (Phase 5).
- `markExpiredBatches` changes the sellable set without syncing aggregates. The next mutation or `POST /inventory/:medicineId/sync` corrects it.
- A zero-stock batch can still be deleted while sale items or movements reference it. Sale deletion and GOOD returns for that batch then fail with 404.

## 6. Concurrency

### Sales

`findSellableBatches` and per-batch `findOneAndUpdate` run inside a transaction. The update filter requires `quantityRemaining >= requested`. If another transaction consumes the batch first, the update returns `null` and the service throws a conflict, aborting the sale. With `withTransaction`, MongoDB may retry the whole callback on transient write conflicts.

Residual races:

- A batch can expire between the read and the update; the update does not re-check expiry.
- `isExpired` can be set between read and update.
- The final `remaining > 0` check catches partial allocations and aborts.

### Aggregate operations

All aggregate mutations now run inside a transaction. Read-modify-write is still not conditionally guarded; concurrent calls rely on MongoDB write conflicts to abort rather than lost updates.

## 7. Low stock and expiry

### Low stock

Two unrelated definitions exist:

- Dashboard: `0 < availableStock <= medicine.reorderLevel`.
- `/batches/low-stock?threshold=N`: `0 < batch.quantityRemaining <= N`.

The first is medicine-level and uses the configured reorder level. The second is batch-level and uses a caller-supplied threshold. They can disagree.

### Expiry states

```text
expired by date:  expiryDate < now
flagged expired:  isExpired === true
disposable:       isExpired === true && quantityRemaining > 0
sellable:         quantityRemaining > 0 && expiryDate > now && !isExpired
```

A batch past its date but not yet flagged is excluded from sales and from `getTotalStock`. `GET /batches/expired` still returns it because that endpoint filters by date directly.

### Disposal

Disposal requires the flag to be set first (manual route or cron). `BatchService.confirmDisposal` writes the batch to zero, syncs the aggregate, and records one `EXPIRED` movement inside one transaction. Until disposal, flagged expired stock remains in the batch table but is excluded from `getTotalStock`.

## 8. Reconciliation checklist

Use this when diagnosing stock discrepancies:

1. Compare `Inventory.currentStock` with the sum of sellable batch quantities:
   - `GET /inventory/medicine/:medicineId`
   - `GET /batches/medicine/:medicineId/available`
2. Confirm there is exactly one inventory row for the medicine (unique index).
3. Confirm that expired, flagged, and zero-quantity batches are excluded.
4. Review recent `inventorymovements` (query the collection or use `/dashboard/recent-activity`).
5. Run `POST /inventory/:medicineId/sync` to correct aggregate drift. This writes an `ADJUSTMENT` movement for the delta.
6. Check for zero-stock batches that were deleted while referenced by sale items or movements.

## 9. Safe operations

- Prefer sales, receipts, returns, and disposal over manual adjustments.
- Use `POST /inventory/:medicineId/sync` for drift correction; it is the only operation that intentionally writes an `ADJUSTMENT` for a reconciliation delta.
- Use reserve/release for holds; do not edit `reservedStock` through `PATCH /inventory/:id`.
- Treat a duplicate-key error on inventory creation as a signal that the medicine already has an aggregate row.
- Dedupe existing `inventories.medicineId` rows before deploying the unique index:
  `npm --prefix server run inventory:dedupe -- --dry-run`, then run it without
  `--dry-run` and with `--sync-indexes` when ready.

## Related documents

- [Inventory data model](../database/inventory-data-model.md)
- [Stock movements](stock-movements.md)
- [FEFO/FIFO](fefo-fifo.md)
- [Inventory module](../modules/inventory.md)
- [Batches module](../modules/batches.md)
