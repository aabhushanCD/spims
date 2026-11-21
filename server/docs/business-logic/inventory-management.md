# Inventory Management

This document describes the stock rules as implemented, including known inconsistencies. It complements [Inventory data model](../database/inventory-data-model.md), which explains the records.

## 1. Two stock layers

| Layer | Record | Updated by |
|---|---|---|
| Physical batch stock | `Batch.quantityRemaining` | Sales, purchase receipt, returns, disposal, batch endpoints |
| Aggregate stock | `Inventory.currentStock` / `availableStock` | `syncInventoryFromBatch`, manual inventory endpoints, reserve/release |

`InventoryMovement` records events but is never replayed to rebuild stock.

The aggregate is supposed to be derived from batches:

```text
currentStock   = Σ quantityRemaining of sellable batches
availableStock = currentStock - reservedStock
```

`syncInventoryFromBatch` implements this, but only batch-first flows call it.

## 2. Sellable stock definition

A batch is sellable when:

```text
quantityRemaining > 0
AND expiryDate > now
AND isExpired === false
```

This is the filter in `findSellableBatches` (`modules/batch/repo/medicineBatch.repo.ts`), used by `sellMedicine`.

Inconsistencies:

- `BatchService.getAvailableBatches` omits the `isExpired` check.
- Smart reorder's usable-stock query filters only by expiry date, not `isExpired` or quantity > 0 (zero quantities add nothing, so only the flag is a gap).
- `Inventory.availableStock` is not recomputed when a batch expires; it changes only on the next sync or manual operation.

## 3. Stock operations

| Operation | Batch effect | Aggregate effect | Movement | Transaction |
|---|---|---|---|---|
| Sale | Deduct per FEFO batch | Sync | `SALE` per batch | Yes |
| Purchase receipt | Create batch | Sync/delta | `PURCHASE` | Yes |
| GOOD return | None | `+quantity` | `RETURN` | Yes |
| DAMAGED/EXPIRED/OPENED return | `+quantity` | Sync | 2 × `RETURN` | Yes |
| Sale deletion | None | `+quantity` per item | `RETURN` | Yes |
| Disposal | Set 0 | `-quantity` | `EXPIRED` (requested type preserved) | No |
| Manual increase | None | `+quantity` | `PURCHASE`/`RETURN` | No |
| Manual decrease | None | `-quantity` | requested `SALE`/`EXPIRED`/`ADJUSTMENT` | No |
| Reserve | None | `availableStock -quantity` | `RESERVE` | No |
| Release | None | `availableStock +quantity` | `RELEASE` | No |
| Batch deduct | `-quantity` | None | None | No |
| Batch increase | `+quantity` | None | None | No |
| Batch adjust | Set absolute | Sync | None | No |
| Batch delete | Remove | None | None | No |

## 4. Reconciliation behavior

`syncInventoryFromBatch(medicineId, movementCtx?, session?)`:

1. Load inventory by medicine.
2. Compute `totalStock = batchRepo.getTotalStock(medicineId, session)`.
3. If no inventory row exists:
   - Create one with `currentStock = totalStock`, `reservedStock = 0`, `availableStock = totalStock`.
   - If a movement context was supplied and total > 0, log a movement for the full total.
4. If a row exists:
   - Update `currentStock = totalStock`.
   - Set `availableStock = totalStock - reservedStock`.
   - If a movement context and a numeric `currentStock` are supplied, log the delta.

### Sellable filter

`getTotalStock` applies the same sellable filter whether or not a session is supplied (`modules/batch/repo/medicineBatch.repo.ts`):

```ts
const query = this.batchModel.find({
  medicineId,
  quantityRemaining: { $gt: 0 },
  expiryDate: { $gt: new Date() },
  isExpired: false,
});
if (session) query.session(session);
```

Both session-backed callers (sales, receipts) and `POST /inventory/:medicineId/sync` (no session) therefore compute the same sellable total. Expired, flagged, and zero-quantity batches are excluded.

### Other reconciliation gaps

- Manual increase/decrease change the aggregate without batches; the next sync will erase the difference.
- Batch deduct/increase/adjust do not sync (except adjust), so the aggregate lags until another flow syncs.
- Sale deletion restores the aggregate without batches; the next sync erases the restoration.

## 5. Validation and guard rails

| Guard | Where |
|---|---|
| Sufficient batch quantity | `deductBatchStock` conditional update |
| Sufficient available aggregate | `decreaseStock`, `reserveStock` |
| Positive sale quantity | `sellMedicine` and Zod |
| Batch belongs to medicine | `InventoryMovementService`, `returnMedicine` |
| User exists | `InventoryMovementService` |
| Batch exists | `InventoryMovementService`, `returnMedicine` |
| Non-negative batch quantity | schema `min: 0` (skipped on some updates) |

Missing guards:

- No idempotency: retrying a sale or receipt can duplicate effects unless the transaction failed outright.
- No optimistic locking on aggregate read-modify-write (lost updates possible under concurrency).
- No guard against deleting a batch with stock.
- No guard against deleting an inventory row with stock (only a log if context is supplied).
- No check that `medicineId` exists on `POST /inventory`.

## 6. Concurrency

### Sales

`findSellableBatches` and per-batch `findOneAndUpdate` run inside a transaction. The update filter requires `quantityRemaining >= requested`. If another transaction consumes the batch first, the update returns `null` and the service throws a conflict, aborting the sale. With `withTransaction`, MongoDB may retry the whole callback on transient write conflicts.

Residual races:

- A batch can expire between the read and the update; the update does not re-check expiry.
- `isExpired` can be set between read and update.
- The final `remaining > 0` check catches partial allocations and aborts.

### Aggregate operations

`increaseStock`, `decreaseStock`, `reserveStock`, and `releaseReservedStock` use read-modify-write without a session or conditional update. Two concurrent calls can lose an update.

### Disposal

Two writes (batch to 0, aggregate decrease) are not transactional. A failure after zeroing the batch but before the aggregate update leaves stock understated.

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

A batch past its date but not yet flagged is excluded from sales and from both `getTotalStock` branches (the date filter applies), but `GET /batches/expired` still returns it because that endpoint filters by date directly.

### Disposal

Disposal is the only flow that writes off expired stock. It requires the flag to be set first (manual route or cron). Until disposal, flagged expired stock remains in the batch table but is excluded from `getTotalStock` and therefore from syncs.

## 8. Reserved stock

`reservedStock` is effectively dead:

- Reserve reduces `availableStock` but never increments `reservedStock`.
- Release increases `availableStock` but never decrements it.
- Sync computes `availableStock = currentStock - reservedStock`, so a non-zero `reservedStock` would only exist if written directly through `PATCH /inventory/:id`.

Status: **Partially Implemented**. Do not rely on reservation for order holds.

## 9. Data integrity checklist

Use this when diagnosing stock discrepancies:

1. Compare `Inventory.currentStock` with the sum of sellable batch quantities:
   - `GET /inventory/medicine/:medicineId`
   - `GET /batches/medicine/:medicineId/available`
2. Check for duplicate inventory rows for the medicine (no unique index).
3. Confirm that expired/flagged batches are excluded from the sync total (they should be, in both session and non-session calls).
4. Review recent `inventorymovements` for the medicine (no HTTP endpoint; query the collection or use `/dashboard/recent-activity`).
5. Check whether a GOOD return or sale deletion was applied to the aggregate only.
6. Check whether batch deduct/increase was used without a sync.

## 10. Recommendations for safe operations

These are operational notes, not changes to the code:

- Prefer sales/receipts over manual inventory adjustments; they keep both layers aligned.
- After any manual inventory or batch operation, verify the batch sum.
- `POST /inventory/:medicineId/sync` now uses the sellable filter with or without a session.
- Treat `reservedStock` as informational only.

## Related documents

- [Inventory data model](../database/inventory-data-model.md)
- [Stock movements](stock-movements.md)
- [FEFO/FIFO](fefo-fifo.md)
- [Inventory module](../modules/inventory.md)
- [Batches module](../modules/batches.md)
