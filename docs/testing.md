# Testing

## Framework

- **Vitest 4** with the Node environment.
- Coverage via `@vitest/coverage-v8`.
- Configuration: `server/vitest.config.ts`.
- Tests live next to the code as `*.test.ts`.

The frontend has no unit-test harness yet. Its CI gate is lint, type check, and
production build. Add Vitest + React Testing Library if component behaviour
needs coverage later.

## Commands

From the repository root:

```bash
npm test                 # single CI run (server)
npm run test:watch       # watch mode
npm run test:coverage    # coverage report in server/coverage
```

From `server/`:

```bash
npm test                 # watch mode (matches the existing script name)
npm run test:ci          # single run for CI
npm run test:run         # alias of test:ci
npm run test:coverage
npx vitest run src/modules/sales/services/sales.service.test.ts
```

## Current coverage

As of the authentication/security change: **12 test files, 109 tests**, all
passing. Overall statement coverage is still modest because the coverage report
includes the entire backend (controllers, routes, providers, models). Coverage
of the targeted business logic is:

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
| `user.service.test.ts` | Admin-created verified users, password hashing on update, invalid-role rejection |
| `inventory.service.test.ts` | FEFO allocation across batches, stock limits, non-positive quantities, concurrent deduction conflict, return conditions, reserve/release |
| `sales.service.test.ts` | Empty cart, duplicate line merging, line and invoice discounts, 13% VAT rounding, discount validation |
| `return.service.test.ts` | Refund net of line discount, full vs partial status, over-return, invalid item, date validation, condition handling |
| `purchaseOrder.service.test.ts` | Approval guards, cancellation guards, duplicate item guard, pending-only edits, total recalculation |
| `smartReorder.Calculatro.test.ts` | WADS, sample standard deviation, delay factor, lead time, safety stock, reorder point, ROQ, confidence |
| `medicineBatch.repo.test.ts` | FEFO sort/filter construction, transaction scoping, conditional stock decrement |
| `authorize.test.ts` | Allowed role, denied role, unauthenticated request, empty permission list |
| `mongoError.test.ts` | Mapping and pass-through of MongoDB duplicate/cast/validation errors |

## Test isolation

- No test connects to MongoDB or Redis.
- Services receive fake repositories through constructor injection. The fakes
  are defined per test file and reset with `clearMocks`/`restoreMocks`.
- Transactional services receive a fake `startSession()` whose
  `withTransaction` executes the callback. No production data is touched.
- JWT tests set and restore `process.env.JWT_SECRET`,
  `process.env.JWT_REFRESH_SECRET`, and `process.env.CLIENT_URL`.
- Auth mail is injected as a fake mailer; no SMTP connection is opened.
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
- `email.provider.ts` creates an Ethereal account at import time.
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
