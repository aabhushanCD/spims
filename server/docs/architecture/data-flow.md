# Data Flow

This document traces data through the backend: HTTP requests, cross-module operations, caching, and realtime delivery.

## 1. HTTP request lifecycle

```mermaid
sequenceDiagram
  participant C as Client
  participant E as Express
  participant M as Middleware
  participant Ctrl as Controller
  participant S as Service
  participant R as Repository
  participant DB as MongoDB

  C->>E: HTTP request with token cookie
  E->>M: cors, cookieParser, express.json
  M->>M: verifyToken (JWT from cookie)
  M->>M: authorize(role)
  M->>M: validate(Zod) when configured
  M->>Ctrl: controller method
  Ctrl->>Ctrl: read params/query/body, req.user
  Ctrl->>S: service call
  S->>R: repository call(s)
  R->>DB: query / aggregation
  DB-->>R: documents
  R-->>S: lean docs / mongoose docs
  S-->>Ctrl: result or AppError
  Ctrl-->>C: JSON + status code
  Note over C,E: Errors go to next(error) or asyncHandler, then global errorHandler
```

Characteristics:

- Authentication is cookie-based; there is no `Authorization: Bearer` handling even though the unused Swagger spec declares bearer auth.
- Validation: the shared `validate` middleware applies to request bodies. Notification params/query are parsed in the controller with `parseOrThrow` because Express 5 exposes `req.query` as a read-only getter. Other modules validate params/query ad hoc or not at all.
- Responses use different envelopes per module (`{ success, data }`, raw document, `{ message, data }`).
- Express 5 can forward rejected promises, but most controllers use explicit `try/catch` + `next(error)` or a local `asyncHandler`.

## 2. Sale creation flow

The most complex write path. It is transactional and touches counters, sales, inventory, batches, sale items, and movements.

```mermaid
sequenceDiagram
  participant Client
  participant SC as SalesController
  participant SS as SalesService
  participant CR as CounterRepository
  participant IS as InventoryService
  participant BR as BatchRepo
  participant SR as SalesRepo
  participant SIR as SaleItemRepo
  participant MR as MovementService
  participant DB as MongoDB

  Client->>SC: POST /api/sales
  SC->>SC: require req.user.userId as cashierId
  SC->>SS: createSale(dto + cashierId)
  SS->>SS: merge duplicate medicine lines
  SS->>DB: startSession + withTransaction
  SS->>CR: generateInvoiceNumber(session)
  CR->>DB: counters findOneAndUpdate $inc
  SS->>SR: create sale (status COMPLETED, totals 0)
  loop each requested line
    SS->>IS: sellMedicine(medicineId, qty, ctx, session)
    IS->>BR: findSellableBatches (FEFO order)
    loop each batch until qty satisfied
      IS->>BR: deductBatchStock with $gte guard
      IS->>MR: create SALE movement
    end
    IS->>IS: syncInventoryFromBatch
    SS->>SIR: create SalesItem per allocation
  end
  SS->>SS: subtotal, line discounts, invoice discount, VAT 13%, total
  SS->>SR: update sale totals
  SS->>DB: commit
  SS-->>SC: reloaded sale
  SC-->>Client: 201 { success: true, data: sale }
```

Important: the sale record is created first with zero totals; items and totals are filled inside the same transaction. `SaleItem.totalPrice` is VAT-exclusive.

Source: `server/src/modules/sales/services/sales.service.ts`, `server/src/modules/inventory/services/inventory.service.ts`

## 3. Purchase order and receiving flow

```mermaid
sequenceDiagram
  participant Client
  participant PC as PurchaseController
  participant PS as PurchaseOrderService
  participant SR as SupplierRepo
  participant PR as PurchaseOrderRepo
  participant PIR as PurchaseOrderItemRepo
  participant BS as BatchService
  participant IS as InventoryService

  Client->>PC: POST /api/purchases (supplier, dates, invoice, items)
  PC->>PS: createPurchaseOrder
  PS->>SR: validate supplier
  PS->>PR: create PO (status pending, total = sum qty*price)
  PS->>PIR: create items
  Note over PS: transaction commit

  Client->>PC: PATCH /api/purchases/:id/approve
  PC->>PS: approvePurchaseOrder
  PS->>PS: require status pending and at least one item
  PS->>PR: status = approved

  Client->>PC: POST /api/purchases/:id/receive (one batch per item)
  PC->>PS: receivePurchaseOrder(id, body, req.user.userId)
  PS->>PS: require status approved
  PS->>PS: validate item count, uniqueness, quantities, selling >= purchase
  loop each PO item
    PS->>BS: createBatch(...)
    BS->>PR: validate PO exists
    PS->>IS: syncInventoryFromBatch(medicineId, PURCHASE ctx, session)
  end
  PS->>PR: status = received, receivedDate = now
  Note over PS: transaction commit
```

Receiving does not support partial receipt or quantity tolerance; it requires exact matches.

> **Current blocker:** the batch insert fails the `isActive` validator for positive quantities (confirmed with the installed Mongoose version), so the transaction aborts and the PO remains `approved`. The flow above describes the intended implementation; it cannot complete until the validator is fixed.

Source: `server/src/modules/purchase/services/purchaseOrder.service.ts`

## 4. Return flow

```mermaid
sequenceDiagram
  participant Client
  participant RC as ReturnController
  participant RS as ReturnService
  participant SR as SalesRepo
  participant SIR as SaleItemRepo
  participant IS as InventoryService
  participant CR as CounterRepository
  participant RR as ReturnRepo

  Client->>RC: POST /api/returns
  RC->>RS: createReturn(dto + performedBy)
  RS->>SR: load sale
  RS->>SIR: load sale items
  RS->>CR: generateReturnNumber
  RS->>RS: reject returnDate before saleDate
  RS->>RR: create return PENDING with empty items
  loop each return line
    RS->>RS: check returned qty <= sold - already returned
    RS->>IS: returnMedicine(medicineId, batchId, qty, condition, ctx)
    RS->>SIR: increment returnedQuantity
  end
  RS->>RR: update refundAmount, status COMPLETED, returnItems
  RS->>SR: status RETURNED or PARTIALLY_RETURNED
  Note over RS: transaction commit
```

The condition affects stock differently depending on value, and the outcome is inconsistent with the labels. See [Returns](../modules/returns.md).

Source: `server/src/modules/sales/services/return.service.ts`

## 5. Inventory synchronization flow

```mermaid
flowchart LR
  Batch["Batch.quantityRemaining"] -->|"sum of sellable batches"| Sync["syncInventoryFromBatch"]
  Sync --> Inv["Inventory.currentStock"]
  Inv --> Avail["Inventory.availableStock = currentStock - reservedStock"]
  Sale["Sale / Return / Receipt / Disposal"] --> Sync
  Direct["increaseStock / decreaseStock"] --> Inv
  Direct -.->|"does not touch batches"| Batch
```

There are two paths:

1. **Batch-first flows** (sale, receipt, GOOD return, disposal) update batches and then reconcile `Inventory`.
2. **Aggregate-first flows** (`increaseStock`, `decreaseStock`, `reserveStock`, `releaseReservedStock`) update `Inventory` directly and may log a movement without touching a batch.

This split is the root of several drift bugs documented in [Inventory management](../business-logic/inventory-management.md).

## 6. Dashboard read flow

```mermaid
sequenceDiagram
  participant Client
  participant DC as DashboardController
  participant DS as DashboardService
  participant Redis
  participant Repos as Sales/Purchase/Inventory/Batch/...

  Client->>DC: GET /api/dashboard
  DC->>DS: getFullDashboard()
  DS->>Redis: GET dashboard:full-summary
  alt cache hit
    Redis-->>DS: JSON
    DS-->>Client: cached payload
  else cache miss
    DS->>Repos: 8 parallel summary queries
    Repos-->>DS: metrics
    DS->>Redis: SET EX 60
    DS-->>Client: payload
  end
```

`GET /dashboard/summary`, `/reorder`, `/expiry`, etc. bypass the full-dashboard cache and compute directly. Only the combined endpoint is cached.

Source: `server/src/modules/dashboard/service/dashboard.service.ts`

## 7. Smart reorder flow

```mermaid
flowchart TB
  Trigger["Cron 02:00 or POST /smart-reorders/generate/:medicineId"] --> Cache{"Redis reorder:medicineId?"}
  Cache -->|hit| Out["Return cached object"]
  Cache -->|miss| Sales["30-day daily sales series"]
  Sales --> W["WADS, stddev"]
  W --> Sup["Latest batch -> purchase order -> supplier"]
  Sup --> Delay["Average delay from last 10 received POs"]
  Delay --> Params["SDF, adjusted lead time, safety stock, ROP"]
  Params --> Stock["Usable stock and expiry-risk units"]
  Stock --> Decision{"currentStock > ROP?"}
  Decision -->|yes| Neg["Cache negative result, throw 400"]
  Decision -->|no| ROQ["ROQ + confidence score"]
  ROQ --> Save["Create SmartReorder status PENDING"]
  Save --> Cache2["Cache result 12h"]
```

Source: `server/src/modules/smartReorder/services/smartReorder.service.ts`

## 8. Notification flow

```mermaid
sequenceDiagram
  participant API as POST /notifications
  participant NS as NotificationService
  participant DB as MongoDB
  participant WS as WebSocket registry
  participant Mail as SMTP
  participant SMS as SMS webhook

  API->>NS: createNotification(title, message, type, userIds)
  NS->>DB: validate each user
  NS->>DB: insert Notification (Pending) + recipients (Pending)
  NS-->>API: 201 immediately
  NS->>NS: dispatch() fire-and-forget
  loop eligible recipients
    alt type InApp
      NS->>WS: push(userId, payload)
    else type Email
      NS->>Mail: sendEmail
    else type SMS
      NS->>SMS: POST {to, message}
    end
    NS->>DB: recipient Sent/Failed/Skipped
  end
  NS->>DB: recompute parent status
  Note over NS,DB: Retry cron re-dispatches due Failed rows at +1m/+5m
```

Delivery is asynchronous relative to the HTTP response. In-app delivery is
always recorded as `Sent` (the inbox is the durable record). Email and SMS
failures store an error and are retried at +1m/+5m when retryable.

## 9. WebSocket flow

1. Client opens `ws://host/ws` with the `token` cookie.
2. Server parses cookies manually during the HTTP upgrade.
3. Invalid/missing token: HTTP 401 and socket destroyed.
4. Valid token: `register(userId, socket)` stores the socket in a per-user set.
5. Notification dispatch calls `push(userId, { title, message })`.
6. `close` removes the socket.

There are no client-to-server messages and no heartbeat.

## 10. Data consistency boundaries

| Operation | Transaction? | Batch update | Aggregate update | Movement log |
|---|---|---|---|---|
| Sale create | Yes | Deduct per allocation | Recalculated | SALE per batch |
| Sale delete | Yes | **No** | `increaseStock` per item | RETURN per item |
| Return GOOD | Yes | **No** | `increaseStock` | RETURN once |
| Return DAMAGED/EXPIRED/OPENED | Yes | Increase | Recalculated | Two RETURN logs |
| Purchase receive | Yes | Create batches | Recalculated per item | PURCHASE (on create or delta) |
| Confirm disposal | No | Set 0 | `decreaseStock` | `SALE` (hardcoded; requested `EXPIRED` lost) |
| Manual increase/decrease | No | No | Direct delta | `PURCHASE` on increase; `SALE` on decrease |
| Reserve/release | No | No | Available only | RESERVE/RELEASE |
| Batch adjust | No | Set value | Recalculated | None |

## Related documents

- [System overview](system-overview.md)
- [Stock movements](../business-logic/stock-movements.md)
- [Inventory management](../business-logic/inventory-management.md)
- [Business workflows](../business-logic/business-workflows.md)
- [Redis and caching](../infrastructure/redis-and-caching.md)
