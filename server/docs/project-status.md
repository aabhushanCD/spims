# Project Status

Assessment of the backend as found in the repository. Status labels: **Implemented**, **Partially Implemented**, **Not Implemented**, **Unverified**.

## 1. Overall assessment

The backend is a working prototype of a single-pharmacy inventory and POS system. Core flows are present end to end: catalog, suppliers, purchasing, FEFO sales, VAT, returns, dashboard, and reorder recommendations. Authentication and role checks exist. The blocking schema defects were remediated, Phase 2 consolidated stock writes into one transactional path, Phase 3 hardened user authorization and request validation across modules, and Phase 4 corrected return, sales, purchase, and reporting financials.

It is not production-hardened. The main risks are:

- Aggregate stock still depends on operational sync after expiry flagging and on deduping existing inventory rows before the unique index deploys.
- Authorization remains broad outside user management.
- Historical financial data (VAT-exclusive purchase totals, pre-Phase-4 returns without line VAT) is not backfilled.
- Automated coverage remains modest, but five core HTTP flows now run against an in-memory MongoDB replica set.
- List endpoints have cursor pagination and filters; the client currently requests the first 100 rows.

## 2. Endpoint and model inventory

| Metric | Count |
|---|---|
| Mongoose models | 22 |
| Router files | 18 (including `app.routes.ts`) |
| Mounted route prefixes | 17 |
| Route registrations (actual calls) | 154 (one additional line is commented out) |
| Distinct live handlers | 154 |
| Endpoint rows documented | 144 (130 with a method column + 14 dashboard `GET` rows; 154 live registrations) |
| Transactions | 7 flows |
| Cron jobs | 3 active |
| Tests | 66 unit files / 458 cases + 6 HTTP integration cases |

## 3. Module status matrix

| Module | Status | Evidence | Main gaps |
|---|---|---|---|
| Authentication | Implemented | Register/login/refresh/logout, email verification, password reset, multi-session management, rate limiting, 15m access + 7d refresh | No MFA, no account lockout, no immediate access-token revocation |
| Users & roles | Implemented | CRUD, activation toggle, owner-only writes, JWT-authoritative delete, role-change route, hashed password updates, public responses sanitized, cursor pagination/search | Audit trail, admin password reset |
| Medicine catalog | Implemented | CRUD + 4 lookup tables, duplicate checks, unit validation, reference-safe lookup deletes, escaped search, active filtering, cursor pagination | Name+strength+brand uniqueness is service-only |
| Suppliers | Implemented | CRUD, email/phone uniqueness, phone index, reliability score persistence, input validation, open-PO delete guard | No supplier audit trail |
| Inventory (aggregate) | Implemented | CRUD, increase/decrease, reserve/release, sync, single write path, versioned compare-and-swap, unique medicine index, runtime request/movement validation | No stocktake/bulk adjustment workflow |
| Batches & expiry | Implemented | CRUD, FEFO query, expiry flagging with aggregate sync, atomic disposal, movements on every stock change, request validation, movement history, delete guard | No batch split/merge |
| Purchases | Implemented | Create/approve/receive, VAT/discount-aware persisted totals, recalc on item edits, guarded cascade delete, runtime receive schema | No partial receipt, no PO numbering |
| Sales | Implemented | FEFO allocation, VAT, invoice counter, transaction, session cleanup, validated params, sale-item corrections recompute totals, delete guarded by returns | No payment ledger |
| Returns | Implemented | PENDING → APPROVED/REJECTED/CANCELLED → COMPLETED workflow, outstanding-quantity accounting, VAT-inclusive refunds, correct GOOD/write-off semantics, unique return number | No return reversal or refund payment record |
| Notifications | Implemented | Create/dispatch with atomic claim, inbox, WS/email/SMS, retries, preferences, read state, cursor pagination, hierarchy authz | Templates out of scope; multi-instance retry sweep; legacy backfill/dedupe is a deployment step |
| Smart reorder | Implemented | WADS/SS/ROP/ROQ/confidence, cron, cache, approve/reject, invalidated caches, pending dedupe, safe date handling, reliability persistence | No PO creation |
| Dashboard/reporting | Implemented | 14 endpoints, 8-part cached payload with invalidation, COGS profit, saleDate-based periods, timezone-aware year series, returns excluded from top selling | No arbitrary date ranges |
| Redis caching | Implemented | Dashboard + reorder cache with invalidation; explicit `REDIS_URL`/Upstash target resolution | Redis still required at startup |
| Background jobs | Implemented | 3 cron jobs + job audit records + Redis distributed locks | Single-process scheduler; retry sweep intentionally unrecorded |
| WebSocket | Implemented | Cookie-auth upgrade, per-user push | No heartbeat/acks/rooms, offline marked Sent |
| Email | Implemented | Lazy Nodemailer transport, HTML auth emails, console fallback | No retry/bounce tracking; real SMTP must be configured |
| Swagger/OpenAPI | Not Implemented | Stubs exist | Not mounted, most files empty, `swagger-jsdoc` not a dependency |
| Pagination/search | Implemented | Cursor pagination on medicines, sales, purchases, inventory, returns, users, batches | Client currently requests the first 100 rows |
| Payments | Not Implemented | Payment method string only | No gateway/ledger/refund transaction |
| Purchase returns | Not Implemented | — | No route/model |
| Prescriptions/barcode scanning | Not Implemented | Barcode field only | No scanning or prescription flow |
| Docker/deployment assets | Not Implemented | — | No Dockerfile/compose/NGINX config in repo |
| Automated tests | Implemented | 66 unit suites / 458 tests + 6 HTTP integration tests | Controllers, Redis, Mongo, and SMTP are covered by unit fakes and the integration suite; live provider behavior still unverified |

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
| Inventory reconciliation | Single transactional write path; sync filter applies in both session and non-session calls; expiry flagging reconciles affected medicines immediately | Optimistic conflicts surface as `409` and must be retried by the caller |
| Dashboard analytics | COGS profit, year parameter, timezone-aware series, expiring count fixed, cache invalidated on writes | No arbitrary date-range analytics |
| Swagger | Two partial spec files | Not served, most files empty, missing dependency |
| Tests | 66 unit suites / 458 tests + 6 HTTP integration tests | Live SMTP/SMS/Upstash behavior remains unverified |

## 6. Not implemented

- Purchase returns / supplier returns.
- Payment gateways, payment records, refunds, credit tracking.
- MFA, account lockout.
- Security headers (helmet or equivalent).
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
| Server tests | 22 files, 223 tests passed (Phase 0 baseline; current Phase 5 suite is 66 unit files / 458 tests + 6 HTTP integration tests) |
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

1. **Historical data** — pre-Phase-4 purchase totals are VAT-exclusive, old returns have no line VAT, and legacy sale items have no cost snapshot; no backfill exists.
2. **Index deployment** — unique indexes on supplier phone, inventory medicine, pending reorders, and sale idempotency keys require the duplicate-readiness check to pass first.
3. **Client list truncation** — the client requests up to 100 rows and does not yet expose a "load more" control.
4. **Redis remains a hard startup dependency** even though invalidation failures are tolerated.
5. **Background scheduler** is still in-process; the lock prevents duplicate work but does not provide leader election.
6. **Live provider behavior** — SMTP, SMS, and Upstash connectivity remain unverified against production services.

## 9. Security posture

| Control | Status |
|---|---|
| Password hashing | Implemented on register/create/user update/password reset |
| JWT signing/verification | Implemented with separate access/refresh secrets and token-type checks |
| Token expiry | 15m access + 7d rotating refresh sessions |
| HttpOnly cookie | Yes (`token` + scoped `refreshToken`) |
| Secure/SameSite | Production: secure + `None`; dev: `Strict` |
| CSRF protection | Global double-submit cookie (`csrfToken` + `X-CSRF-Token`) for unsafe methods; Origin allow-list on auth routes |
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
