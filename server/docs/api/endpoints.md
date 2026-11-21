# Endpoint Reference

Complete reference for every route registered in the backend.

## Conventions

- **Base path:** `/api`
- **Auth:** "Cookie JWT" means the request must carry the `token` cookie. Roles are enforced at the router mount (`app.routes.ts`).
- **Roles:** unless stated otherwise, `owner`, `inventory_manager`, and `pharmacist` are all allowed.
- **Validation:** `validate`, `validateParams`, and `validateQuery` run before controllers on the routes listed below. Malformed ObjectIds are rejected with `400` instead of reaching Mongoose; a global `CastError` mapper is the safety net.
- **Errors:** all endpoints can return `401`, `403`, `500`, and (for unknown paths) `404`. Only endpoint-specific errors are listed.
- **Source paths** are relative to the repository root.
- **Pagination:** paginated list endpoints accept `cursor` and `limit` (default 20, max 100) and return `data: { items, nextCursor }`. Pass `nextCursor` as the next `cursor`; `null` means the end.
- Route handlers that `throw new Error(...)` from a service (batch module) become **500**, not 404/400.

## Auth

Source: `server/src/modules/auth/routes/auth.route.ts`

| Method | Path | Purpose | Auth / roles | Body / query | Validation | Success |
|---|---|---|---|---|---|---|
| POST | `/auth/register` | Create a local user | Public | `name`, `email`, `password` (`role` is stripped) | `registerSchema` | `201` raw user (includes password hash) |
| POST | `/auth/login` | Authenticate and set cookie | Public | `email`, `password` | `loginSchema` | `200` raw user + `token`; sets `token` cookie |
| POST | `/auth/logout` | Clear cookie | Cookie JWT / any | — | — | `200` `{ message }` |
| GET | `/auth/me` | Current user | Cookie JWT / any | — | — | `200` raw user (includes password hash) |

Endpoint-specific errors: `400` validation, `401` wrong password, `404` user not found, `409` duplicate email.

Details: [authentication.md](authentication.md).

## Users

Source: `server/src/modules/user/routes/user.route.ts`

Router-level roles: **`owner`, `pharmacist` only**. Every write route also requires `owner`. ObjectId params are validated before controllers run.

| Method | Path | Purpose | Body / params / query | Success | Notes |
|---|---|---|---|---|---|
| POST | `/users` | Create user | `name`, `email`, `password`, `role` | `201` public user | Owner only; `createUserSchema`; bcrypt hash applied |
| GET | `/users` | List users | `cursor?`, `limit?`, `search?`, `role?`, `isActive?` | `200` `{ success, data: { items, nextCursor } }` | Paginated |
| GET | `/users/:id` | Get user | ObjectId `id` | `200` public user / `404` | |
| PUT | `/users/:id` | Update user | partial user fields | `200` public user / `404` | Owner only; `updateUserSchema`; password is bcrypt-hashed |
| DELETE | `/users/:id` | Delete user | no body | `200` `{ message }` | Owner only; JWT role is authoritative; a body `{ role }` is rejected |
| GET | `/users/role/:role` | Users by role | `owner` / `pharmacist` / `inventory_manager` | `200` array | |
| GET | `/users/status/:isActive/last-login/:date` | Filter | `true`/`false`, parseable `date` | `200` array | Reads path params |
| GET | `/users/role/:role/last-login/:date` | Filter | `role`, `date` | `200` array | |
| GET | `/users/role/:role/status/:isActive` | Filter | `role`, `true`/`false` | `200` array | Reads path params |
| GET | `/users/active` | Active users | — | `200` array | Registered before `GET /users/:id` |
| GET | `/users/inactive` | Inactive users | — | `200` array | Replaces the misleading `GET /users/:id/inactive` |
| GET | `/users/last-login/:date` | Users since date | `date` | `200` array | |
| PATCH | `/users/:id/toggleUserActivation` | Toggle `isActive` | ObjectId `id` | `200` `{ message }` / `404` | Owner only |
| PATCH | `/users/:id/role` | Change role | `{ role }` | `200` public user | Owner only; matches the client service call |

Details: [users-and-roles.md](../modules/users-and-roles.md).

## Medicines

Source: `server/src/modules/medicine/routes/medicine.route.ts`

| Method | Path | Purpose | Body / query | Validation | Success |
|---|---|---|---|---|---|
| POST | `/medicines` | Create medicine | catalog fields | `createMedicineSchema` | `201` raw medicine |
| GET | `/medicines` | List with inventory | `cursor?`, `limit?`, `search?`, `isActive?`, category/brand/generic/unit ids | `medicineListQuerySchema` | `200` `{ success, data: { items, nextCursor } }` |
| GET | `/medicines/search` | Literal substring search | `?query=` | `medicineSearchQuerySchema` | `200` active matches |
| GET | `/medicines/:id` | Get one | ObjectId `id` | param schema | `200` raw / `404` |
| PUT | `/medicines/:id` | Update | partial catalog fields | param + `updateMedicineSchema` | `200` raw / `404` |
| DELETE | `/medicines/:id` | Deactivate | ObjectId `id` | param schema | `200` `{ message }`; sets `isActive: false` |

Create errors: `400` validation, `404` missing brand/category/generic/unit, `409` duplicate barcode or name+strength+brand.
Search escapes regex metacharacters and returns active medicines only.

## Units

Source: `server/src/modules/medicine/routes/unit.route.ts`

| Method | Path | Purpose | Body | Validation | Success |
|---|---|---|---|---|---|
| POST | `/units` | Create | `name`, `description`, `isActive?` | `CreateUnitSchema` | `201` raw unit |
| GET | `/units` | List | — | — | `200` array |
| GET | `/units/:id` | Get | — | — | `200` / `404` |
| PUT | `/units/:id` | Update | partial | `UpdateUnitSchema` | `200` / `404` |
| DELETE | `/units/:id` | Delete | — | — | `200` `{ message }` / `404` |

The router also calls `verifyToken` per route (redundant with the mount). ObjectId params are validated. `DELETE` returns `409` when a medicine references the unit.

## Categories

Source: `server/src/modules/medicine/routes/category.route.ts`

| Method | Path | Purpose | Body | Validation | Success |
|---|---|---|---|---|---|
| POST | `/categories` | Create | `name`, `description?`, `isActive?` | `createCategorySchema` | `201` raw category |
| GET | `/categories` | List | — | — | `200` array |
| GET | `/categories/:id` | Get | — | — | `200` / `404` |
| PUT | `/categories/:id` | Update | partial | `updateCategorySchema` | `200` / `404` |
| DELETE | `/categories/:id` | Delete | — | — | `200` `{ message }` / `404` |

`updateCategorySchema` accepts and strips an unused `updatedBy` field. ObjectId params are validated, and `DELETE` returns `409` when referenced by a medicine.

## Brands

Source: `server/src/modules/medicine/routes/brand.route.ts`

| Method | Path | Purpose | Body | Validation | Success |
|---|---|---|---|---|---|
| POST | `/brands` | Create | `name`, `description` (required), `isActive?` | `CreateBrandSchema` | `201` raw brand |
| GET | `/brands` | List | — | — | `200` array |
| GET | `/brands/:id` | Get | — | — | `200` / `404` |
| PUT | `/brands/:id` | Update | partial | `UpdateBrandSchema` | `200` / `404` |
| DELETE | `/brands/:id` | Delete | — | — | `200` `{ message }` / `404` |

Duplicate name → `409`. ObjectId params are validated, and deleting a referenced brand returns `409`.

## Generic names

Source: `server/src/modules/medicine/routes/genericName.route.ts`

| Method | Path | Purpose | Body | Validation | Success |
|---|---|---|---|---|---|
| POST | `/generic-names` | Create | `name`, `description` (required), `isActive?` | `CreateGenericNameSchema` | `201` raw record |
| GET | `/generic-names` | List | — | — | `200` array |
| GET | `/generic-names/:id` | Get | — | — | `200` / `404` |
| PUT | `/generic-names/:id` | Update | partial | `UpdateGenericNameSchema` | `200` / `404` |
| DELETE | `/generic-names/:id` | Delete | — | — | `200` `{ message }` / `404` |

Duplicate name → `409` (service pre-check and index). ObjectId params are validated, and deleting a referenced generic name returns `409`.

## Suppliers

Source: `server/src/modules/supplier/routes/supplier.route.ts`

All responses use `{ success, message, data }`.

| Method | Path | Purpose | Body | Validation | Success |
|---|---|---|---|---|---|
| GET | `/suppliers` | List | — | — | `200` `{ success, message, data: array }` |
| GET | `/suppliers/:id` | Get | — | — | `200` `{ success, message, data }`; `400` invalid id; `404` |
| POST | `/suppliers` | Create | `companyName`, `contactPerson`, `email`, `phone`, `address`, `leadTime`, `status?` | `createSupplierSchema` | `201` `{ success, message, data }`; `409` duplicate email/phone |
| PUT | `/suppliers/:id` | Update | partial | `updateSupplierSchema` | `200`; `400`, `404`, `409` |
| DELETE | `/suppliers/:id` | Delete | — | — | `200` `{ success, message, data: deleted }`; `400`, `404` |

`reliabilityScore` cannot be set through the API (the Zod schema strips it). Delete returns `409` while the supplier has `pending` or `approved` purchase orders.

## Purchases

Source: `server/src/modules/purchase/routes/purchase.route.ts`, `services/purchaseOrder.service.ts`

The router applies `verifyToken` again (redundant). Mount roles: all three.

### Purchase order endpoints

| Method | Path | Purpose | Body / query | Validation | Success |
|---|---|---|---|---|---|
| POST | `/purchases` | Create PO with items | see below | `createPurchaseOrderSchema` | `201` `{ message, data: PO }` |
| GET | `/purchases` | List POs | `cursor?`, `limit?`, `search?`, `status?`, `supplierId?`, `from?`, `to?` | query schema | `200` `{ message, data: { items, nextCursor } }` |
| GET | `/purchases/:id` | PO detail with items | — | — | `200` `{ message, data: { supplier, items[], ... } }`; `404` |
| DELETE | `/purchases/:id` | Hard delete PO + items | — | — | `200` `{ message }`; `404`; `409` if received or batches exist |
| PATCH | `/purchases/:id/cancel` | Cancel | — | — | `200` `{ message }`; `400` if received; `404` |
| PATCH | `/purchases/:id/approve` | Approve | — | — | `200` `{ message }`; `400` if not pending or empty; `404` |
| POST | `/purchases/:id/receive` | Receive goods and create batches | `items[]` | param + `receivePurchaseOrderSchema` | `200` `{ message, data: { message } }` |
| PATCH | `/purchases/:id/recalculate` | Recompute and persist total | — | — | `200` `{ message, data: { subtotal, discount, taxable, vatAmount, totalAmount } }` |
| GET | `/purchases/:id/items` | List items | — | — | `200` `{ message, data: items[] }`; `404` PO |
| GET | `/purchases/supplier/:supplierId` | POs for supplier | — | — | `200` `{ message, data }`; `404` supplier |

#### Create body

```json
{
  "supplierId": "665f...",
  "orderDate": "2026-02-01",
  "expectedDeliveryDate": "2026-02-05",
  "invoiceNumber": "SUP-INV-1001",
  "invoiceFile": "",
  "receivedDate": "2026-02-01",
  "discount": 0,
  "VAT": 13,
  "items": [
    { "medicineId": "665f...", "quantity": 100, "purchasePrice": 12.5 }
  ]
}
```

Schema notes:

- `expectedDeliveryDate` and `receivedDate` are optional.
- `status` is **not accepted** on create; every order starts `pending`. A supplied
  `status` is stripped by the schema.
- `VAT` is a percentage (0–100, default 13). `discount` is an absolute amount.
- `totalAmount = subtotal - discount + VAT% of (subtotal - discount)` and is
  persisted; a discount larger than the subtotal returns `400`.
- `recalculate` and item add/update/remove persist the recalculated total.

#### Receive body

```json
{
  "items": [
    {
      "medicineId": "665f...",
      "batchNumber": "BATCH-01",
      "manufacturingDate": "2025-06-01",
      "expiryDate": "2027-06-01",
      "sellingPrice": 18,
      "quantityReceived": 100,
      "remarks": ""
    }
  ]
}
```

Receive rules:

1. PO must exist and be `approved`.
2. PO must have items.
3. Request items must be unique by `medicineId`.
4. Item count must exactly equal the PO item count.
5. Every PO medicine must appear.
6. `quantityReceived` must equal the ordered quantity.
7. `sellingPrice >= purchasePrice` (no equality restriction beyond that).
8. One batch is created per PO item; aggregate inventory is synced in the same transaction.
9. PO becomes `received` with `receivedDate = now`.

No partial receiving, over-receiving, or batch splitting is supported.

Errors: `400` for each rule above, `404` PO/user/supplier, `500` for batch validation failures or duplicate batch numbers.

### Purchase item endpoints

| Method | Path | Purpose | Body | Validation | Success |
|---|---|---|---|---|---|
| POST | `/purchases/:id/items` | Add item | `medicineId`, `quantity`, `purchasePrice` | param + `createPurchaseOrderItemSchema` | `201` `{ message, data }` |
| PATCH | `/purchases/:id/items/:itemId` | Update item | `quantity?`, `purchasePrice?` | param + `updatePurchaseOrderItemSchema` | `200` `{ message, data }` |
| DELETE | `/purchases/:id/items/:itemId` | Remove item | — | param schemas | `200` `{ message }` |

- The path supplies `purchaseOrderId`; the client does not send it.
- Items can be added/updated/removed only while the PO is `pending`.
- Duplicate medicine in the same PO → `400`.
- Mismatched `itemId`/`purchaseOrderId` → `400`.
- Add/remove recalculates `totalAmount`; **update does not**.

Details: [purchases.md](../modules/purchases.md).

## Inventory

Source: `server/src/modules/inventory/routes/inventory.routes.ts`

Body, ObjectId-param, and search-query schemas are wired. All responses are `{ success, data }` unless noted.

| Method | Path | Purpose | Body / query | Success | Notes |
|---|---|---|---|---|---|
| POST | `/inventory` | Create aggregate row from batch truth | `medicineId`, `reservedStock?`, optional movement context | `201` `{ success, data }` | Strict schema; `currentStock`/`availableStock` are rejected; duplicate medicine → `409` |
| GET | `/inventory` | List | `cursor?`, `limit?`, `search?`, `stockStatus?`, `medicineId?` | `200` `{ success, data: { items, nextCursor } }` | Medicine populated |
| GET | `/inventory/movements` | Movement history | `cursor?`, `limit?`, medicine/batch/reference ids, type, date range | `200` `{ success, data: { items, nextCursor } }` | Populates medicine, batch, performer |
| GET | `/inventory/movements/:id` | Movement detail | ObjectId `id` | `200` / `404` | |
| GET | `/inventory/:id` | Get | ObjectId `id` | `200` / `404` | |
| GET | `/inventory/medicine/:medicineId` | Get by medicine | ObjectId `medicineId` | `200` / `404` | |
| GET | `/inventory/medicines/search` | Sellable medicine search | `?query=` | `200` | Requires `availableStock > 0`; active medicines only; escaped regex |
| POST | `/inventory/:medicineId/increase` | Increase batch + aggregate | `quantity` > 0, `batchId`, `referenceId`, `referenceType`, `movementType`, `remarks?` | `200` | `movementType` must be `PURCHASE` or `RETURN`; `409` if above `quantityReceived` |
| POST | `/inventory/:medicineId/decrease` | Decrease batch + aggregate | same | `200` | `movementType` must be `SALE`, `EXPIRED`, or `ADJUSTMENT`; `409` insufficient batch stock |
| POST | `/inventory/:medicineId/reserve` | Increase reserved, reduce available | `quantity` > 0, `batchId?`, `referenceId`, `referenceType`, `remarks?` | `200` | Maintains `reservedStock`; `400` if over available |
| POST | `/inventory/:medicineId/release` | Reduce reserved, restore available | same | `200` | `400` if releasing more than reserved |
| POST | `/inventory/:medicineId/sync` | Recompute aggregate from batches | `remarks?` | `200` | Writes one `ADJUSTMENT` for the delta; uses the sellable filter |
| PATCH | `/inventory/:id` | Update reservation only | `reservedStock`, `lastUpdated?` | `200` / `400` / `404` | Strict schema; derived stock fields are rejected |
| DELETE | `/inventory/:id` | Delete aggregate | optional movement context | `200` `{ success, message }` / `404` / `409` | Blocked while stock or reservations exist |

Every inventory stock mutation updates the batch, recomputes the aggregate, and writes one movement in one transaction. `PATCH /inventory/:id` only changes `reservedStock` and writes no movement; use the reserve/release endpoints for audited holds. See [Inventory data model](../database/inventory-data-model.md).

> **Movement enum:** `referenceType` accepts `PURCHASE_ORDER`, `PURCHASE`, `SALE`, `RETURN`, `SALES_RETURN`, `ADJUSTMENT`, `RESERVE`, `RELEASE`, and `SYSTEM`. The service defaults for manual increase (`PURCHASE`), reserve (`RESERVE`), and release (`RELEASE`) are valid enum members.
>
> **Movement type:** `decreaseStock` records the requested `SALE`, `EXPIRED`, or `ADJUSTMENT` type.

## Sales

Source: `server/src/modules/sales/routes/sales.routes.ts`, `services/sales.service.ts`

### Create sale

`POST /sales`

Body (`createSaleSchema`):

```json
{
  "customerName": "Walk-in Customer",
  "paymentMethod": "CASH",
  "saleDate": "2026-02-10T10:30:00.000Z",
  "discount": 25,
  "items": [
    {
      "medicineId": "665f...",
      "quantity": 3,
      "discountPercentage": 5
    }
  ]
}
```

| Field | Rules |
|---|---|
| `customerName` | trimmed, 1–100 |
| `paymentMethod` | `CASH`, `CARD`, `QR`, `Mobile Banking`, `CREDIT` |
| `saleDate` | coerced date |
| `discount` | number ≥ 0, default 0; absolute invoice discount |
| `items` | min 1 |
| `items[].medicineId` | non-empty string |
| `items[].batchId` | optional ObjectId; FEFO chooses the batch |
| `items[].quantity` | integer > 0 |
| `items[].discountPercentage` | number 0–100, default 0 |

`cashierId` comes from the JWT and cannot be supplied by the client.

Success: `201` `{ success: true, data: sale }`. The returned sale is reloaded **without** its items.

Errors: `400` empty cart, invalid discount, invoice discount greater than the
post-line-discount subtotal, insufficient stock; `401` missing user; `500`
transaction or validation failure.

Behavior:

- Duplicate `medicineId` lines are merged; the highest `discountPercentage` is kept.
- The sale is created with `status: "COMPLETED"` and zero totals, then updated inside the same transaction.
- Allocations and per-batch `SalesItem` rows are created by `InventoryService.sellMedicine`.
- Prices come from each batch's `sellingPrice`; client-supplied prices are ignored.
- VAT is 13% of `subtotal - line discounts - invoice discount`; the invoice
  discount cannot exceed `subtotal - line discounts`.
- Line discounts, line totals, and sale totals are rounded to two decimals.
- Payment method is recorded but no payment transaction is created.

### Other sale endpoints

| Method | Path | Purpose | Body | Success |
|---|---|---|---|---|
| GET | `/sales` | List sales | `cursor?`, `limit?`, `search?`, `status?`, `cashierId?`, `from?`, `to?` | `200` `{ success, data: { items, nextCursor } }` | Cashier populated |
| GET | `/sales/:id` | Sale + items | — | `200` `{ success, data: { ...sale, items } }` / `404` |
| PATCH | `/sales/:id` | Edit customer/payment | `customerName?`, `paymentMethod?` | `200` `{ success, data }` / `404` |
| DELETE | `/sales/:id` | Delete and restore stock | — | `200` `{ success, message }` / `404` / `409` if returns exist |

`updateSaleSchema` accepts `customerName` and/or `paymentMethod`; empty updates return `400`. Financial fields and quantities cannot be edited through this endpoint. ObjectId params are validated.

Delete restores `quantity - returnedQuantity` to the original batch, syncs the aggregate, and writes one `RETURN` movement per restored item. A sale with `PENDING`, `APPROVED`, or `COMPLETED` returns cannot be deleted (`409`). See [Sales](../modules/sales.md).

## Sale items

Source: `server/src/modules/sales/routes/saleItem.routes.ts`

| Method | Path | Purpose | Body | Success |
|---|---|---|---|---|
| GET | `/sale-items` | List all | — | `200` `{ success, data }` |
| GET | `/sale-items/sales/:salesId` | Items for sale | — | `200` `{ success, data }` |
| GET | `/sale-items/:id` | Get item | — | `200` / `404` |
| PATCH | `/sale-items/:id` | Price/discount correction | `unitPrice?`, `discount?` (at least one) | `200`; `400` invalid; `404`; `409` if returned |

A correction recomputes the line `totalPrice` and the parent sale's `subTotal`,
`discount`, `VAT`, and `totalAmount`. The invoice-level discount is derived from
the stored sale total and preserved. Lines with `returnedQuantity > 0` cannot be
corrected. No create or delete routes; items are created only by `SalesService`.

## Returns

Source: `server/src/modules/sales/routes/return.routes.ts`, `services/return.service.ts`

### Create return

`POST /returns` runs `CreateReturnSchema`; `salesId`, `saleItemId`, and `returnedBy` are validated as ObjectIds.

```json
{
  "salesId": "665f...",
  "returnReason": "Customer changed medication",
  "returnedBy": "665f...",
  "returnDate": "2026-02-11T09:00:00.000Z",
  "items": [
    { "saleItemId": "665f...", "quantity": 1, "condition": "GOOD", "remarks": "unopened" }
  ]
}
```

`performedBy` is not accepted from the client; the controller supplies the JWT user for movement attribution.

The route validates the body and items; the controller checks that a user is authenticated.

Service rules (creation):

1. Sale must exist.
2. `returnDate` must not be before `saleDate`.
3. Each `saleItemId` must belong to the sale.
4. Requested quantity must not exceed
   `quantity - returnedQuantity - outstanding PENDING/APPROVED quantities`.
5. The return is stored as `PENDING` with a refund quote and embedded lines.
   **No stock or `returnedQuantity` changes happen at creation.**
6. Duplicate lines are merged only when both `saleItemId` and `condition` match.

Success: `201` `{ success: true, data: return }`.

Errors: `400` empty items, invalid sale item, over-commit, bad date; `404` sale.

### Return lifecycle

```text
PENDING ──approve──> APPROVED ──complete──> COMPLETED
   ├────reject──────> REJECTED
   └────cancel──────> CANCELLED
```

| Method | Path | Roles | Behaviour |
|---|---|---|---|
| GET | `/returns` | all three | Cursor list with `status`, `salesId`, `search`, `from`, `to` filters |
| GET | `/returns/:id` | all three | Detail |
| PATCH | `/returns/:id` | all three | Update `returnReason`; only while `PENDING` |
| PATCH | `/returns/:id/approve` | owner, inventory_manager | `PENDING → APPROVED` |
| PATCH | `/returns/:id/reject` | owner, inventory_manager | `PENDING → REJECTED` |
| PATCH | `/returns/:id/cancel` | all three | `PENDING → CANCELLED` |
| PATCH | `/returns/:id/complete` | all three | `APPROVED → COMPLETED`; applies stock and refund |

Invalid transitions return `409`; an unknown return returns `404`.

Completion:

- Re-validates each line against the current `returnedQuantity`.
- One movement per return line:
  - `GOOD` restores the original batch and syncs the aggregate.
  - `DAMAGED`/`EXPIRED`/`OPENED` write one `RETURN` movement and do **not**
    increase sellable stock.
- Increments each sale item's `returnedQuantity`.
- Recomputes the final refund and persists `returnItems.VAT` and `remarks`.
- Sets the sale to `RETURNED` or `PARTIALLY_RETURNED`.

Refund per line:

```text
lineDiscountShare  = saleItem.discount / saleItem.quantity × quantity
netBeforeInvoice   = gross − lineDiscountShare
invoiceShare       = invoiceDiscount × netBeforeInvoice / Σ(all line net values)
totalDiscountShare = lineDiscountShare + invoiceShare
net                = gross − totalDiscountShare
VAT                = net × 13%
refundAmount       = net + VAT
```

Invoice-level discounts are apportioned by returned net value, so refunds do
not exceed the net amount paid.

No DELETE. Reversing a completed return is not implemented.

## Batches

Source: `server/src/modules/batch/routes/batch.routes.ts`

Body, ObjectId-param, and low-stock-query schemas are wired. Responses are `{ success, data }` or `{ success, message }`.

| Method | Path | Purpose | Input | Success | Notes |
|---|---|---|---|---|---|
| GET | `/batches` | Paginated list | `cursor?`, `limit?`, `search?`, `medicineId?`, `isExpired?`, `isActive?`, `expiringInDays?` | `200` `{ success, data: { items, nextCursor } }` | Medicine name populated |
| GET | `/batches/:id` | Get batch | ObjectId `id` | `200` / `404` | Missing → `404` |
| POST | `/batches` | Create batch | validated batch body + optional movement context | `201` | Requires authenticated user; PO must exist; syncs aggregate and writes `PURCHASE` |
| PATCH | `/batches/:id` | Update allowed fields | `batchNumber`, dates, prices, `quantityRemaining`, `isActive` | `200` / `400` / `404` | Immutable fields rejected; quantity changes sync + movement |
| DELETE | `/batches/:id` | Delete a zero-stock batch with no sales or movement history | ObjectId `id` | `200` / `404` / `409` | `409` while `quantityRemaining > 0`, or sale items/movement records reference it |
| GET | `/batches/medicine/:medicineId` | All batches for medicine | ObjectId `medicineId` | `200` / `404` | Returns a list, newest first |
| GET | `/batches/medicine/:medicineId/available` | Sellable batches | ObjectId `medicineId` | `200` | Filters quantity > 0, expiry > now, and `!isExpired` |
| GET | `/batches/expired` | Batches past expiry date | — | `200` | Date-based, ignores `isExpired` |
| GET | `/batches/expired/awaiting-disposal` | Flagged with stock | — | `200` | `isExpired && quantityRemaining > 0` |
| GET | `/batches/low-stock?threshold=` | Per-batch low stock | threshold ≥ 0, default 10 | `200` | `0 < quantityRemaining <= threshold` |
| POST | `/batches/mark-expired` | Flag expired batches | — | `200` `{ message }` | No movements; sync aggregates on the next mutation or sync call |
| POST | `/batches/:id/deduct` | Decrement | positive whole `quantity` + `remarks?` | `200` / `409` | Atomic batch + aggregate + movement |
| POST | `/batches/:id/increase` | Increment | positive whole `quantity` + `remarks?` | `200` / `409` | Rejects above `quantityReceived` |
| POST | `/batches/:id/adjust` | Set absolute quantity | non-negative whole `quantity` + `remarks?` | `200` / `400` | Must be within `quantityReceived`; syncs + movement |
| GET | `/batches/:id/history` | Batch metadata + movements | ObjectId `id` | `200` / `404` | Movements newest first |
| POST | `/batches/:id/confirm-disposal` | Dispose expired stock | `remarks?` | `200` / `400` / `404` | Requires `isExpired` and quantity > 0; batch + aggregate + movement are atomic |

Important: the destructive `GET /batches/medicine/:medicineId/allocate` endpoint and its client stub were removed. Sales allocate FEFO stock through `InventoryService.sellMedicine`.

Details: [batches.md](../modules/batches.md).

## Smart reorders

Source: `server/src/modules/smartReorder/routes/smartReorder.routes.ts`

Router-level roles: all three. Additional checks:

- `POST /smart-reorders/generate` and `/generate/:medicineId`: `owner`, `inventory_manager`.
- `DELETE /smart-reorders/:id`: `owner`.

| Method | Path | Purpose | Input | Success | Notes |
|---|---|---|---|---|---|
| GET | `/smart-reorders` | List recommendations | — | `200` `{ success, data }` | Repository filters to `PENDING` when no session |
| GET | `/smart-reorders/pending` | Pending list | — | `200` | |
| GET | `/smart-reorders/medicine/:medicineId` | By medicine | — | `200`; `404` medicine | Multiple recommendations possible |
| GET | `/smart-reorders/:id` | Detail | — | `200`; `404` | |
| PATCH | `/smart-reorders/:id/approve` | Approve | — | `200`; `400` if not pending; `404` | Status change only |
| PATCH | `/smart-reorders/:id/reject` | Reject | — | `200`; `400` if not pending; `404` | Status change only |
| POST | `/smart-reorders/generate` | Generate for all medicines | body ignored | `200` `{ results[] }` | Each item: `created` or `skipped` (with `reason`) |
| POST | `/smart-reorders/generate/:medicineId` | Generate one | — | `201` recommendation | `400` not below ROP (cache miss) or no purchase history; `404` medicine; cached negative result returns `201` with `reorderNeeded: false` |
| DELETE | `/smart-reorders/:id` | Delete | — | `200` `{ message }`; `404` | Owner only |

`generate` accepts but ignores `threshold` and `targetStock`.

Details: [smart-reorder.md](../modules/smart-reorder.md).

## Notifications

Source: `server/src/modules/notification/routes/notification.routes.ts`

| Method | Path | Purpose | Body / Query | Success |
|---|---|---|---|---|
| GET | `/notifications/me` | Current user's inbox | `cursor`, `limit` | `200` `{ success, data: { items, nextCursor, unreadCount } }` |
| GET | `/notifications/user/:userId` | Another user's inbox (role hierarchy) | `cursor`, `limit` | `200`; `403` lower role; `404` target |
| POST | `/notifications` | Create + dispatch | `title`, `message`, `type`, `userIds[]` | `201` `{ success, data: notification }` |
| GET | `/notifications` | List all notifications | `cursor`, `limit` | `200` `{ success, data: { items, nextCursor } }` |
| GET | `/notifications/:id` | Detail + recipients (owner/pharmacist) | — | `200`; `403`; `404` |
| POST | `/notifications/:id/dispatch` | Dispatch eligible recipients (owner/pharmacist) | `force=true\|false\|1\|0` | `200` `{ success, data }`; `404` |
| POST | `/notifications/:id/retry` | Forced retry of failed recipients (owner/pharmacist) | — | `200` `{ success, data }`; `404` |
| PATCH | `/notifications/me/:id/read` | Mark one own recipient row read | — | `200` `{ success, data: { readAt } }`; `404` |
| PATCH | `/notifications/me/read-all` | Mark all own unread rows read | — | `200` `{ success, data: { updated } }` |
| GET | `/notifications/preferences/me` | Own channel preferences | — | `200` `{ success, data: { email, sms } }` |
| PATCH | `/notifications/preferences/me` | Update own preferences (validated body) | `email?`, `sms?` | `200`; `400` |
| GET | `/notifications/preferences/:userId` | Self or owner | — | `200`; `403` |
| PATCH | `/notifications/preferences/:userId` | Owner only (validated body) | `email?`, `sms?` | `200`; `403` |
| DELETE | `/notifications/:id` | Delete + recipients | — | `200` `{ success: true, message }`; `404` |

Create checks:

- Zod body: `title` 1–200, `message` 1–5000, `type` in `Email`, `SMS`, `InApp`,
  `userIds` a non-empty array of 24-hex ObjectIds. The service normalizes and
  deduplicates ids and rejects more than 500 unique recipients with `400`.
- `critical` is not accepted over HTTP and is stripped from the body.
- Duplicate `userIds` are deduplicated.
- Every user must exist (`404` otherwise).
- Malformed params or cursors return `400`.

Dispatch is asynchronous (fire-and-forget). `SMS` uses the
`SMS_WEBHOOK_URL` webhook, and failed recipients are retried automatically at
+1m/+5m. Each send is gated by an atomic claim, so concurrent dispatches skip
rather than double-send; the claim becomes eligible for the sweep after 15
minutes if the process dies. A `dispatch`/`retry` call returns `404` if the
notification is deleted before the status write. See
[notifications.md](../modules/notifications.md).

## Dashboard

Source: `server/src/modules/dashboard/routes/dashboard.routes.ts`

All endpoints are `GET`, return `{ success: true, data }`, and accept no body.

| Path | Purpose | Query | Data shape |
|---|---|---|---|
| `/dashboard` | Combined cached payload | — | `summary`, `reorder`, `expiry`, `recentActivity`, `systemHealth`, `notifications`, `profit`, `salesComparison` |
| `/dashboard/summary` | Headline metrics | — | `totalSales`, `totalPurchases`, `totalInventoryValue`, `totalMedicineBatches`, `activeSuppliers`, `lowStockCount`, `outOfStockCount`, `expiringSoonCount`, `revenueTrend` |
| `/dashboard/reorder` | Reorder widget | — | `pendingCount`, `highConfidenceCount`, `totalSuggestedUnits` |
| `/dashboard/expiry` | Expiry widget | — | `batchesAwaitingDisposal`, `unitsAwaitingDisposal`, `expiringSoonCount` |
| `/dashboard/recent-activity` | Latest movements | `limit` > 0 (default 10) | movement documents with medicine/batch/user populated |
| `/dashboard/system-health` | Stale jobs | — | `staleJobCount`, `staleJobs[]` |
| `/dashboard/notifications` | Delivery counts | — | `failedDeliveries`, `pendingDeliveries`, `skippedDeliveries` |
| `/dashboard/profit` | COGS-based profit | — | `totalSales`, `totalPurchases`, `netRevenue`, `cogs`, `grossProfit`, `marginPercent` |
| `/dashboard/sales-comparison` | Month over month | — | `thisMonth`, `lastMonth`, `percentChange` (nullable) |
| `/dashboard/suppliers` | Supplier counts | — | `activeSuppliers`, `inactiveSuppliers`, `total` |
| `/dashboard/sales` | Sales analytics | `year` (2000–2100) | `year`, `totalSales`, `totalVat`, `salesByMonth[]` |
| `/dashboard/purchases` | Purchase analytics | — | `totalPurchases`, `purchasesByStatus[]` |
| `/dashboard/inventory` | Inventory analytics | — | `totalValue`, `inventoryHealth`, `lowStockCount`, `outOfStockCount`, `expiringSoonCount` |
| `/dashboard/top-selling` | Top medicines | `limit` > 0 (default 10) | `medicineId`, `medicineName`, `strength`, `totalQuantitySold`, `totalRevenue` (net of returns) |

Invalid `limit` or `year` → `400`; both must be whole numbers. Reporting periods
use `REPORTING_TIMEZONE` (default `Asia/Kathmandu`). Only `/dashboard` is cached
(60 seconds).

Details: [reporting.md](../modules/reporting.md).

## Coverage notes

- Some list endpoints have no way to filter by medicine, date range, or status.
- `GET /users/active` and one duplicate status route cannot be reached; see [API overview](api-overview.md#9-route-ordering-caveats).
- Batch and inventory services now throw `AppError`, so ordinary "not found"/conflict conditions return 404/409 instead of 500.

## Related documents

- [API overview](api-overview.md)
- [Authentication](authentication.md)
- [Error handling](error-handling.md)
- [Module documentation](../modules/authentication.md)
