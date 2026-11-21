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
npm test                 # single CI run (server + client)
npm run test:watch       # server watch mode
npm run test:coverage    # server coverage report in server/coverage
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

As of the Phase 3 baseline: **46 server test files, 335 tests** plus **2 client
test files, 17 tests**, all passing. Overall statement coverage
is still modest because the coverage report includes the entire backend
(controllers, routes, providers, models). Coverage of the targeted business
logic is:

| Area | File | Line coverage |
|---|---|---|
| FEFO / stock allocation | `server/src/modules/inventory/services/inventory.service.ts` | ~62% |
| Sales totals and VAT | `server/src/modules/sales/services/sales.service.ts` | ~78% |
| Returns and refunds | `server/src/modules/sales/services/return.service.ts` | ~87% |
| Reorder algorithm | `server/src/modules/smartReorder/utils/smartReorder.Calculatro.ts` | 100% |
| Authentication | `server/src/modules/auth/services/auth.service.ts` | ~72% |
| Role authorization | `server/src/shared/middleware/authorize.ts` | 100% |
| MongoDB error mapping | `server/src/shared/utils/mongoError.ts` | mapped error paths covered |
| Batch FEFO query + atomic deduction | `server/src/modules/batch/repo/medicineBatch.repo.ts` | query paths covered |

This is **not** complete coverage. Controllers, HTTP routing, real database
queries, Redis, WebSocket delivery, cron jobs, and email delivery are not
covered by automated tests.

## What is tested

| File | Focus |
|---|---|
| `auth.service.test.ts` | Registration conflicts/verification email, login status checks, refresh rotation/reuse detection, email verification, password reset, session listing/revocation, current user |
| `authTokens.test.ts` | Access/refresh signing, token-type separation, hashing and constant-time comparison |
| `rateLimit.middleware.test.ts` | Under-limit pass-through, 429 + `Retry-After`, Redis failure fails open |
| `user.service.test.ts` | Owner-only create/update/delete/toggle/role changes, password hashing, invalid-role rejection |
| `user.route.test.ts` | Static-before-dynamic ordering, single status route, removed `/:id/inactive`, role-change route |
| `user.schema.test.ts` | ObjectId/role/status/date params, strict delete body |
| `register.schema.test.ts` | Public registration strips a supplied `role` |
| `validate.middleware.test.ts` | Body/params/query parsing, Express query getter replacement, existing 400 shape |
| `globalError.middleware.test.ts` | AppError passthrough, `CastError` → 400, unknown error → 500 |
| `batch.schema.test.ts` | Batch create/update, dates, ObjectIds, quantities, movement metadata, thresholds |
| `inventory.schema.test.ts` | Phase 2 create contract, derived-field rejection, operation movement types |
| `inventoryMovement.schema.test.ts` | All nine reference types, defaults, malformed ids |
| `sales.schema.test.ts` | Item ObjectIds, editable sale fields, sale-item correction rules |
| `return.schema.test.ts` | No body `performedBy`, id/condition validation, reason updates |
| `purchase.schema.test.ts` | Optional dates, item body without `purchaseOrderId`, receive schema + duplicate medicines |
| `supplier.schema.test.ts` / `supplier.service.test.ts` | Contact normalization, open-PO delete guard |
| `medicine.repo.test.ts` / `inventory.repo.test.ts` | Active filtering, escaped regex search |
| `medicine.service.test.ts` | Unit existence on create/update |
| `brand/category/genericName/unit.service.test.ts` | Referenced-lookup delete guards |
| `escapeRegex.test.ts` | Metacharacter escaping and literal matching |
| `inventory.service.test.ts` | FEFO allocation across batches, stock limits, non-positive quantities, concurrent deduction conflict, return conditions, reserve/release |
| `sales.service.test.ts` | Empty cart, duplicate line merging, line and invoice discounts, 13% VAT rounding, discount validation |
| `return.service.test.ts` | Refund net of line discount, full vs partial status, over-return, invalid item, date validation, condition handling |
| `purchaseOrder.service.test.ts` | Approval guards, cancellation guards, duplicate item guard, pending-only edits, total recalculation |
| `smartReorder.Calculatro.test.ts` | WADS, sample standard deviation, delay factor, lead time, safety stock, reorder point, ROQ, confidence |
| `medicineBatch.repo.test.ts` | FEFO sort/filter construction, transaction scoping, conditional stock decrement, sellable-filter sum |
| `medicineBatch.model.test.ts` | Positive/zero/negative quantities, inactive-with-stock rejection, expiry ordering |
| `batch.routes.test.ts` | Route table no longer exposes the removed allocation endpoint |
| `inventoryMovement.model.test.ts` | Every `referenceType` enum value validates; unknown values are rejected |
| `authorize.test.ts` | Allowed role, denied role, unauthenticated request, empty permission list |
| `notification.service.test.ts` | Create/dedupe, InApp/email/SMS dispatch, retries, preferences, read state, pagination, hierarchy authorization, owner-only error detail, atomic claim contention, stale-claim recovery, attempt cap, missing-parent 404 |
| `notificationRecipient.repo.test.ts` | Retry sweep filter, claim compare-and-swap lock, parent-aware unread aggregation, idempotent mark-read, bulk delete |
| `notification.schema.test.ts` | Body/param/query validation, forced-retry flag parsing, preferences, `parseOrThrow` |
| `websocker.provider.test.ts` | No-socket false, open-socket send, closed-socket eviction, send-failure isolation |
| `email.provider.test.ts` | Production fail-fast without `SMTP_HOST`, allowed with host, development fallback |
| `sms.provider.test.ts` | Missing webhook, bearer header, 2xx, non-2xx body, network failure |
| `dashboard.service.test.ts` | Notification summary counts `Skipped` separately from `Failed` |
| `mongoError.test.ts` | Mapping and pass-through of MongoDB duplicate/cast/validation errors |
| `notificationSocketUrl.test.ts` (client) | Explicit WS URL, http(s)→ws(s), absolute API origin, relative `/api` via proxy origin, query/hash stripping, unparseable-origin fallback |
| `inboxCache.test.ts` (client) | Read-state update for plain and infinite inbox caches, global-count decrement on `pages[0]` only, already-read/missing no-ops, immutability |

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

There is no automated integration suite. The backend has known testability
blockers:

- `server/src/app/container.ts` constructs every service at import time.
- `server.ts` starts HTTP, WebSocket, cron jobs, MongoDB, and Redis at import.
- `email.provider.ts` lazily creates its transport; tests still inject a fake.
- `redis.config.ts` creates a client at import time.

To add database integration tests locally:

1. Start a MongoDB replica set (transactions require one).
2. Start Redis.
3. Point the tests at disposable services through environment variables.
4. Create an app factory that mounts routes without starting listeners or cron
   jobs, and inject a test container.
5. Use `supertest` for HTTP tests.
6. Drop the test database and flush the Redis test database between runs.

Until those refactors exist, do not claim integration coverage. Document any
manual verification separately.
