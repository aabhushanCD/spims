# Stock Movements

## 1. Purpose

Every stock change leaves an `InventoryMovement` row. Movements are an audit trail; they are never replayed to rebuild stock. Batch quantities are the physical truth.

## 2. Record

`InventoryMovement` (`modules/inventory/model/inventoryMovement.model.ts`):

| Field | Meaning |
|---|---|
| `medicineId` | Medicine affected |
| `batchId` | Batch affected; optional for aggregate-only operations |
| `movementType` | `PURCHASE`, `SALE`, `RETURN`, `ADJUSTMENT`, `EXPIRED`, `RESERVE`, `RELEASE` |
| `quantity` | Positive magnitude; direction inferred from type |
| `referenceId` | Business document id (sale, return, purchase order, adjustment, batch) |
| `referenceType` | `PURCHASE_ORDER`, `PURCHASE`, `SALE`, `RETURN`, `SALES_RETURN`, `ADJUSTMENT`, `RESERVE`, `RELEASE`, `SYSTEM` |
| `performedBy` | User id |
| `remarks` | Free text |
| `createdAt`, `updatedAt` | Timestamps |

Indexes: `{ medicineId, createdAt: -1 }`, `{ batchId }`, `{ movementType }`, `{ referenceId }`.

## 3. What each type means

| Type | Used for | Quantity semantics |
|---|---|---|
| `PURCHASE` | Goods receipt, manual batch increase | Units added |
| `SALE` | Sale allocation | Units removed |
| `RETURN` | Customer return, GOOD return restoration, sale deletion | Units restored or written off |
| `ADJUSTMENT` | Batch adjustment, drift correction, inventory initialization | Absolute delta magnitude |
| `EXPIRED` | Disposal | Units disposed |
| `RESERVE` | Reservation | Units removed from availability |
| `RELEASE` | Reservation release | Units returned to availability |

There is no sign field. A consumer must join `movementType` with the operation to know whether stock went up or down. `RETURN` is ambiguous: it covers GOOD returns, non-GOOD write-offs, and sale deletion.

## 4. Reference types

| Reference | Used by |
|---|---|
| `SALE` | Sales, sale deletion |
| `RETURN` | Generic return flows |
| `SALES_RETURN` | Sales-return parent documents |
| `PURCHASE_ORDER` | Purchase receipts |
| `PURCHASE` | Direct batch creation |
| `ADJUSTMENT` | Disposal, batch adjustments, drift corrections |
| `RESERVE` / `RELEASE` | Reservation and release movements |
| `SYSTEM` | Fallback in `createMovement` when no type is supplied |

## 5. Coverage matrix

| Operation | Movement written? | Notes |
|---|---|---|
| Sale | Yes, one per batch | `referenceId` = sale id |
| Purchase receipt | Yes, one per received batch | Recorded by `StockMutationService.receiveStock` |
| Direct batch create | Yes, one per batch | Requires a movement context |
| Return GOOD | Yes, one per return line | Restores the original batch |
| Return DAMAGED/EXPIRED/OPENED | Yes, one per return line | Write-off; no stock restored |
| Sale deletion | Yes, one per restored item | Quantity = `quantity - returnedQuantity` |
| Disposal | Yes, one `EXPIRED` | Atomic with batch zero and aggregate sync |
| Manual increase/decrease | Yes | Batch id required |
| Reserve/release | Yes | Updates `reservedStock` and `availableStock` together |
| Batch deduct/increase/adjust | Yes | Routed through `StockMutationService` |
| Batch update with quantity change | Yes | One movement for the absolute delta |
| Drift correction (`POST /inventory/:medicineId/sync`) | Yes, when the delta is non-zero | `ADJUSTMENT` |
| Batch delete | No | No stock change (zero-stock batches only) |
| Inventory delete | No | Blocked while stock or reservations exist |
| Expiry flagging | No | Does not change quantity |

## 6. Example ledgers

### Sale of 8 units, 5 from batch A and 3 from batch B

| Type | Batch | Quantity | Reference |
|---|---|---|---|
| SALE | A | 5 | sale id |
| SALE | B | 3 | sale id |

Aggregate is synced once after both allocations.

### Purchase receipt of 100 units

| Type | Batch | Quantity | Reference |
|---|---|---|---|
| PURCHASE | new batch | 100 | PO id |

The batch is created with `quantityRemaining = quantityReceived`; one movement is written.

### GOOD return of 2 units

| Type | Batch | Quantity | Reference type |
|---|---|---|---|
| RETURN | original batch | 2 | `SALES_RETURN` |

The batch is restored and the aggregate is synced.

### DAMAGED return of 2 units

| Type | Batch | Quantity | Reference type |
|---|---|---|---|
| RETURN | original batch | 2 | `SALES_RETURN` |

The movement records the write-off. The batch and aggregate are unchanged.

### Disposal of 10 expired units

| Type | Batch | Quantity | Reference |
|---|---|---|---|
| EXPIRED | batch | 10 | batch id |

Batch, aggregate, and movement are committed in one transaction.

## 7. Audit gaps

1. **Sale deletion references a deleted sale.** The movement remains, but `referenceId` points at a missing document.
2. **No movement for expiry flagging.** The flag changes the sellable set without a movement; the next sync records the aggregate adjustment.
3. **No movement for a deleted zero-stock batch.** Deletion itself does not change stock, but references from sale items may become dangling.
4. **No reversal entries.** Corrections are new movements, not linked pairs.

## 8. Why the ledger cannot rebuild stock

To rebuild stock from movements you would need a starting balance per batch, signed direction, every change recorded, and no ambiguity. The ledger has none of those guarantees. The batch collection remains the physical truth for sellable stock.

## 9. Querying movements

There is no HTTP endpoint for movements. Options:

| Need | Method |
|---|---|
| Recent activity | `GET /dashboard/recent-activity?limit=N` (populates medicine, batch, user) |
| Per batch | not exposed; `GET /batches/:id/history` returns metadata, not movements |
| Per medicine | not exposed |
| Per reference | not exposed |

Repository helpers exist (`findAllByMedicineId`, `findAllByBatchId`, `findAllByReference`, `findRecent`) but are only used by `getRecentMovements`.

## 10. Design observations

- `batchId` is optional in the model, schema, and movement service; aggregate-only operations omit it.
- `StockMutationService` owns the movement boundary: batch methods sync without a context, then write exactly one movement.
- `referenceType` is a shared union in `modules/inventory/types/stockMovement.type.ts`.
- Movement `quantity` has no min/positive validator in the model schema, but `StockMutationService` rejects non-positive quantities.

## Related documents

- [Inventory data model](../database/inventory-data-model.md)
- [Inventory management](inventory-management.md)
- [Returns module](../modules/returns.md)
- [Reporting](../modules/reporting.md)
