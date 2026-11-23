# SPIMS Client Parity Plan

**Status:** Proposed  
**Scope:** Bring `client/` to feature and contract parity with the server API in `server/`  
**Baseline date:** 2026-11-22  
**Primary inputs:** `README.md`, `AGENTS.md`, `server/docs/api/endpoints.md`, `server/docs/project-status.md`, `docs/testing.md`, `server/src/modules/app.routes.ts`, and the client feature code.

---

## 1. Purpose

The backend exposes substantially more capability than the client currently uses. This document is the working plan for closing that gap.

It is intentionally structured as a **living checklist**, not a one-off report:

- every known gap has a stable ID;
- every gap has evidence, an intended fix, and acceptance criteria;
- every phase has exit criteria and a verification step;
- decisions that need product input are listed explicitly.

Use the progress log in section 12 as phases land.

---

## 2. How to read this document

| Prefix | Meaning |
|---|---|
| `X-*` | Cross-cutting client infrastructure gap |
| `C-*` | Contract drift or current bug |
| `D-*` | Missing or incomplete domain feature |
| `P0` | Blocks correct use of an existing screen |
| `P1` | Required for core operational parity |
| `P2` | Valuable but can follow the core flows |

---

## 3. Executive summary

The client is strongest in:

- authentication and session management;
- medicine/master-data CRUD;
- supplier CRUD;
- basic sales creation and sale detail;
- the notification inbox.

The largest gaps are whole server capabilities with **no client UI at all**:

1. Customers
2. Sales returns
3. Payment ledger and credit settlement
4. Purchase returns
5. Stocktakes
6. Audit log
7. Notification templates
8. Inventory movements, reconciliation, and adjustments
9. Reporting analytics and CSV export

There are also several **contract defects** that should be fixed before new screens are built. The most serious are:

- purchase editing calls a non-existent `PUT /purchases/:id`;
- the sale form selects a batch the server ignores, so the quoted batch/price can differ from the sale;
- batch adjustment sends `reason` where the API expects `remarks`;
- the receive-purchase form does not match the partial-receipt contract;
- credit sales collect no payment even though the server has a full payment ledger;
- customer identity captured in the sale form is not persisted.

Finally, the client has **no real route/action authorization model**, most lists silently truncate at 100 rows, and the frontend test harness covers only two pure-logic files.

---

## 4. Sources reviewed

### Server

- `server/src/modules/app.routes.ts` (22 mounted prefixes, router-level roles)
- `server/src/modules/*/routes/*.ts` (route methods and validation)
- `server/src/modules/sales/services/sales.service.ts` (sale/FEFO behavior)
- `server/src/modules/purchase/routes/purchase.route.ts` (actual purchase methods)
- `server/docs/api/endpoints.md`
- `server/docs/project-status.md`
- `server/docs/modules/*.md`

### Client

- `client/src/routes/appRoutes.tsx`
- `client/src/features/*/{pages,components,hooks,services,types,schema}`
- `client/src/features/dashboard/data/sidebar.ts`
- `client/src/features/dashboard/components/layout/Sidebar.tsx`
- `client/src/components/MobileSidebar.tsx`
- `client/src/components/ProtectedRoute.tsx`
- `client/src/api/*`

### Repository docs

- `README.md`
- `AGENTS.md`
- `docs/testing.md`
- `docs/security.md`
- `docs/ci-cd.md`

> The backend route count (~193 registrations) is taken from `server/docs/project-status.md`. Treat that number as documentation-derived; route files remain authoritative.

---

## 5. Server surface inventory

| Prefix | Purpose | Extra role restrictions |
|---|---|---|
| `/auth` | Register, login, refresh, logout, sessions, email verification, password reset | Public / authenticated |
| `/users` | User CRUD and admin actions | Mount: owner + pharmacist; writes: owner only |
| `/audit` | Auth/admin audit rows | Owner only |
| `/customers` | Customer CRUD and search | All three roles |
| `/medicines` | Medicine CRUD, search, barcode lookup | All three roles |
| `/units` | Unit CRUD | All three roles |
| `/categories` | Category CRUD | All three roles |
| `/brands` | Brand CRUD | All three roles |
| `/generic-names` | Generic-name CRUD | All three roles |
| `/suppliers` | Supplier CRUD | All three roles |
| `/purchases` | PO create/approve/cancel/receive/items/invoice/performance | All three roles |
| `/purchase-returns` | Supplier returns and credit ledger | All three roles |
| `/stocktakes` | Physical count lifecycle | Owner + inventory manager |
| `/inventory` | Aggregate stock, movements, adjustments, reconciliation | All three roles |
| `/sales` | Sales, invoice, payments, update, delete | All three roles |
| `/sale-items` | Line price/discount corrections | All three roles |
| `/returns` | Customer return lifecycle | All three roles; approve/reject/reverse owner + inventory manager |
| `/batches` | Batch CRUD, history, disposal, adjustments | All three roles |
| `/smart-reorders` | Reorder recommendations and generation | All three roles; generate/manual owner + inventory manager; delete owner |
| `/notifications` | Inbox, dispatch, retry, preferences | All three roles; detail/dispatch/retry owner + pharmacist |
| `/notification-templates` | Template CRUD and render | Read all; writes owner |
| `/dashboard` | Summary, analytics, reports, CSV export | All three roles |

### Pagination contract

Paginated list endpoints accept `cursor` and `limit` (default 20, max 100) and return:

```json
{
  "success": true,
  "data": { "items": [], "nextCursor": null }
}
```

`nextCursor` must be passed back as `cursor`; `null` means the end.

---

## 6. Client surface inventory

### Routes today

| Path | Page | Notes |
|---|---|---|
| `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` | Auth pages | Covered |
| `/` | Dashboard | Uses combined dashboard endpoint |
| `/medicines` | MedicinePage | CRUD |
| `/generic-names`, `/categories`, `/brands`, `/units` | Master data pages | CRUD |
| `/suppliers` | SupplierPage | CRUD |
| `/purchase-orders` | PurchasePage | Create/list/detail/approve/receive |
| `/sales` | SalesPage | Create/list/delete |
| `/sales/:id` | SaleDetailsPage | Invoice-style detail |
| `/users` | UserPage | List/toggle; edit/search are stubs |
| `/batches` | BatchPage | List/delete; view/edit are stubs |
| `/stock` | InventoryPage | Read-only list |
| `/notifications` | NotificationsPage | Inbox with load-more |
| `/settings/notifications` | NotificationSettingsPage | Own preferences |
| `/settings/security` | SecurityPage | Session management |

### Feature folders today

`auth`, `batch`, `dashboard`, `genericName`, `inventory`, `medicine`, `notification`, `purchase`, `sales`, `security`, `smart`, `supplier`, `user`.

### Test coverage today

Per `docs/testing.md`: **30 client test files, 122 tests**, covering pure logic,
payload/schema validation, MSW service contracts, and component/a11y coverage
for payment, user, and one shared UI surface. Sale, receive, return, stocktake,
and adjustment component tests, plus hook tests, remain.

---

## 7. Parity matrix

| Server area | Client status | Missing client capability |
|---|---|---|
| Auth | Complete | None material |
| Users | Partial | Edit, delete, role change UI, admin reset-password, force-logout, search/filter/pagination, real stats |
| Audit | Missing | Whole page and filters |
| Customers | Missing | CRUD, search, picker in sale, history, `customerId` |
| Medicines | Partial | Barcode lookup, `/medicines/search`, filters, pagination |
| Units/categories/brands/generic names | Complete | Delete-conflict messaging polish |
| Suppliers | Partial | Performance endpoint, filters/pagination |
| Purchases | Partial | Edit is broken; cancel, recalculate, item CRUD, invoice upload/download, supplier performance, partial receipt UI, filters/pagination |
| Purchase returns | Missing | Create, list/detail, lifecycle, supplier ledger |
| Inventory | Partial | Movements, reconciliation, increase/decrease, reserve/release, sync, create/delete, working search, real stats |
| Batches | Partial | Create, edit, detail, history, adjust/increase/deduct, disposal, filtered views, pagination |
| Sales | Partial | Payments, returns, customer selection, sale-item corrections, update UI, filters/pagination |
| Sale items | Missing | Price/discount correction UI |
| Returns | Missing | Full lifecycle and refund display |
| Stocktakes | Missing | List/create/edit/complete/cancel and variance review |
| Smart reorders | Partial | Page, generate, approve/reject/delete, manual create |
| Notifications | Partial | Admin compose/dispatch/retry/delete, recipient detail, per-user preferences |
| Notification templates | Missing | CRUD and render preview |
| Dashboard/reporting | Partial | Range analytics, by-cashier, by-category, top-selling, profit, CSV, supplier counts |
| Payments | Missing | Ledger, add payment, balance, idempotency |
| Barcode | Missing UI | Lookup integration |

---

## 8. Gap register

### 8.1 Cross-cutting gaps

#### X-1 — No client permission model (P0)

**Evidence**

- `client/src/components/ProtectedRoute.tsx` checks only `currentUser`.
- `client/src/features/dashboard/components/layout/Sidebar.tsx` filters only top-level items.
- `client/src/features/dashboard/data/sidebar.ts` restricts `Sales` to `pharmacist`, so owner and inventory manager lose the menu entry.
- `client/src/components/MobileSidebar.tsx` does not filter by role at all.
- `Routes` in `client/src/routes/appRoutes.tsx` have no role guard.

**Impact**

- Owner/inventory manager cannot see Sales from the menu.
- Inventory manager sees Users, but `/users` is mounted for owner + pharmacist only, so it will 403.
- Restricted pages are reachable directly and fail only after a server round trip.

**Fix**

- Add `client/src/lib/permissions.ts` as the single source of truth for role → page/action permissions.
- Add `RequireRole` / `ForbiddenPage`.
- Apply guards to routes, sidebar, mobile sidebar, and action buttons.
- Add a client 403 page.
- Correct the Sales visibility.

**Acceptance**

- Every client route/action is reachable only when the server would allow it.
- Desktop and mobile navigation agree.
- No inventory-manager path leads to `/users`.

---

#### X-2 — Lists truncate at 100 rows (P0)

**Evidence**

- `client/src/features/medicine/services/medicine.service.ts`
- `client/src/features/batch/services/batch.service.ts`
- `client/src/features/inventory/services/inventory.service.ts`
- `client/src/features/sales/services/sales.service.ts`
- `client/src/features/purchase/services/purchase.service.ts`
- `client/src/features/user/services/user.service.ts`

All request `limit=100` and discard `nextCursor`. Only the notification inbox implements infinite loading.

**Impact**

- Silent data loss on any list above 100 rows.
- Documented as a known risk in `server/docs/project-status.md`.

**Fix**

- Add a shared cursor-pagination hook (e.g. `client/src/hooks/useCursorList.ts`).
- Add a shared `LoadMore` / “Showing X of Y” control.
- Adopt on every paginated list.
- Preserve filters in the query key.

**Acceptance**

- Every paginated list can load beyond 100 rows.
- End-of-list state is explicit.
- Filter changes reset the cursor.

---

#### X-3 — No type/contract safety (P1)

**Evidence**

- Hand-written response shapes in many `services/*.ts`.
- Several services return `unknown` (`batch.service.ts`, `purchase.service.ts`).
- No contract tests and no generated types.

**Impact**

- Contract drift (see section 9) is discovered at runtime.

**Fix options**

1. Minimum: typed service responses plus contract tests.
2. Stronger: generate `client/src/types/openapi.d.ts` from `server`’s `/api-docs/openapi.json` with `openapi-typescript` and add a regeneration script.

**Acceptance**

- Service functions have explicit request/response types.
- At least the critical services have contract tests.
- A documented regeneration/check path exists if generated types are adopted.

---

#### X-4 — Incomplete error, empty, loading, and 404 states (P2)

**Evidence**

- Several pages render a single red error string.
- No global error boundary.
- No wildcard route; unknown URLs render nothing useful.
- Toast usage is inconsistent (`react-toastify` is installed but not used uniformly).

**Fix**

- Add `ErrorBoundary`, `NotFoundPage`, and a wildcard route.
- Standardize loading/empty/error components.
- Normalize API errors through the existing `lib/apiError.ts` helpers.
- Use toasts consistently for mutations.

**Acceptance**

- Unknown route → 404 page.
- Every screen has loading, empty, and error states.
- Mutation failures surface a readable message.

---

#### X-5 — Inconsistent money/date formatting (P2)

**Evidence**

- `Rs. ${value.toFixed(2)}` is repeated in tables and invoices.
- Dates use `toLocaleDateString` / `toLocaleString` without a shared helper.
- Reporting is timezone-aware server-side (`REPORTING_TIMEZONE`), but the client has no formatting policy.

**Fix**

- Add `client/src/lib/format.ts` for currency, dates, and percentages.
- Adopt it in all new code and refactor touched screens.

**Acceptance**

- No new inline money formatting.
- Dates render consistently across invoice, tables, and reports.

---

#### X-6 — Stubs, dead code, and hardcoded data (P1)

**Evidence**

- `client/src/features/batch/pages/BatchPage.tsx`: view/edit are `console.log`.
- `client/src/features/inventory/pages/InventoryPage.tsx`: search input not wired; stats hardcoded (`"3"`).
- `client/src/features/user/pages/UserPage.tsx`: search/edit are `console.log`.
- `client/src/features/sales/components/SaleDialog.tsx`: submit logs a debug line.
- `client/src/features/supplier/components/AddSupplierDialog.tsx`: form-error debug log.
- `client/src/components/Sidebar.tsx` and `client/src/components/Layout.tsx` appear unused.
- `client/src/features/dashboard/data/dashboard.ts` and `chart.ts` contain hardcoded datasets.

**Fix**

- Implement or remove each stub.
- Remove unused components and debug logs.
- Delete or wire hardcoded datasets.

**Acceptance**

- No `console.log` stubs remain in user-facing flows.
- No unreferenced navigation/layout duplicate remains.
- Dashboard charts are endpoint-driven.

---

#### X-7 — Minimal frontend test harness (P1)

**Evidence (pre-Phase 7 state)**

- `docs/testing.md` stated that component/hook coverage did not exist.
- `client/package.json` had `vitest` but no jsdom/testing-library dependencies.

**Fix**

- Add `jsdom`, `@testing-library/react`, `@testing-library/user-event`, and a request mocking layer. *(Done in Phase 7.)*
- Configure a jsdom test environment for component tests while keeping existing pure tests. *(Done: `unit`, `contract`, and `ui` Vitest projects.)*
- Add tests in phases 0–7 for each new flow. *(In progress: payment and user flows are covered; sale, receive, return, stocktake, adjustment, and hook tests remain.)*

**Acceptance**

- Critical forms/hooks have behavioral tests.
- Tests assert observable behavior, not implementation details.
- `npm --prefix client test` passes.

---

### 8.2 Contract and bug register

#### C-1 — Purchase edit calls a non-existent endpoint (P0)

**Evidence**

- `client/src/features/purchase/services/purchase.service.ts` calls `PUT /purchases/${id}`.
- `server/src/modules/purchase/routes/purchase.route.ts` has no `PUT /purchases/:id`.

**Impact**

- Editing a PO fails with 404.

**Fix**

- Replace the edit flow with `PATCH /purchases/:id/items/:itemId`, add/remove item, and `/recalculate`.
- Or hide edit until the item-based editor exists.

**Acceptance**

- No client call to `PUT /purchases/:id`.
- Editing a pending PO updates the intended fields and totals.

---

#### C-2 — Sale batch selection is ignored by the server (P0)

**Evidence**

- `client/src/features/sales/components/SaleDialog.tsx` sends `items[].batchId`.
- `client/src/features/sales/components/MedicineSearch.tsx` quotes `nextBatch.sellingPrice`.
- `server/src/modules/sales/services/sales.service.ts` passes `batchId: ""` to `sellMedicine`, so FEFO chooses the batch.

**Impact**

- The batch and price shown to the cashier may not be the batch/price sold.
- Manual batch selection is currently decorative.

**Fix (recommended)**

- Remove manual batch selection from the create-sale payload.
- Show an estimate based on FEFO, then reload the invoice after creation.
- If manual batch selection is a product requirement, change the server to honor `batchId` and add a test.

**Acceptance**

- The batch/price displayed matches the persisted sale item, or the UI clearly labels prices as estimates.

---

#### C-3 — Batch adjustment payload uses the wrong field (P0)

**Evidence**

- `client/src/features/batch/services/batch.service.ts` sends `{ quantity, reason }`.
- The batch adjust endpoint accepts `quantity` and `remarks`.

**Impact**

- Remarks are silently dropped.

**Fix**

- Rename to `remarks` in the service, hook, and form.

**Acceptance**

- Adjustment remarks appear in batch history/movements.

---

#### C-4 — Receive-purchase payload does not match the contract (P0)

**Evidence**

- `client/src/features/purchase/schema/receivePurchase.schema.ts` sends `purchasePrice`.
- The receipt contract expects `purchaseOrderItemId` (or `medicineId` for older clients), `batchNumber`, dates, `sellingPrice`, `quantityReceived`, `remarks`.
- `ReceivePurchaseDialog` defaults `manufacturingDate` to `""` and received quantity to the full ordered quantity.

**Impact**

- Partial receiving is not properly modeled.
- Empty manufacturing dates and extra fields can cause validation failures or silently dropped data.

**Fix**

- Add `purchaseOrderItemId` to each receipt line.
- Remove `purchasePrice`.
- Make manufacturing date handling match server validation.
- Default received quantity to the remaining quantity, not the full ordered quantity.
- Support multiple receipts and multiple batches per PO item.

**Acceptance**

- Partial receipt succeeds, PO becomes `partially_received`, and remaining quantities are correct.
- A second receipt can complete the PO.

---

#### C-5 — Purchase form sends stripped/irrelevant fields (P2)

**Evidence**

- `client/src/features/purchase/schema/purchase.schema.ts` includes `status`, `receivedDate`, and defaults `expectedDeliveryDate` to now.

**Impact**

- Misleading form semantics; the server forces `pending` and strips `status`.

**Fix**

- Remove `status` and `receivedDate` from the create form.
- Make `expectedDeliveryDate` genuinely optional.

**Acceptance**

- The create payload contains only fields the server accepts.

---

#### C-6 — Credit sales collect no payment (P1)

**Evidence**

- `PaymentSection` only sets `paymentMethod`.
- `sales.service.ts` has no payment ledger methods.
- Server exposes `GET/POST /sales/:id/payments`.

**Impact**

- Credit sales remain unpaid with no client way to settle them.

**Fix**

- Add payment ledger service/hooks and a “Record payment” dialog on sale detail.
- Show amount due / partially paid / paid.
- Send `amount`, `method`, optional `reference`, optional `idempotencyKey`.

**Acceptance**

- A credit sale can be settled from the UI, including partial payments, and overpayment is rejected with a readable message.

---

#### C-7 — Customer identity is not persisted (P1)

**Evidence**

- `SaleDialog` captures `customerName`, `customerPhone`, and `notes`.
- The submit payload drops `customerPhone` and `notes`.
- No `customerId` is sent.
- Server supports `customerId` and a name snapshot.

**Impact**

- Customer CRUD/history and invoice population are unreachable.
- Phone/notes input is misleading.

**Fix**

- Add customer search/select and optional quick-create.
- Send `customerId` with a name snapshot.
- Either persist phone/notes through a supported field or remove the inputs.

**Acceptance**

- Selecting an existing customer links the sale and appears on the invoice.
- Free-text walk-in sales still work.

---

#### C-8 — “Cancel Sale” is a destructive delete (P1)

**Evidence**

- `SalesPage` and `SaleDetailsPage` label the action “Cancel Sale”.
- The client calls `DELETE /sales/:id`.
- The server deletes the sale and restores stock.

**Impact**

- Users may expect a status change, not permanent deletion.

**Fix (short term)**

- Rename to “Delete sale and restore stock” and strengthen the confirmation copy.

**Fix (long term)**

- If a true cancellation status is required, add it server-side; the client cannot invent it.

**Acceptance**

- Copy matches behavior.

---

#### C-9 — Batch view/edit and inventory search are non-functional (P1)

**Evidence**

- `BatchPage` handlers only log.
- `InventoryPage` search input has no `onChange`/query wiring.
- Inventory stats are hardcoded.

**Fix**

- Implement batch detail/edit.
- Wire search to `/inventory?search=`.
- Derive stats from inventory/dashboard data.

**Acceptance**

- Search filters results.
- Batch actions perform real work.

---

### 8.3 Domain gaps

#### D-1 — Customers (P1)

Server endpoints: `POST/GET/PUT/DELETE /customers`, `GET /customers/:id`.

Build:

- `client/src/features/customer/{pages,components,hooks,services,types,schema}`
- list/search, create/edit/delete
- optional detail with recent sales and outstanding credit
- sale form integration (see C-7)

#### D-2 — Payments (P1)

Server endpoints: `GET/POST /sales/:id/payments`.

Build:

- payment ledger service/hooks
- invoice summary showing total, paid, due
- record-payment dialog
- payment history on sale detail

#### D-3 — Sales returns (P1)

Server endpoints: `GET/POST /returns`, `GET/PATCH /returns/:id`, approve/reject/cancel/complete/reverse.

Build:

- `client/src/features/returns/*`
- create from sale detail with per-line quantity/condition/restocking fee/remarks
- list with status/date/sale search
- detail with refund quote and VAT
- lifecycle actions with role gating
- returned quantities visible on sale detail

#### D-4 — Sale-item corrections (P2)

Server endpoint: `PATCH /sale-items/:id`.

Build:

- price/discount correction dialog
- hide when `returnedQuantity > 0`
- refresh parent totals after save

#### D-5 — Inventory depth (P1)

Server endpoints:

- `GET /inventory/movements`, `GET /inventory/movements/:id`
- `GET /inventory/reconciliation`
- `POST /inventory/:medicineId/{increase,decrease,reserve,release,sync}`
- `PATCH/DELETE /inventory/:id`

Build:

- movement history with filters and detail
- reconciliation table with variance highlighting
- adjustment/reserve/release/sync actions
- create/delete where appropriate
- real inventory stats

#### D-6 — Batch UI completion (P1)

Server endpoints:

- `POST /batches`, `PATCH/DELETE /batches/:id`
- `GET /batches/{expired,expired/awaiting-disposal,low-stock}`
- `GET /batches/:id/history`
- `POST /batches/:id/{increase,deduct,adjust,confirm-disposal}`

Build:

- create/edit/detail/history
- adjust/increase/deduct
- disposal confirmation
- tabs for expired/awaiting disposal/low stock
- filters and pagination

#### D-7 — Stocktakes (P1)

Server endpoints: `POST/GET /stocktakes`, `GET/PATCH /stocktakes/:id`, complete/cancel.

Build:

- `client/src/features/stocktake/*`
- create with batch counts
- edit counts/notes while open
- complete with variance review
- cancel
- owner/inventory-manager guard

#### D-8 — Purchase returns (P1)

Server endpoints: `POST/GET /purchase-returns`, detail, approve/reject/cancel/complete, supplier ledger.

Build:

- `client/src/features/purchaseReturn/*`
- create from a received PO/batch
- lifecycle actions
- supplier credit ledger view

#### D-9 — Purchase depth (P1)

Server endpoints:

- `PATCH /purchases/:id/cancel`
- `PATCH /purchases/:id/recalculate`
- `POST/PATCH/DELETE /purchases/:id/items...`
- `POST/GET /purchases/:id/invoice`
- `GET /purchases/suppliers/:id/performance`

Build:

- correct edit flow (see C-1)
- cancel with reason/confirmation
- item add/update/remove
- invoice upload/download
- supplier performance panel
- status/search/date filters and pagination

#### D-10 — Supplier performance (P2)

Server endpoint: `GET /purchases/suppliers/:id/performance`.

Build:

- on-time rate, average delay, recent receipts on supplier detail or purchase page.

#### D-11 — Smart reorder actions (P1)

Server endpoints:

- `POST /smart-reorders` (manual)
- `POST /smart-reorders/generate`
- `POST /smart-reorders/generate/:medicineId`
- `PATCH /:id/approve` with `createPurchaseOrder`
- `PATCH /:id/reject`
- `DELETE /:id`

Build:

- full page with pending/all
- generate all/one
- approve/reject/delete
- manual recommendation form
- link approved recommendations to draft POs

#### D-12 — Notification administration and templates (P2)

Server endpoints:

- `POST/GET/DELETE /notifications`
- `POST /notifications/:id/{dispatch,retry}`
- `GET /notifications/:id`, `GET /notifications/user/:userId`
- `GET/PATCH /notifications/preferences/:userId`
- notification-template CRUD + render

Build:

- compose notification
- dispatch/retry/delete
- recipient detail
- template CRUD and preview
- owner-only per-user preferences

#### D-13 — Reporting and CSV (P1)

Server endpoints:

- `GET /dashboard/range`
- `GET /dashboard/by-cashier`
- `GET /dashboard/by-category`
- `GET /dashboard/top-selling`
- `GET /dashboard/profit`
- `GET /dashboard/export`

Build:

- reporting page or dashboard tabs
- date-range selection
- sales/purchases/profit/refund breakdowns
- CSV export
- supplier counts

#### D-14 — User administration (P1)

Server endpoints:

- `PUT/DELETE /users/:id`
- `PATCH /users/:id/role`
- `POST /users/:id/reset-password`
- `POST /users/:id/force-logout`
- filters/pagination

Build:

- edit dialog
- role change
- delete
- admin reset-password
- force-logout
- search/filter/pagination
- real stats
- self-protection (cannot delete/demote self accidentally)

#### D-15 — Audit log (P2)

Server endpoint: `GET /audit` (owner only).

Build:

- `client/src/features/audit/*`
- filters: action, actor, entity type/id, status, date range
- cursor pagination
- owner-only route

#### D-16 — Medicine search/filter/barcode (P2)

Server endpoints:

- `GET /medicines/search?query=`
- `GET /medicines/barcode/:barcode`
- medicine list filters

Build:

- wire list search/filters
- barcode lookup input
- optional camera scanning later (explicitly deferred)

#### D-17 — Sale filters/update (P2)

Server endpoints:

- `GET /sales` filters: status, cashier, customer, date range
- `PATCH /sales/:id` for customer/payment edits

Build:

- filter bar
- edit customer/payment dialog
- keep financial edits out of scope (server does not allow them)

---

## 9. Contract drift register (summary)

| ID | Drift | Severity | Fix phase |
|---|---|---|---|
| C-1 | `PUT /purchases/:id` does not exist | P0 | 0 |
| C-2 | Sale `batchId` ignored by server | P0 | 0 |
| C-3 | Batch adjust `reason` vs `remarks` | P0 | 0 |
| C-4 | Receive-purchase payload mismatch | P0 | 0 |
| C-5 | Purchase form sends stripped fields | P2 | 0/3 |
| C-6 | Credit sale has no payment posting | P1 | 1 |
| C-7 | Customer identity not persisted | P1 | 1 |
| C-8 | “Cancel Sale” is a delete | P1 | 0 |
| C-9 | Batch/inventory stubs | P1 | 2 |

---

## 10. RBAC matrix

Derived from `server/src/modules/app.routes.ts` and route-level `authorize` calls.

| Capability | Owner | Inventory manager | Pharmacist | Notes |
|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | All three |
| Medicines/master data | Yes | Yes | Yes | All three |
| Suppliers | Yes | Yes | Yes | All three |
| Purchases / purchase returns | Yes | Yes | Yes | All three |
| Inventory | Yes | Yes | Yes | All three |
| Batches | Yes | Yes | Yes | All three |
| Customers | Yes | Yes | Yes | All three |
| Sales / sale-items | Yes | Yes | Yes | All three |
| Returns: read/create/cancel/complete | Yes | Yes | Yes | All three |
| Returns: approve/reject/reverse | Yes | Yes | No | Owner + inventory manager |
| Stocktakes | Yes | Yes | No | Owner + inventory manager |
| Smart reorder: read | Yes | Yes | Yes | All three |
| Smart reorder: generate/manual | Yes | Yes | No | Owner + inventory manager |
| Smart reorder: delete | Yes | No | No | Owner only |
| Notification inbox/preferences | Yes | Yes | Yes | Own data |
| Notification detail/dispatch/retry | Yes | No | Yes | Owner + pharmacist |
| Notification templates: read | Yes | Yes | Yes | All three |
| Notification templates: writes | Yes | No | No | Owner only |
| Users: read | Yes | No | Yes | Mount owner + pharmacist |
| Users: writes | Yes | No | No | Owner only |
| Audit log | Yes | No | No | Owner only |

### Current client mismatches

- `Sales` is hidden from owner and inventory manager (`sidebar.ts`).
- `Users` is shown to inventory manager, who will receive 403.
- Mobile sidebar ignores roles entirely.
- No route guard enforces the server matrix.

---

## 11. Phased roadmap

### Phase 0 — Foundations and contract fixes

**Size:** Small/medium  
**Dependencies:** None

- [x] Add `client/src/lib/permissions.ts`.
- [x] Add `RequireRole` access denial UI.
- [x] Apply route guards in `client/src/routes/appRoutes.tsx`.
- [x] Fix desktop/mobile sidebar filtering.
- [x] Fix Sales menu visibility.
- [x] Fix purchase edit (remove `PUT`, add item-based editor).
- [x] Fix batch adjust `reason` → `remarks`.
- [x] Fix receive-purchase schema and partial-quantity defaults.
- [x] Decide FEFO vs manual batch selection; implement FEFO.
- [x] Remove misleading customer phone/notes fields; `customerId` deferred.
- [x] Correct “Cancel Sale” copy.
- [x] Adopt cursor pagination on one list (medicines); shared hook still pending.
- [x] Add `lib/format.ts`.
- [x] Add 404 route and error boundary.
- [x] Remove dead/stub code and debug logs (dashboard data still pending).

**Exit criteria**

- No client call to a non-existent endpoint/method.
- Navigation and route guards match the server RBAC.
- One list proves load-more.
- Lint/typecheck/tests/build pass.

#### Phase 0 implementation notes (2026-11-22)

Completed:

- Purchase editing now applies an item-level diff (`POST`/`PATCH`/`DELETE` items) and recalculates totals; `PUT /purchases/:id` is gone.
- `GET /purchases/:id` now returns `receivedQuantity` and `quantityRemaining`; covered by a server service test.
- Receive-purchase schema now requires `purchaseOrderItemId` and a real manufacturing date, drops `purchasePrice`, and defaults to the remaining quantity.
- Batch adjustments send `remarks`, and a minimal Adjust Stock dialog now reaches that path.
- Sale creation omits `batchId`; FEFO owns allocation. The form shows a FEFO preview, and success navigates to the persisted invoice.
- Sale detail shows the actual FEFO batch, paid amount, and amount due from the invoice payload.
- Unsaved customer phone/notes fields were removed from the sale form.
- Client permission model, `RequireRole`, role-correct desktop/mobile navigation, `/users` guard, and a 404 route were added.
- “Cancel Sale” is now “Delete Sale” in the sales table and detail page, with a destructive confirmation.
- The duplicate `cancelSale`/`deleteSale` service methods were consolidated; `useDeleteSale` is the only mutation.
- Purchase header fields are disabled in **all** edit modes; only item lines can change.
- Batch view/edit stubs and dead medicine row actions were removed; inventory search and stats are wired; user search is wired.
- Inventory tiles now use global `/dashboard/inventory` analytics rather than the loaded search page.
- Medicines list uses cursor pagination with a “Load more” control (pilot for the remaining lists).
- Added `lib/format.ts`, an app-level `ErrorBoundary`, and a 404 route.
- Removed hardcoded dashboard datasets and the unused legacy `Layout`/`Sidebar`/`CategoryChart` components.

Review follow-up completed:

- `expectedDeliveryDate` now accepts a cleared (`null`) value and normalizes it to `undefined`.
- The empty `search=` sales-list regression is fixed; the query builder omits blank searches.
- Purchase item diffing is extracted into `lib/purchaseItemDiff.ts` with direct tests.
- `console.log` stubs are gone; client ESLint now rejects `console` except `warn`/`error`.

Verification after the follow-up:

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS (server 536 unit + 15 integration; client 55)
npm run build      PASS (Vite chunk-size warning only)
```

Still open from Phase 0: pagination rollout to every list. Phase 1 (customers, payments, sales returns) is next.

---

### Phase 1 — Customers, payments, sales returns

**Size:** Large  
**Dependencies:** Phase 0

- [x] Customer feature (CRUD/search).
- [x] Customer picker/quick-create in sale.
- [x] Send `customerId`.
- [x] Payment ledger service/hooks.
- [x] Amount due / paid / partially paid display.
- [x] Record-payment dialog with idempotency key.
- [x] Sales-return feature and lifecycle actions.
- [x] Return creation from sale detail.
- [x] Return history on sale detail.
- [x] Sale-item correction UI.
- [x] Tests for payment settlement and return lifecycle.

**Exit criteria**

- Credit sale → payment → return → refund → reversal works entirely from the UI.

#### Phase 1 implementation notes (2026-11-22)

- Added `/customers` with list/search/create/edit/delete and a shared customer picker in the sale form, including inline quick-create.
- Sale creation now sends an optional `customerId` alongside the name snapshot.
- Added payment ledger, amount-due display, and a record-payment dialog with a client idempotency key.
- Added `/returns` and `/returns/:id` with create-from-sale, approve, reject, cancel, complete, and reverse actions; owner/inventory-manager actions are gated client-side.
- Sale detail now shows its returns and allows a new return.
- Sale detail now supports line price/discount corrections when `returnedQuantity` is zero.
- Added customer, return, payment, and returned-quantity mapping tests.
- The sales blank-search regression test predates Phase 1 and remains in place.

Verification:

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS (server 536 unit + 15 integration; client 71)
npm run build      PASS (Vite chunk-size warning only)
npm run audit      PASS (0 production vulnerabilities)
```

---

### Phase 2 — Inventory and batch depth

**Size:** Large  
**Dependencies:** Phase 0

- [x] Batch create/edit/detail/history.
- [x] Batch adjust/increase/deduct.
- [x] Disposal confirmation.
- [x] Expired/awaiting-disposal/low-stock views.
- [ ] Inventory movement detail page (list is implemented; detail API is wired in the service).
- [x] Reconciliation report.
- [x] Reserve/release/sync actions (aggregate increase/decrease remain covered by batch operations).
- [x] Wire inventory search.
- [x] Real inventory stats.
- [x] Stocktake feature: create/edit/complete/cancel.
- [x] Barcode lookup integration (typed lookup; camera scanning still deferred).
- [x] Tests for batch validation and stocktake variance math.

**Exit criteria**

- Every inventory mutation exposed by the server is reachable from the client.
- Batch stubs are gone.
- Count variance is visible before completion.

#### Phase 2 implementation notes (2026-11-22)

- Batch page now has All / Expired / Awaiting disposal / Low stock views, search, mark-expired, create/edit, history, adjust, increase, deduct, disposal, and delete.
- Batch movement history is shown with type, quantity, reference, performer, and remarks.
- Inventory has dedicated Movements and Reconciliation pages plus reserve/release actions and per-medicine sync.
- Inventory tiles remain global via `/dashboard/inventory`.
- Stocktakes have list, create, edit-counts, detail with variance summary, complete, and cancel.
- Medicine page has a barcode lookup dialog using `/medicines/barcode/:barcode`.
- Added batch form validation tests and stocktake variance-summary tests.

Remaining in this area: a dedicated inventory-movement detail page and aggregate increase/decrease beyond the batch-level flows.

Verification:

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS (server 536 unit + 15 integration; client 80)
npm run build      PASS (Vite chunk-size warning only)
```

---

### Phase 3 — Purchasing depth

**Size:** Medium/large  
**Dependencies:** Phases 0–2

- [x] Correct PO edit flow.
- [x] Cancel PO.
- [x] Recalculate totals.
- [x] Item add/update/remove.
- [x] Invoice upload/download.
- [x] Partial receiving with remaining quantities and `purchaseOrderItemId`.
- [x] Multiple receipts/batches per PO item.
- [x] Supplier performance panel.
- [x] Purchase returns feature.
- [x] Supplier credit ledger.
- [x] Purchase filters/pagination.
- [x] Tests for partial receipt and purchase return validation.

**Exit criteria**

- A PO can be created, approved, partially received across receipts, invoiced, and partially returned.

#### Phase 3 implementation notes (2026-11-22)

- Batch list now supports a `purchaseOrderId` filter, with a compound index and server test.
- Purchase list now supports search, status/date filters, and cursor load-more; the table shows the invoice number and only offers edit/cancel where allowed.
- Purchase detail shows ordered, received, and remaining quantities, invoice upload/download, and cancel/approve/receive actions.
- Receiving supports multiple batch lines per PO item with over-receipt and duplicate-batch validation.
- Supplier performance dialog exposes order counts, on-time rate, average delay, value, reliability, and recent orders.
- Purchase returns include list, create-from-received-PO, detail, approve/reject/cancel/complete, and supplier credit ledger.
- Added tests for purchase list params, invoice file validation, receipt totals, and purchase-return validation.

Verification:

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS (server 537 unit + 15 integration; client 94)
npm run build      PASS (Vite chunk-size warning only)
```

---

### Phase 4 — Smart reorder and notification administration

**Size:** Medium  
**Dependencies:** Phase 0

- [x] Smart-reorder page.
- [x] Generate all/one.
- [x] Approve with optional draft PO.
- [x] Reject with reason.
- [x] Delete (owner only).
- [x] Manual recommendation create.
- [x] Notification compose.
- [x] Dispatch/retry/delete.
- [x] Recipient detail.
- [x] Template CRUD/render.
- [x] Per-user preferences (owner).
- [x] Tests for smart permissions and notification payload parsing.

**Exit criteria**

- Recommendations are actionable without Swagger.
- Notification administration is possible from the UI.

#### Phase 4 implementation notes (2026-11-22)

- SMART reorder list accepts a status filter (`PENDING`, `APPROVED`, `REJECTED`, `ALL`), defaulting to pending.
- Added the `/smart-reorders` page with summary cards, status tabs, generate-all, generate-one, manual create, approve (optional draft PO), reject with reason, and owner-only delete.
- Dashboard recommendations still use the pending default.
- Notification admin page supports manual/template compose, recipient selection, status/channel filters, cursor load-more, detail recipients, dispatch/force dispatch, retry, and delete.
- Notification detail shows recipient attempts, last attempt, next attempt, and owner-only error details.
- Notification list accepts server-side status/type filters.
- Approve/reject are enforced server-side for owner and inventory manager; delete remains owner-only.
- Notification templates have list, owner-only create/edit/delete, and render preview.
- Owner-only per-user notification preferences dialog added.
- Added role-aware routes/sidebar entries.

Verification:

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS (server 544 unit + 15 integration; client 105)
npm run build      PASS (Vite chunk-size warning only)
```

---

### Phase 5 — Reporting and dashboard completion

**Size:** Medium  
**Dependencies:** Phases 0–3

- [x] Add missing dashboard service methods.
- [x] Reporting page.
- [x] Date-range analytics.
- [x] By-cashier/by-category/top-selling/profit views.
- [x] CSV export.
- [x] Supplier counts.
- [x] Remove hardcoded dashboard datasets.
- [x] Role-aware quick actions/widgets.
- [x] Tests for report range serialization and CSV filenames (network download not unit-tested).

**Exit criteria**

- Every reporting endpoint is used or explicitly deferred.
- No hardcoded chart data remains.

#### Phase 5 implementation notes (2026-11-22)

- Added `/reports` with date-range KPIs, cashier/category tables, top-selling, sales year summary, purchases by status, and supplier counts.
- Top-selling is labelled all-time and purchase status counts are labelled all-time; only the purchases total is current-month, matching the server endpoints.
- A note documents that month/year cards use the server reporting timezone while range reports use browser-local dates.
- Added typed dashboard service methods for range, cashier, category, top-selling limit, sales year, suppliers, and CSV export.
- CSV export downloads sales/purchases/returns (range) and inventory snapshot files.
- Date ranges send the selected start day and the next local midnight as an exclusive end, matching the server's `[from, to)` bounds.
- Quick Actions are role-aware, and a Reports shortcut was added.
- Added `reportRange.test.ts` for defaults, range expansion, invalid ranges, and filenames.

Verification:

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS (server 544 unit + 15 integration; client 109)
npm run build      PASS (Vite chunk-size warning only)
```

---

### Phase 6 — Users and audit

**Size:** Medium  
**Dependencies:** Phase 0

- [x] User edit dialog.
- [x] Role change.
- [x] Delete user.
- [x] Admin reset-password.
- [x] Force-logout.
- [x] Search/filter/pagination.
- [x] Real user stats.
- [x] Audit log page (owner only).
- [x] Tests for role change/self-protection.

**Exit criteria**

- User administration matches server rules.

#### Phase 6 implementation notes (2026-11-22)

- Replaced the divergent user type with the server's public-user shape.
- Added server-side user search/role/status filters and cursor load-more.
- Added edit-profile, role-change, reset-password, force-logout, activation, and hard-delete actions.
- Self-destructive actions are hidden for the signed-in user.
- User stats use the global active/inactive endpoints.
- Added the owner-only `/audit` page with action/actor/entity/status/date filters, load-more, detail metadata, and public-user actor resolution.
- Added `GET /users/stats` for aggregate counts and switched user stats to it.
- Audit rows now include a populated `actor` object, avoiding the first-100 user lookup cap for display.
- Added a shared server-searched user picker used by the audit actor filter and per-user preferences; notification compose uses the shared server-search hook with its multi-select UI.
- Added `userPermissions.test.ts`, `auditQuery.test.ts`, and a server user-stats test.

Verification:

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS (server 544 unit + 15 integration; client 122)
npm run build      PASS (Vite chunk-size warning only)
```
- Audit rows are readable and filterable.

---

### Phase 7 — Quality, tests, and polish

**Size:** Medium  
**Dependencies:** All phases

- [x] Add jsdom + RTL + user-event + request mocking.
- [ ] Component tests for every critical flow (payment and user actions are covered; sale/receive/return/stocktake/adjustment remain).
- [ ] Hook tests with `QueryClientProvider`.
- [x] Service contract tests (user service via MSW).
- [ ] Optional OpenAPI type generation (deferred).
- [x] Add shared loading/empty/error state components and apply to key pages.
- [ ] Accessibility pass on all dialogs/forms (axe added; one surface covered).
- [ ] Responsive table pass (key tables wrapped; full audit remains).
- [x] Remove remaining dead code and confirmed-unused dependencies.
- [x] Update `docs/testing.md` and `server/docs/project-status.md`.

**Exit criteria**

- Critical flows have client tests.
- Full quality gate passes.

#### Phase 7 implementation notes (2026-11-23)

- Added jsdom, React Testing Library, user-event, MSW, and vitest-axe.
- Split client Vitest into `unit` (Node), `contract` (jsdom + MSW), and `ui` (jsdom) projects with a shared setup and render helper.
- Added component tests for payment recording and user actions, plus an axe check on shared user stats.
- Added MSW contract tests for `GET /users` blank-search handling and `GET /users/stats`; they run in the `contract` project because axios needs the browser adapter for relative URLs.
- Added shared `EmptyState`, `ErrorState`, and `TableSkeleton` components and applied them to user, inventory, and batch states.
- Added accessible labels to the user action menu and horizontal wrappers to key tables.
- Removed unused `SaleDetailsDialog`, `BatchColumns`, and confirmed-unused dependencies.
- Deferred OpenAPI generation and the remaining exhaustive component/hook/a11y pass.
- Remaining bundle-size warning is still documented and not suppressed.

Verification:

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS (server 544 unit + 15 integration; client 122)
npm run build      PASS (Vite chunk-size warning only)
npm run audit      PASS (0 production vulnerabilities)
```

---

## 12. Progress log

| ID | Item | Phase | Status |
|---|---|---|---|
| X-1 | Permission model and route guards | 0 | ✅ for existing routes |
| X-2 | Cursor pagination/load-more | 0 | 🟡 medicines pilot only |
| X-3 | Type/contract safety | 0/7 | 🟡 MSW contract tests added; OpenAPI types deferred |
| X-4 | Error/empty/loading/404 | 0/7 | ✅ 404, role guards, error boundary |
| X-5 | Formatting helpers | 0 | ✅ |
| X-6 | Remove stubs/dead code/hardcoded data | 0 | ✅ |
| X-7 | Frontend test harness | 7 | 🟡 jsdom/RTL/MSW/axe installed; critical-flow and hook coverage incomplete |
| C-1 | Purchase edit contract | 0 | ✅ |
| C-2 | FEFO batch selection | 0 | ✅ |
| C-3 | Batch adjust `remarks` | 0 | ✅ |
| C-4 | Receive-purchase payload | 0 | ✅ |
| C-5 | Purchase form fields | 0/3 | ✅ |
| C-6 | Credit payment posting | 1 | ✅ |
| C-7 | Customer identity | 1 | ✅ |
| C-8 | Cancel-sale copy | 0 | ✅ |
| C-9 | Batch/inventory stubs | 2 | ✅ |
| D-1 | Customers | 1 | ✅ |
| D-2 | Payments | 1 | ✅ |
| D-3 | Sales returns | 1 | ✅ |
| D-4 | Sale-item corrections | 1 | ✅ |
| D-5 | Inventory depth | 2 | 🟡 movements/reconciliation/reserve/release/sync done; movement detail and aggregate inc/dec remain |
| D-6 | Batch UI | 2 | ✅ |
| D-7 | Stocktakes | 2 | ✅ |
| D-8 | Purchase returns | 3 | ✅ |
| D-9 | Purchase depth | 3 | ✅ |
| D-10 | Supplier performance | 3 | ✅ |
| D-11 | Smart reorder actions | 4 | ✅ |
| D-12 | Notification admin/templates | 4 | ✅ |
| D-13 | Reporting/CSV | 5 | ✅ |
| D-14 | User administration | 6 | ✅ |
| D-15 | Audit log | 6 | ✅ |
| D-16 | Medicine search/barcode | 2 | ✅ lookup (camera deferred) |
| D-17 | Sale filters/update | 1/5 | ☐ |

---

## 13. Test and quality plan

### Per-phase verification

Run from the repository root:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run when dependencies change:

```bash
npm run audit
```

### Client testing additions

- Keep existing pure-logic tests.
- Add a jsdom environment for component tests.
- Add `@testing-library/react` and `@testing-library/user-event`.
- Add a request mocking layer (`msw` or axios mock adapter).
- Prefer behavioral assertions: visible text, enabled/disabled actions, query invalidation, and submitted payloads.

### Required coverage by flow

| Flow | Test type |
|---|---|
| Sale creation + FEFO display | Component + service payload |
| Credit payment settlement | Hook/service |
| Return create → approve → complete | Component + service |
| Receive purchase (partial) | Component + payload |
| Batch adjustment | Hook/service |
| Stocktake completion | Component + payload |
| Role-gated route/action | Component |
| Pagination/load-more | Hook |
| CSV download | Service |

### Contract tests

- Assert method, path, and query serialization for each service.
- Assert error handling for 400/401/403/404/409.
- If OpenAPI types are adopted, add a check that regenerated types are current.

---

## 14. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| 1 | FEFO vs manual batch selection | Remove manual selection; rely on FEFO; show estimates and reload the invoice |
| 2 | Customer model | `customerId` primary with free-text walk-in fallback |
| 3 | Sale cancellation | Rename to “Delete and restore stock” now; add a true `CANCELLED` status only with server support |
| 4 | Pagination UX | Load-more + explicit end state (matches cursor API) |
| 5 | Reporting layout | One `/reports` page with tabs |
| 6 | Type strategy | Start with typed services + contract tests; consider generated OpenAPI types later |
| 7 | Server changes | Prefer client-only parity; allow targeted server fixes only where the client cannot be correct (e.g. honoring `batchId`) |
| 8 | Barcode camera | Defer; implement lookup by typed barcode first |
| 9 | E2E tests | Defer Playwright until core phases land |

---

## 15. Non-goals

These are documented server gaps or explicit product deferrals and are **not** part of this client parity effort:

- external payment gateways (eSewa/Khalti/Stripe);
- MFA and Google OAuth;
- prescription management;
- multi-branch/multi-tenant support;
- Docker/NGINX deployment;
- reservation-to-order linkage;
- barcode camera scanning (lookup only in this plan);
- arbitrary server-side sorting/date filters beyond documented endpoints.

---

## 16. Definition of done

- Every server endpoint with a user-facing purpose is wired to the client or explicitly deferred here with a reason.
- No client service calls a missing method/path.
- The client RBAC matrix matches the server.
- All paginated lists support load-more.
- Credit sales, returns, purchase receiving, stock adjustments, and stocktakes have client tests.
- No hardcoded dashboard data or debug stubs remain.
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.
- `npm run audit` passes if dependencies changed.
- `docs/testing.md` and `server/docs/project-status.md` reflect the new coverage.

---

## 17. Related documents

- [README](README.md)
- [AGENTS](AGENTS.md)
- [API endpoints](server/docs/api/endpoints.md)
- [Project status](server/docs/project-status.md)
- [Testing](docs/testing.md)
- [Security](docs/security.md)
- [CI/CD](docs/ci-cd.md)
