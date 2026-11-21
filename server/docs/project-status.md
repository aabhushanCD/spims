# Project Status

Assessment of the backend as found in the repository. Status labels: **Implemented**, **Partially Implemented**, **Not Implemented**, **Unverified**.

## 1. Overall assessment

The backend is a working prototype of a single-pharmacy inventory and POS system. Core flows are present end to end: catalog, suppliers, purchasing, FEFO sales, VAT, returns, dashboard, and reorder recommendations. Authentication and role checks exist. The blocking schema defects were remediated, Phase 2 consolidated stock writes into one transactional path, Phase 3 hardened user authorization and request validation across modules, and Phase 4 corrected return, sales, purchase, and reporting financials.

It is not production-hardened. The main risks are:

- Aggregate stock still depends on operational sync after expiry flagging and on deduping existing inventory rows before the unique index deploys.
- Authorization remains broad outside user management.
- Historical financial data (VAT-exclusive purchase totals, pre-Phase-4 returns without line VAT) is not backfilled.
- Automated coverage remains modest; there are no HTTP integration tests.
- Several list endpoints still lack pagination and filtering.

## 2. Endpoint and model inventory

| Metric | Count |
|---|---|
| Mongoose models | 22 |
| Router files | 18 (including `app.routes.ts`) |
| Mounted route prefixes | 17 |
| Route registrations (actual calls) | 152 (one additional line is commented out) |
| Distinct live handlers | 152 |
| Endpoint rows documented | 142 (128 with a method column + 14 dashboard `GET` rows; 152 live registrations) |
| Transactions | 7 flows |
| Cron jobs | 3 active, 1 dead duplicate |
| Tests | 58 files, 425 cases |

## 3. Module status matrix

| Module | Status | Evidence | Main gaps |
|---|---|---|---|
| Authentication | Implemented | Register/login/refresh/logout, email verification, password reset, multi-session management, rate limiting, 15m access + 7d refresh | No MFA, no account lockout, no immediate access-token revocation |
| Users & roles | Implemented | CRUD, activation toggle, owner-only writes, JWT-authoritative delete, role-change route, hashed password updates, public responses sanitized | Pagination/search, audit trail, admin password reset |
| Medicine catalog | Implemented | CRUD + 4 lookup tables, duplicate checks, unit validation, reference-safe lookup deletes, escaped search, active filtering | No pagination; name+strength+brand uniqueness is service-only |
| Suppliers | Implemented | CRUD, email/phone uniqueness, input validation, open-PO delete guard | No phone index, unused reliability field |
| Inventory (aggregate) | Implemented | CRUD, increase/decrease, reserve/release, sync, single write path, unique medicine index, runtime request/movement validation | Expiry flagging still needs a follow-up sync |
| Batches & expiry | Implemented | CRUD, FEFO query, expiry flagging, atomic disposal, movements on every stock change, request validation | No movement history endpoint; zero-stock batch deletion can leave dangling references |
| Purchases | Implemented | Create/approve/receive, VAT/discount-aware persisted totals, recalc on item edits, guarded cascade delete, runtime receive schema | No partial receipt, no PO numbering |
| Sales | Implemented | FEFO allocation, VAT, invoice counter, transaction, session cleanup, validated params, sale-item corrections recompute totals, delete guarded by returns | No payment ledger |
| Returns | Implemented | PENDING → APPROVED/REJECTED/CANCELLED → COMPLETED workflow, outstanding-quantity accounting, VAT-inclusive refunds, correct GOOD/write-off semantics, unique return number | No return reversal or refund payment record |
| Notifications | Implemented | Create/dispatch with atomic claim, inbox, WS/email/SMS, retries, preferences, read state, cursor pagination, hierarchy authz | Templates out of scope; multi-instance retry sweep; legacy backfill/dedupe is a deployment step |
| Smart reorder | Implemented | WADS/SS/ROP/ROQ/confidence, cron, cache, approve/reject | No PO creation, stale cache, no dedupe, missing date handling |
| Dashboard/reporting | Implemented | 14 endpoints, 8-part cached payload, COGS profit, saleDate-based periods, timezone-aware year series, returns excluded from top selling | Dashboard cache not invalidated; no arbitrary date ranges |
| Redis caching | Partially Implemented | Dashboard + reorder cache | No invalidation, fragile connection config, hard startup dependency |
| Background jobs | Implemented | 3 cron jobs (incl. notification retry) + job audit records | In-process, no lock; retry sweep intentionally unrecorded |
| WebSocket | Implemented | Cookie-auth upgrade, per-user push | No heartbeat/acks/rooms, offline marked Sent |
| Email | Implemented | Lazy Nodemailer transport, HTML auth emails, console fallback | No retry/bounce tracking; real SMTP must be configured |
| Swagger/OpenAPI | Not Implemented | Stubs exist | Not mounted, most files empty, `swagger-jsdoc` not a dependency |
| Pagination/search | Not Implemented (notifications only) | — | Other list endpoints return everything |
| Payments | Not Implemented | Payment method string only | No gateway/ledger/refund transaction |
| Purchase returns | Not Implemented | — | No route/model |
| Prescriptions/barcode scanning | Not Implemented | Barcode field only | No scanning or prescription flow |
| Docker/deployment assets | Not Implemented | — | No Dockerfile/compose/NGINX config in repo |
| Automated tests | Partially Implemented | 58 suites / 425 tests | No HTTP integration tests; controllers, Redis, Mongo, and SMTP are mocked or uncovered |

## 4. Implemented features

- Short-lived access JWT + rotating refresh sessions stored as hashes, bcrypt password hashing on registration/user creation/reset.
- Email verification, password reset, multi-device session listing/revocation, and Redis-backed auth rate limiting.
- Role gates at router level for all protected modules.
- Medicine, brand, category, generic name, unit CRUD with Zod validation.
- Supplier CRUD with uniqueness checks.
- Purchase order creation and approval with transaction protection.
- Receiving logic (validation, one batch per line, expiry/manufacturing checks) now that batch validation accepts positive quantities.
- FEFO batch selection and atomic per-batch deduction.
- Sales with invoice counter, line/invoice discounts, 13% VAT, transaction.
- Sales returns with an approval lifecycle, outstanding-quantity guards, VAT-inclusive refunds, and sale status updates.
- Purchase totals that apply VAT and discount and are persisted on recalculation.
- Sale-item corrections that recompute line and parent totals.
- COGS-based profit and timezone-aware reporting.
- Batch expiry flagging, manual disposal, expiry notification.
- Inventory movement audit records for main flows.
- Dashboard summary and analytics endpoints.
- Smart reorder algorithm with formula-driven recommendations.
- Redis cache-aside for dashboard and reorder.
- WebSocket notification push.
- Background job tracking with stale-job detection.

## 5. Partially implemented features

| Feature | What works | What does not |
|---|---|---|
| RBAC | Role checks exist | All three roles can do nearly everything; users module has its own gate |
| Reservations | Reserve/release maintain `reservedStock` and `availableStock` | Not linked to orders; reconciliation clamps outstanding holds if batch truth drops |
| Returns | Full approval workflow, VAT refunds, correct GOOD/write-off stock semantics | No reversal/deletion; no refund payment record |
| Stock adjustments | Batch adjust endpoint | Writes movement and syncs; `StockAdjustment` service unreachable |
| Purchase totals | VAT/discount-aware totals persisted on recalculation | Historical pre-Phase-4 totals are not backfilled |
| Email notifications | Sending works if SMTP is reachable; auth emails have HTML templates | No retry/bounce tracking; console fallback when SMTP is unconfigured |
| SMS notifications | Implemented via `SMS_WEBHOOK_URL` | Requires `SMS_WEBHOOK_URL` and a recipient phone |
| Inventory reconciliation | Single transactional write path; sync filter applies in both session and non-session calls | Expiry flagging needs a follow-up sync |
| Dashboard analytics | COGS profit, year parameter, timezone-aware series, expiring count fixed | No arbitrary date-range analytics; cache still uninvalidated |
| Swagger | Two partial spec files | Not served, most files empty, missing dependency |
| Tests | 58 suites / 425 tests | No HTTP integration tests; controllers and external services are not exercised end-to-end |

## 6. Not implemented

- Purchase returns / supplier returns.
- Payment gateways, payment records, refunds, credit tracking.
- MFA, account lockout.
- CSRF protection tokens and security headers.
- Pagination, sorting, date-range filters on non-notification lists.
- File uploads (invoice file is a string).
- Google OAuth.
- Prescription management.
- Barcode scanning (only a barcode field and text search).
- Multi-branch or multi-tenant support.
- Docker/NGINX/CI deployment pipeline.
- Migrations/seeders.
- Audit log for auth/admin actions.
- Stock reconciliation report.
- Structured logging/metrics/tracing.

## 7. Unverified items (require a live environment)

| Item | Why |
|---|---|
| Redis connection with the deployed Upstash URL | REST URL may not be accepted by ioredis |
| MongoDB transaction behavior | Assumes a replica set |
| Actual index creation on an existing database | AutoIndex not observed |
| Zod v4 string-message overload behavior | Used widely; depends on v4 API |
| Runtime GOOD-return path | Enum mismatch fixed in model tests; full HTTP path not exercised against MongoDB |
| Live batch creation / purchase receiving | Validator fixed in model tests; full `save()` and HTTP flow not exercised against MongoDB |

### Phase 0 baseline (2026-11-20)

`npm run check:ci` was run from the repository root on the Phase 0 working tree:

| Gate | Result |
|---|---|
| `npm run lint` | PASS — 0 errors, 0 warnings (server and client) |
| `npm run typecheck` | PASS (server `tsc --noEmit`, client `tsc -b`) |
| Server tests | 22 files, 223 tests passed (Phase 0 baseline; current Phase 4 suite is 58 files, 425 tests) |
| Client tests | 2 files, 17 tests passed |
| `npm run build` | PASS (server `tsc`; client `tsc -b && vite build`; only the Vite chunk-size warning) |
| `npm run audit` | PASS — 0 production vulnerabilities in both packages |

### Verified during this audit

- `npx tsc --noEmit -p tsconfig.json` completes with no diagnostics.
- `npx vitest run` passes: 58 files, 425 tests (server).
- Model tests confirm active batches with stock validate, inactive batches with stock are rejected, and all nine `referenceType` values validate.

### Phase 4 state (2026-11-21)

- Returns now use a real `PENDING → APPROVED → COMPLETED` lifecycle with
  `REJECTED`/`CANCELLED` terminals; stock and refund are applied only at
  completion.
- Refunds include 13% VAT and apportion the original invoice-level discount;
  `returnItems.VAT` and `remarks` are persisted and `returnNumber` is unique.
- Sales totals are rounded, invoice discounts cannot exceed the discounted
  subtotal, sale-item corrections recompute parent totals, and deleting a sale
  with returns is blocked.
- Purchase totals apply VAT and discount and persist recalculation; receive
  validation was already wired; hard delete is guarded and cascades items.
- Reporting uses `saleDate`/`orderDate`, honours `year`, computes COGS-based
  profit, excludes returned units from top selling, fixes `expiringSoonCount`,
  and uses `REPORTING_TIMEZONE` (default `Asia/Kathmandu`). COGS reverses only
  GOOD returns and uses a sale-time cost snapshot; deleting a batch referenced
  by sales is blocked.

## 8. Highest-risk defects (ranked)

1. **Missing indexes** on `salesitems.salesId` and `returns.salesId`.
2. **Expiry flagging** changes the sellable set without syncing aggregates; the next mutation or sync call corrects it.
3. **List scalability** — pagination and filtering are still absent outside notifications.
4. **No HTTP integration suite** — route ordering, middleware, and transaction behavior are covered by unit tests but not end-to-end against MongoDB/Redis.
5. **Historical data** — pre-Phase-4 purchase totals are VAT-exclusive, old returns have no line VAT, and legacy sale items have no cost snapshot; no backfill exists.
6. **Dashboard cache** is not invalidated on writes (Phase 5).

## 9. Security posture

| Control | Status |
|---|---|
| Password hashing | Implemented on register/create/user update/password reset |
| JWT signing/verification | Implemented with separate access/refresh secrets and token-type checks |
| Token expiry | 15m access + 7d rotating refresh sessions |
| HttpOnly cookie | Yes (`token` + scoped `refreshToken`) |
| Secure/SameSite | Production: secure + `None`; dev: `Strict` |
| CSRF protection | Partial: Origin allow-list on auth routes; no CSRF token |
| Rate limiting | Implemented for auth endpoints (Redis, fail-open) |
| Input validation | Implemented for bodies, ObjectId params, and search/query schemas on module routes |
| Output sanitization | Auth and user responses strip password/refresh/reset hashes |
| Role enforcement | User writes are owner-only with service-level checks; other modules remain broadly shared |
| Secret management | `.env` + gitignore; startup validation for JWT/CLIENT in production |
| CORS | Allow-list with credentials |
| WebSocket origin check | Not Implemented |
| Audit logging | Partial movement log only |

## 10. Documentation vs repository claims

| Claim in root docs | Actual |
|---|---|
| Pagination | Implemented for notifications only |
| Refresh-token mechanism (`SECURITY.md`) | Implemented (rotating refresh sessions) |
| Email/SMS notifications (`README` future list) | Implemented; SMS requires a webhook |
| Payment recording | Only a payment method string |
| Swagger/OpenAPI | Unmounted stubs, missing dependency |
| Docker/NGINX/HTTPS/CI security checks (`SECURITY.md`) | Not present in repository |
| Backend at port 8000 | Default is 3000 |
| "Inventory updates automatically after every sale" | True for sales, not for all stock paths |
| "Batch history" | Endpoint returns metadata, not movements |

## 11. Recommended next steps

Engineering follow-up (Phase 3 items marked done):

1. ~~Fix the return reference type~~ (done); implement the confirmed condition semantics (GOOD restores the batch and aggregate; DAMAGED/EXPIRED/OPENED are write-offs).
2. ~~Resolve the batch `isActive` validator and add schema tests~~ (done).
3. Consolidate stock writes behind one service that always updates batch + aggregate + movement in a transaction.
4. ~~Fix the non-session `getTotalStock` filter~~ (done).
5. ~~Remove the destructive allocation endpoint~~ (done).
6. ~~Restrict role changes and user creation to `owner`~~ (done; service checks added).
7. ~~Privileged roles are already excluded from public registration; protect this with a regression test~~ (done).
8. ~~`isActive` at login and token revocation/refresh~~ (done: login rejects deactivated accounts; refresh sessions rotate and are revocable).
9. ~~Wire validation for users, inventory, batches, returns, sale updates, and purchase receive~~ (done, with ObjectId params and a global `CastError` mapper).
10. ~~Apply purchase VAT/discount and persist recalculated totals~~ (done).
11. Add indexes for `salesitems.salesId`, `returns.salesId`, and status/date queries (`inventories.medicineId` is now unique).
12. Add integration tests for sale, receipt, return, disposal, and reorder.
13. Replace console logging with structured logging and add readiness checks.
14. Fix the environment loading order and Redis URL handling.
15. Add client-side role gating for user-management actions so pharmacists see a clear disabled state instead of a `403`.

## 12. Documentation set

This audit produced 38 documents under `server/docs/`, covering architecture, database, API (including all endpoints), modules, business logic, infrastructure, development, and this status report. Source references are included throughout. At audit time no application code, schema, or dependency was modified; the blocker remediation and the Phase 0 doc reconciliation were applied afterwards.

## Related documents

- [Documentation index](README.md)
- [System overview](architecture/system-overview.md)
- [API overview](api/api-overview.md)
- [Inventory management](business-logic/inventory-management.md)
