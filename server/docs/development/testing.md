# Testing

> **Update:** The quality-gate infrastructure now runs Vitest, ESLint,
> `tsc --noEmit`, and the production build in CI. The authoritative current
> guide is [`docs/testing.md`](../../../docs/testing.md). The audit below is
> retained for historical context; its “CI does not run tests” notes are no
> longer accurate.

## 1. Current test setup

| Item | Value |
|---|---|
| Framework | Vitest 5.1.1 |
| Scripts | `npm test` (watch), `npm run test:ci` (once), `npm run test:coverage` |
| Config file | `vitest.config.ts` |
| Test files | 65 unit files plus 1 HTTP integration suite covering auth, users, validation middleware, inventory, stock mutation, sales, returns, purchases, batches, pagination, caching, locking, observability, reorder math, authorization, notifications, catalog lookups, suppliers, SMS, websocket, email config, dashboard |
| Test count | 454 unit tests + 6 HTTP integration tests |
| Coverage | V8 via `@vitest/coverage-v8` |
| CI | Runs `npm run test:coverage` |

## 2. The existing suite

Source: `server/src/modules/auth/services/auth.service.test.ts`

Mocks:

- `bcrypt` with only `hash` mocked.
- A user repository object with `findByEmail` and `create` mocks.
- An `AppError` object with `conflict`, `notFound`, `badRequest`, `unauthorized` mocks.

Tests:

| Test | What it checks |
|---|---|
| Duplicate user | `registerUser` rejects with `User already exists`; repository create not called |
| Successful registration | Password is hashed and the repository receives the hashed value |
| Hashing failure | Rejection propagates; create not called |
| User not found | `loginUser` rejects with `User not found` |

Observations:

- The fourth test calls `expect(promise).rejects.toThrow(...)` without `await` or `return`, so Vitest may not wait for the assertion to settle. It can produce a false positive.
- `import { mock } from "node:test"` is unused.
- No test covers token generation, cookie behavior, role validation, `isActive`, or login success.
- The original auth suite had no integration coverage; see section 7 for the
  current HTTP suite.

## 3. Running tests

```bash
cd server
npm run test:run        # single run
npm test                # watch mode
```

Verified in this audit: `npx vitest run` completed with **1 file passed, 4 tests passed** on the installed toolchain.

To run a single file:

```bash
npx vitest run src/modules/auth/services/auth.service.test.ts
```

## 4. Prerequisites and likely failures

- `bcrypt` is a native module declared in `devDependencies`. It must be built for the local Node version. On Windows, a prebuilt binary is normally downloaded; a toolchain may be required otherwise.
- No test needs MongoDB or Redis because everything is mocked.
- If `bcrypt` cannot load, the suite fails before running.
- If `npm ci --omit=dev` was used, Vitest and bcrypt are absent.

## 5. Why coverage is low

- Services are constructed with concrete repositories; there are no interfaces, so mocking requires object literals with `as any` (as the existing test does).
- Many services require a `mongoose.Connection` and use sessions, making unit tests harder.
- There are no fixtures, factories, or in-memory database setup.
- No test utilities or setup file.

## 6. How to add a unit test

Follow the existing pattern:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SomeService } from "./some.service.ts";

vi.mock("bcrypt", () => ({ default: { hash: vi.fn() } }));

describe("SomeService", () => {
  const repo = { findById: vi.fn(), create: vi.fn() };
  const appError = {
    notFound: vi.fn((m: string) => new Error(m)),
    badRequest: vi.fn((m: string) => new Error(m)),
  };

  beforeEach(() => vi.clearAllMocks());

  it("does the thing", async () => {
    repo.findById.mockResolvedValue({ _id: "1" });
    const service = new SomeService(repo as any, appError as any);
    await expect(service.doSomething("1")).resolves.toEqual({ _id: "1" });
  });
});
```

Guidelines:

- Always `await` rejection assertions.
- Mock only the methods the code path uses.
- For transaction-based services, pass a fake connection with `startSession` returning an object whose `withTransaction` invokes the callback.
- Keep tests next to the service with `.test.ts`.

## 7. Integration testing

The Phase 5 suite lives in `test/integration/coreFlows.integration.test.ts` and runs with `npm run test:integration`.

| Dependency | Implementation |
|---|---|
| MongoDB | `mongodb-memory-server` replica set (transactions supported) |
| Redis | In-memory fake covering cache, rate-limit, and lock calls |
| HTTP | `supertest` against `createApp()` |
| Auth | Seeded owner plus a generated access-token cookie |
| Cleanup | Database dropped and fake Redis flushed before each test |

Covered flows:

1. Purchase create → approve → receive, duplicate receive rejected.
2. Sale with FEFO, idempotency replay, multiple keyless sales, movement, and
   aggregate update.
3. Return create → approve → complete with GOOD restoration and refund.
4. Expiry marking → disposal, aggregate sync, and `EXPIRED` movement.
5. Smart reorder generation, single pending recommendation, negative cache.

Still worth adding later: auth register/login/refresh, notification dispatch over WebSocket, and concurrent-sale HTTP tests.

## 8. Static checks

ESLint (`eslint.config.js`), a dedicated `npm run typecheck` (`tsc --noEmit`),
and `npm run lint` are configured. CI runs lint, type check, tests, and build.

Recommended local sequence:

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

## 9. Known testability blockers

| Blocker | Impact |
|---|---|
| Concrete repository classes, no interfaces | Mocking requires `as any` |
| Services depend on Mongoose `Connection` | Session mocking required |
| Email provider uses a lazy transport | Tests should still inject a fake mailer; no network is opened at import |
| Redis client created at import | Cache-dependent code is hard to import in isolation |
| Controllers import from the container | Route-level tests need module mocking or a test container |
| No app factory separate from `server.ts` | `supertest` needs refactoring or a child process |
| Native bcrypt | Platform-specific install issues |

## 10. Gaps summary

| Area | Status |
|---|---|
| Auth unit tests | Implemented |
| Other service tests | Implemented for core modules (inventory, sales, returns, purchases, reorder, notifications) |
| Repository tests | Implemented for batches and notification recipients |
| Controller/route tests | Partially Implemented (batch route table) |
| Integration/E2E tests | Not Implemented |
| Coverage reporting | Not Implemented |
| CI test execution | Implemented |
| Test data factories | Not Implemented — per-file fakes instead |

## Related documents

- [Development workflow](development-workflow.md)
- [Setup and installation](setup-and-installation.md)
- [Project status](../project-status.md)
