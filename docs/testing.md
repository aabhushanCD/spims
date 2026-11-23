# Testing

## Framework

- **Vitest 5.1.1** with the Node environment on both packages.
- Server coverage via `@vitest/coverage-v8`.
- Configuration: `server/vitest.config.ts` and `client/vitest.config.ts`.
- Tests live next to the code as `*.test.ts`.

The frontend harness is intentionally minimal: Node environment, pure logic
only, no jsdom and no React Testing Library. It covers the notification socket
URL resolver and the inbox cache updater. Component and hook behaviour is
verified manually; add jsdom + Testing Library before claiming component
coverage.

## Commands

From the repository root:

```bash
npm test                 # unit + integration (server + client)
npm run test:unit        # unit tests only (server + client)
npm run test:watch       # server watch mode
npm run test:coverage    # server coverage report in server/coverage
npm run test:integration # HTTP + migration/seeder flows against in-memory MongoDB
```

From `server/`:

```bash
npm test                 # watch mode (matches the existing script name)
npm run test:ci          # single run for CI
npm run test:run         # alias of test:ci
npm run test:coverage
npx vitest run src/modules/sales/services/sales.service.test.ts
```

From `client/`:

```bash
npm test                 # single run of the pure-logic frontend tests
npm run test:watch       # watch mode
```

## Current coverage

As of the latest client-parity Phase 5 baseline: **80 server unit test files,
544 tests** plus **15 integration cases (10 HTTP + 5 migration/seeder)** and
**26 client test files, 114 tests**, all passing.
Overall statement coverage
is still modest because the coverage report includes the entire backend
(controllers, routes, providers, models). Coverage of the targeted business
logic is:

| Area | File | Line coverage |
|---|---|---|
| FEFO / stock allocation | `server/src/modules/inventory/services/inventory.service.ts` | ~62% |
| Sales totals and VAT | `server/src/modules/sales/services/sales.service.ts` | ~78% |
| Sale-item corrections | `server/src/modules/sales/services/saleItem.service.ts` | covered by unit tests |
| Returns and refunds | `server/src/modules/sales/services/return.service.ts` | ~87% |
| Purchase totals | `server/src/modules/purchase/utils/purchaseTotals.ts` | 100% |
| Reporting periods | `server/src/shared/utils/reportingPeriod.ts` | covered by unit tests |
| Reorder algorithm | `server/src/modules/smartReorder/utils/smartReorder.Calculatro.ts` | 100% |
| Authentication | `server/src/modules/auth/services/auth.service.ts` | ~72% |
| Role authorization | `server/src/shared/middleware/authorize.ts` | 100% |
| MongoDB error mapping | `server/src/shared/utils/mongoError.ts` | mapped error paths covered |
| Batch FEFO query + atomic deduction | `server/src/modules/batch/repo/medicineBatch.repo.ts` | query paths covered |

This is **not** complete coverage. Nine HTTP flows exercise routing and real
MongoDB transactions through `createApp()`, and five migration/seeder tests
exercise ordered backfills and idempotency. Redis, WebSocket delivery, cron jobs,
and live SMTP/SMS providers remain covered only by fakes or not at all.

## What is tested

| File | Focus |
|---|---|
| `auth.service.test.ts` | Registration conflicts/verification email, login status checks, lockout, refresh rotation/reuse detection, email verification, password reset/version bump, logout deny-list, session listing/revocation, current user |
| `loginAttemptTracker.test.ts` | Threshold lock, normalized-email scoping, success reset, Redis fail-open |
| `verifyToken.test.ts` | Valid token, deny-listed session, stale token version, deleted user, legacy token, fail-open on store errors |
| `audit.service.test.ts` | Metadata redaction/truncation, best-effort failure, cursor page, depth limit |
| `allowedOrigins.test.ts` | Environment allow-list parsing, fallback, exact match, production Origin requirement |
| `openapi.test.ts` | OpenAPI version/scheme, mounted-prefix coverage, operation metadata, local `$ref` integrity |
| `runner.test.ts` | Migration ordering, ledger skips, dry run, failure not recorded, duplicate ids, status |
| `payment.service.test.ts` | Ledger summary, credit settlement, overpayment rejection, refund/reversal rows |
| `customer.service.test.ts` | Create/detail/update/delete and 404 paths |
| `purchaseReturn.service.test.ts` | Pending creation, received-order guard, batch quantity guard, completion stock deduction |
| `vat.config.test.ts` | Default/override/validation/fallback |
| `verifyOrigin.middleware.test.ts` | Allow-list, missing-Origin dev/prod policy |
| `dashboard.csv.test.ts` | Inventory snapshot, CSV formula neutralization, missing range |
| `stocktake.service.test.ts` | Variance creation, completion stock application, closed guard |
| `migrationsAndSeed.integration.test.ts` | Real backfills, ledger idempotency, seed idempotency/dry run, non-owner guard |
| `authTokens.test.ts` | Access/refresh signing, token-type separation, hashing and constant-time comparison |
| `rateLimit.middleware.test.ts` | Under-limit pass-through, 429 + `Retry-After`, Redis failure fails open |
| `user.service.test.ts` | Owner-only create/update/delete/toggle/role changes, admin reset/force logout, session revocation and token-version bumps, password hashing, invalid-role rejection, aggregate user stats |
| `user.route.test.ts` | Static-before-dynamic ordering, single status route, removed `/:id/inactive`, role-change route |
| `user.schema.test.ts` | ObjectId/role/status/date params, strict delete body |
| `register.schema.test.ts` | Public registration strips a supplied `role` |
| `validate.middleware.test.ts` | Body/params/query parsing, Express query getter replacement, existing 400 shape |
| `globalError.middleware.test.ts` | AppError passthrough, `CastError` → 400, unknown error → 500 |
| `batch.schema.test.ts` | Batch create/update, dates, ObjectIds, quantities, movement metadata, thresholds |
| `inventory.schema.test.ts` | Phase 2 create contract, derived-field rejection, operation movement types |
| `inventoryMovement.schema.test.ts` | All nine reference types, defaults, malformed ids |
| `sales.schema.test.ts` | Item ObjectIds, optional `batchId`, 0–100 line discount, editable sale fields, sale-item correction rules |
| `return.schema.test.ts` | No body `performedBy`, id/condition validation, remarks, status filter, reason updates |
| `return.model.test.ts` | Unique `returnNumber` index, required line VAT, status enum |
| `return.repo.test.ts` | Status filtering, atomic transitions, outstanding quantities, refund range, active-sale guard |
| `return.routes.test.ts` | Full lifecycle route table, no DELETE |
| `return.service.test.ts` | Quote-only creation, outstanding accounting, invoice-discount apportionment, transitions, completion stock/refund/sale status, cumulative condition lines, revalidation, session lifecycle |
| `saleItem.service.test.ts` | Line + parent total recomputation, preserved invoice discount, returned-line and negative-total guards, session lifecycle |
| `purchase.schema.test.ts` | Optional dates, status stripping, VAT bound, item body without `purchaseOrderId`, receive schema + duplicate medicines |
| `purchaseTotals.test.ts` | VAT/discount purchase math and rounding |
| `purchaseOrderItem.repo.test.ts` | Single document save with and without a session |
| `sales.repo.test.ts` | `saleDate` totals, cancelled exclusion, timezone-aware year series |
| `saleItem.repo.test.ts` | Net-of-returns top selling, GOOD-only COGS reversal, cost-snapshot fallback, batch reference guard |
| `purchaseOrder.repo.test.ts` | `orderDate` purchase range |
| `money.test.ts` / `reportingPeriod.test.ts` / `reporting.config.test.ts` | Currency rounding/VAT, timezone boundaries, timezone configuration |
| `supplier.schema.test.ts` / `supplier.service.test.ts` | Contact normalization, open-PO delete guard |
| `medicine.repo.test.ts` / `inventory.repo.test.ts` | Active filtering, escaped regex search |
| `medicine.service.test.ts` | Unit existence on create/update |
| `brand/category/genericName/unit.service.test.ts` | Referenced-lookup delete guards |
| `escapeRegex.test.ts` | Metacharacter escaping and literal matching |
| `inventory.service.test.ts` | FEFO allocation across batches, stock limits, non-positive quantities, concurrent deduction conflict, return conditions, reserve/release |
| `sales.service.test.ts` | Empty cart, duplicate line merging, line and invoice discounts, discounted-subtotal bound, 13% VAT rounding, delete guard |
| `purchaseOrder.service.test.ts` | Approval/cancel guards, forced pending status, VAT/discount totals, persisted recalculation, item update recalculation, guarded cascade delete, receive flow |
| `smartReorder.Calculatro.test.ts` | WADS, sample standard deviation, delay factor, lead time, safety stock, reorder point, ROQ, confidence |
| `medicineBatch.repo.test.ts` | FEFO sort/filter construction, transaction scoping, conditional stock decrement, sellable-filter sum |
| `medicineBatch.model.test.ts` | Positive/zero/negative quantities, inactive-with-stock rejection, expiry ordering |
| `batch.routes.test.ts` | Route table no longer exposes the removed allocation endpoint |
| `inventoryMovement.model.test.ts` | Every `referenceType` enum value validates; unknown values are rejected |
| `batch.service.test.ts` | Delete guards (stock, sale-item references), quantity mutation delegation |
| `authorize.test.ts` | Allowed role, denied role, unauthenticated request, empty permission list |
| `notification.service.test.ts` | Create/dedupe, InApp/email/SMS dispatch, retries, preferences, read state, pagination, hierarchy authorization, owner-only error detail, atomic claim contention, stale-claim recovery, attempt cap, missing-parent 404 |
| `notificationRecipient.repo.test.ts` | Retry sweep filter, claim compare-and-swap lock, parent-aware unread aggregation, idempotent mark-read, bulk delete |
| `notification.schema.test.ts` | Body/param/query validation, forced-retry flag parsing, preferences, `parseOrThrow` |
| `websocker.provider.test.ts` | No-socket false, open-socket send, closed-socket eviction, send-failure isolation |
| `email.provider.test.ts` | Production fail-fast without `SMTP_HOST`, allowed with host, development fallback |
| `sms.provider.test.ts` | Missing webhook, bearer header, 2xx, non-2xx body, network failure |
| `dashboard.service.test.ts` | Notification summary counts `Skipped` separately from `Failed`; COGS profit fixture, month comparison, year analytics, expiring count |
| `cursor.test.ts` | Cursor round-trip, malformed cursor rejection, filter shape, `nextCursor` trimming |
| `lock.provider.test.ts` | Redis `SET NX` acquisition, compare-and-delete release, skip/run helper |
| `redis.config.test.ts` | Explicit `REDIS_URL`, Upstash REST conversion, host/port fallback, unsupported scheme |
| `logger.test.ts` | JSON line output, secret redaction, `LOG_LEVEL` filtering |
| `smartReorder.service.test.ts` | Cached negative result stays 400, pending recommendation upsert, missing delivery dates, expiry lower bound, status-filter defaults |
| `smartReorder.routes.test.ts` | Approve/reject are owner + inventory manager; delete is owner-only |
| `indexes.test.ts` | Phase 5 indexes and smart-reorder partial unique index |
| `coreFlows.integration.test.ts` | Purchase receipt, sale + idempotency, return completion, disposal, reorder |
| `mongoError.test.ts` | Mapping and pass-through of MongoDB duplicate/cast/validation errors |
| `notificationSocketUrl.test.ts` (client) | Explicit WS URL, http(s)→ws(s), absolute API origin, relative `/api` via proxy origin, query/hash stripping, unparseable-origin fallback |
| `inboxCache.test.ts` (client) | Read-state update for plain and infinite inbox caches, global-count decrement on `pages[0]` only, already-read/missing no-ops, immutability |
| `reorderPermissions.test.ts` (client) | Smart-reorder manage/delete/action role gating |
| `reorderSummary.test.ts` (client) | High-confidence threshold (80), pending-only units, non-pending exclusion |
| `reportRange.test.ts` (client) | Current-month defaults, exclusive next-day range, invalid ranges, CSV filenames |
| `userPermissions.test.ts` (client) | Owner-only user management and self-action blocking |
| `auditQuery.test.ts` (client) | Blank filter omission, audit filter serialization, inclusive day end |
| `notificationPayload.test.ts` (client) | Template JSON parsing, primitive-value validation, notification-admin role helper |
| `permissions.test.ts` (client) | Role-aware navigation filtering |
| `format.test.ts` (client) | Currency, date, and percent formatting |
| `saleQuery.test.ts` / `salePayload.test.ts` (client) | Blank-search omission, FEFO payload contract |
| `invoiceMapper.test.ts` (client) | Invoice batch mapping and payment summary |
| `validatePayment.test.ts` (client) | Partial/full/over-payment validation |
| `purchaseItemDiff.test.ts` / `receiptRows.test.ts` (client) | Purchase item diffing and multi-batch receipt totals |

## Test isolation

- No test connects to MongoDB or Redis.
- Services receive fake repositories through constructor injection. The fakes
  are defined per test file and reset with `clearMocks`/`restoreMocks`.
- Transactional services receive a fake `startSession()` whose
  `withTransaction` executes the callback. No production data is touched.
- JWT tests set and restore `process.env.JWT_SECRET`,
  `process.env.JWT_REFRESH_SECRET`, and `process.env.CLIENT_URL`.
- Auth mail is injected as a fake mailer; no SMTP connection is opened.
- Notification tests mock `push` and `sendEmail`; SMS tests stub global `fetch`
  and never call a real provider.
- Rate-limit tests inject a fake Redis store.
- No test depends on wall-clock ordering. Date-sensitive assertions use fixed
  dates or compare against a captured `before` timestamp.

## Adding a test

1. Put the test next to the unit under test: `thing.service.test.ts`.
2. Use real `AppError` so status codes are asserted.
3. Mock only the methods used by the code path.
4. Await every rejection assertion.
5. Assert observable behaviour (return values, repository calls, persisted
   totals), not implementation details.
6. Keep the test deterministic: no live network, no shared database state.

Example:

```ts
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../../shared/error.ts";

describe("SomeService", () => {
  it("rejects invalid input", async () => {
    const repo = { findById: vi.fn().mockResolvedValue(null) };
    const service = new SomeService(repo as never, AppError);

    await expect(service.getById("missing")).rejects.toMatchObject({
      message: "Not found",
      statusCode: 404,
    });
  });
});
```

## Integration testing

`npm run test:integration` runs ten HTTP tests against `app/createApp.ts`,
using `supertest`, a `mongodb-memory-server` replica set for transaction
support, and an in-memory fake Redis. Each test gets a clean database, while
indexes are preserved so unique constraints are exercised.

Covered flows:

1. Purchase create → approve → receive, including duplicate-receive rejection.
2. Sale with FEFO, idempotency-key replay, multiple sales without keys,
   movement ledger, and aggregate update.
3. Return create → approve → complete with GOOD stock restoration and refund.
4. Expiry marking → disposal, zero stock, aggregate sync, and `EXPIRED` movement.
5. Smart reorder generation, single pending recommendation, and negative-cache
   `400` semantics.
6. Owner force-logout: the target access token is rejected with `SESSION_REVOKED`
   and an audit row is written.
7. Helmet security headers on a public route.
8. Swagger UI HTML and the raw OpenAPI JSON document.
9. Customer create → credit sale → payment → invoice payload with zero amount due.

A second integration file runs five migration/seeder tests against an in-memory
MongoDB: ordered application, ledger skips, dry runs, sale-item cost and
inventory-version backfills, seed idempotency, dry-run planning, and the
non-owner promotion guard.

The app factory mounts routes and middleware without starting HTTP listeners,
WebSocket, cron jobs, MongoDB, or Redis. The production `server.ts` still owns
those startup concerns.
