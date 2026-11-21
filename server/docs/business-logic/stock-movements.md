# Stock Movements

## 1. Purpose

Every intended stock change should leave an `InventoryMovement` row. In practice, coverage is incomplete. This document defines the record, the movement types, and the gaps.

## 2. Record

`InventoryMovement` (`modules/inventory/model/inventoryMovement.model.ts`):

| Field | Meaning |
|---|---|
| `medicineId` | Medicine affected |
| `batchId` | Batch affected (required by the service, optional in schema) |
| `movementType` | `PURCHASE`, `SALE`, `RETURN`, `ADJUSTMENT`, `EXPIRED`, `RESERVE`, `RELEASE` |
| `quantity` | Normally a positive magnitude; direction inferred from type. No schema constraint enforces this. |
| `referenceId` | Business document id (sale, return, purchase order, adjustment, batch) |
| `referenceType` | `PURCHASE_ORDER`, `PURCHASE`, `SALE`, `RETURN`, `SALES_RETURN`, `ADJUSTMENT`, `RESERVE`, `RELEASE`, `SYSTEM` |
| `performedBy` | User id |
| `remarks` | Free text |
| `createdAt`, `updatedAt` | Timestamps |

Indexes: `{ medicineId, createdAt: -1 }`, `{ batchId }`, `{ movementType }`, `{ referenceId }`.

## 3. What each type means

| Type | Used for | Quantity semantics |
|---|---|---|
| `PURCHASE` | Goods receipt, manual increase | Units added |
| `SALE` | Sale allocation; manual decrease when `SALE` is requested | Units removed |
| `RETURN` | Sales return, sale deletion | Units restored (intent) |
| `ADJUSTMENT` | Inventory update/delete with context | Absolute delta magnitude |
| `EXPIRED` | Disposal and manual expired decreases | Units disposed |
| `RESERVE` | Reservation | Units removed from availability |
| `RELEASE` | Reservation release | Units returned to availability |

There is no sign field. A consumer must join `movementType` with the operation to know whether stock went up or down. `RETURN` is ambiguous: it is used for both customer returns and sale deletions.

## 4. Reference types

| Reference | Used by |
|---|---|
| `SALE` | Sales, sale deletion |
| `RETURN` | Damaged/expired/opened returns, generic returns |
| `SALES_RETURN` | Sales-return parent documents |
| `PURCHASE_ORDER` | Purchase receipts |
| `PURCHASE` | Manual increases and inventory creation defaults |
| `ADJUSTMENT` | Disposal, manual adjustments |
| `RESERVE` / `RELEASE` | Reservation and release movements |
| `SYSTEM` | Fallback in `createMovement` when no type is supplied |

All nine values are valid enum members, so GOOD returns no longer fail on the movement reference.

## 5. Coverage matrix

| Operation | Movement written? | Notes |
|---|---|---|
| Sale | Yes, one per batch | `referenceId` = sale id |
| Purchase receipt | Yes | On inventory creation: quantity = full total; on update: delta |
| Return GOOD | Yes, one per return line | Reference type `SALES_RETURN`; batch restoration is still Phase 4 work |
| Return DAMAGED/EXPIRED/OPENED | Yes, twice | Duplicate log per line (Phase 4) |
| Sale deletion | Yes, one per sale item | Stock added to aggregate only |
| Disposal | Yes, recorded as `EXPIRED` | Movement type follows the request |
| Manual increase/decrease | Yes | Requires movement context |
| Reserve/release | Yes | No `reservedStock` change |
| Batch deduct/increase | **No** | |
| Batch adjust | **No** | |
| Batch delete | **No** | |
| Batch create (direct) | **No** | |
| Inventory create without context | **No** | |
| Inventory delete without context | **No** | |
| Purchase receiving failure | Rolls back | Transaction |

## 6. Example ledgers

### Sale of 8 units, 5 from batch A and 3 from batch B

| Type | Batch | Quantity | Reference |
|---|---|---|---|
| SALE | A | 5 | sale id |
| SALE | B | 3 | sale id |

Aggregate is synced once after both allocations.

### Purchase receipt of 100 units

If inventory already exists:

| Type | Batch | Quantity | Reference |
|---|---|---|---|
| PURCHASE | new batch | 100 | PO id |

If inventory does not exist, `createInventory` logs one PURCHASE for the new total (which may include other batches).

### GOOD return of 2 units

| Type | Batch | Quantity | Reference type |
|---|---|---|---|
| RETURN | original batch | 2 | `SALES_RETURN` |

No batch increment.

### DAMAGED return of 2 units

| Type | Batch | Quantity | Reference type |
|---|---|---|---|
| RETURN | original batch | 2 | `RETURN` |
| RETURN | original batch | 2 | `RETURN` |

The batch is incremented once. Two records are written for one physical event.

### Disposal of 10 expired units

| Type | Batch | Quantity | Reference |
|---|---|---|---|
| EXPIRED | batch | 10 | batch id |

The movement type follows the request; disposal records `EXPIRED`.

## 7. Audit gaps

1. **Batch-level operations are invisible.** `POST /batches/:id/deduct`, `/increase`, and `/adjust` change stock without a movement.
2. **Direct batch creation is invisible.** Only purchase receiving syncs inventory and logs a movement.
3. **Duplicate return logs** inflate movement counts for damaged/expired/opened returns.
4. **Aggregate-only operations** produce movements that do not correspond to a batch change, so a batch-level reconciliation will not match the ledger.
5. **Sale deletion** logs `RETURN` against a deleted sale; `referenceId` points to a missing document.
6. **Cancelled purchase orders** leave no movement, which is correct, but there is no record of the cancellation itself.
7. **No movement for stock corrections** made through `PATCH /inventory/:id` unless a full context is supplied.
8. **No user attribution** for batch endpoints; `performedBy` is required, so those paths cannot log even if desired.

## 8. Why the ledger cannot rebuild stock

To rebuild stock from movements you would need:

- a starting balance per batch (not recorded),
- signed direction (not recorded),
- every change recorded (not true),
- no duplicates (not true for returns).

Therefore movements are an audit aid only. The batch collection is the physical truth for sellable stock.

## 9. Querying movements

There is no HTTP endpoint for movements. Options:

| Need | Method |
|---|---|
| Recent activity | `GET /dashboard/recent-activity?limit=N` (populates medicine, batch, user) |
| Per batch | not exposed; use `GET /batches/:id/history` (returns metadata, not movements) |
| Per medicine | not exposed |
| Per reference | not exposed |

Repository helpers exist (`findAllByMedicineId`, `findAllByBatchId`, `findAllByReference`, `findRecent`) but are only used by `getRecentMovements`.

## 10. Design observations

- The movement service validates medicine, batch ownership, and user on every write, which is good, but it also requires a batch for aggregate-only operations, forcing callers to supply one.
- The `referenceType` enum now covers every value passed by callers.
- Movement `quantity` has no min/positive validator in the schema.
- `InventoryMovementRepo.create` accepts any partial, so schema validation is the only guard.

## Related documents

- [Inventory data model](../database/inventory-data-model.md)
- [Inventory management](inventory-management.md)
- [Returns module](../modules/returns.md)
- [Reporting](../modules/reporting.md)
