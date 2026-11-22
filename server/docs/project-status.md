# Project Status

Assessment of the backend as found in the repository. Status labels: **Implemented**, **Partially Implemented**, **Not Implemented**, **Unverified**.

## 1. Overall assessment

The backend is a working prototype of a single-pharmacy inventory and POS system. Core flows are present end to end: catalog, suppliers, purchasing, FEFO sales, VAT, returns, dashboard, and reorder recommendations. Authentication and role checks exist. The blocking schema defects were remediated, Phase 2 consolidated stock writes into one transactional path, Phase 3 hardened user authorization and request validation across modules, and Phase 4 corrected return, sales, purchase, and reporting financials.

It is not production-hardened. The main risks are:

- Aggregate stock still depends on operational sync after expiry flagging and on deduping existing inventory rows before the unique index deploys.
- Authorization remains broad outside user management.
- Historical financial data (VAT-exclusive purchase totals, pre-Phase-4 returns without line VAT) is not backfilled.
- Automated coverage remains modest, but ten HTTP flows and five migration/seeder tests now run against in-memory MongoDB.
- List endpoints have cursor pagination and filters; the client still lacks a general "load more" control.
- Client/server contract drift remains: the sale cancel route, payment enum/`paidAmount`, invoice field names, inventory adjust/history calls, and report links are scheduled for Phase 6.3/6.7.

## 2. Endpoint and model inventory

| Metric | Count |
|---|---|
| Mongoose models | 28 |
| Router files | 23 (including `app.routes.ts`) |
| Mounted route prefixes | 22 |
| Route registrations (actual calls) | 193 |
| Distinct live handlers | 193 |
| Endpoint rows documented | 193 (stocktake, templates, reporting, barcode, supplier performance added in 6.4–6.6) |
| Transactions | 7 flows |
| Migrations | 4 registered (`001`–`004`) |
| Cron jobs | 3 active |
| Tests | 79 unit files / 535 cases + 15 integration cases (10 HTTP + 5 migration/seeder) |

## 3. Module status matrix

| Module | Status | Evidence | Main gaps |
|---|---|---|---|
| Authentication | Implemented | Register/login/refresh/logout, email verification, password reset, sessions, rate limiting, lockout, immediate token revocation, shared HTTP/WS origin policy | No MFA, no Google OAuth, no geo-IP database |
| Users & roles | Implemented | CRUD, owner-only writes, JWT-authoritative delete, role change revokes sessions, admin reset, force logout, hashed passwords, audit trail | Flat RBAC outside user management |
| Medicine catalog | Implemented | CRUD + 4 lookup tables, duplicate checks, unit validation, reference-safe lookup deletes, escaped search, active filtering, cursor pagination, barcode lookup, compound unique index | Batch/price data in list not exposed |
| Suppliers | Implemented | CRUD, uniqueness, reliability score, open-PO delete guard, performance endpoint | No supplier audit trail |
| Inventory (aggregate) | Implemented | CRUD, increase/decrease, reserve/release, sync, single write path, version CAS, unique medicine index, reconciliation report, stocktake lifecycle | Stocktake UI absent; reservations not order-linked |
| Batches & expiry | Implemented | CRUD, FEFO query, expiry flagging with aggregate sync, atomic disposal, movements on every stock change, request validation, movement history, delete guard | No batch split/merge |
| Purchases | Implemented | Create/approve/partial/full receive, persisted totals, PO numbering, approval/cancel/receive audit, supplier performance, supplier returns, invoice upload/download | Multi-batch split is supported per receipt line |
| Sales | Implemented | FEFO, header+line VAT snapshots, customers, payment ledger, invoice payload, sale-item corrections, delete guard | No external payment gateway |
| Returns | Implemented | PENDING → APPROVED/REJECTED/CANCELLED → COMPLETED/REVERSED workflow, VAT-inclusive refunds, restocking fees, GOOD/write-off semantics, refund ledger, reversal | No partial-refund approval workflow |
| Notifications | Implemented | Dispatch, inbox, WS/email/SMS, retries, preferences, read state, pagination, hierarchy authz, template CRUD/render | Templates are not yet wired into notification creation |
| Smart reorder | Implemented | WADS/SS/ROP/ROQ/confidence, cache, approve/reject audit, manual route, MOQ/pack rounding, optional draft PO creation, reliability persistence | No seasonality model; auto-PO creates a draft only |
| Dashboard/reporting | Implemented | Cached payload, COGS profit, timezone series, returns excluded, range analytics, by-cashier/category, CSV export, completion-date refunds, reconciliation | No per-category dashboard UI |
| Redis caching | Implemented | Dashboard + reorder cache with invalidation; explicit `REDIS_URL`/Upstash target resolution | Redis still required at startup |
| Background jobs | Implemented | 3 cron jobs + job audit records + Redis distributed locks | Single-process scheduler; retry sweep intentionally unrecorded |
| WebSocket | Implemented | Origin-checked cookie-auth upgrade, per-user push | No heartbeat/acks/rooms, offline marked Sent |
| Email | Implemented | Lazy Nodemailer transport, HTML auth emails, console fallback | No retry/bounce tracking; real SMTP must be configured |
| Swagger/OpenAPI | Implemented | Typed OpenAPI 3.0 spec + Swagger UI at `/api-docs` | Production requires `ENABLE_API_DOCS=true` and an owner session; spec maintenance is manual |
| Pagination/search | Implemented | Cursor pagination on medicines, sales, purchases, inventory, returns, users, batches | Client currently requests the first 100 rows |
| Migrations/seeders | Implemented | Ordered migration runner + `migrations` ledger; idempotent baseline seeder (`db:migrate`, `db:seed`) | No down migrations or checksum drift detection; not run at boot |
| Payments | Implemented | Payment ledger (`PAYMENT`, `REFUND`, `REFUND_REVERSAL`), credit-sale settlement, invoice summary | No external gateway; no partial-refund policy beyond restocking fees |
| Customers | Implemented | Customer CRUD/search, sale `customerId` + name snapshot, invoice population | No loyalty/credit accounts |
| Purchase returns | Implemented | Pending → approved → completed supplier return with batch stock deduction, supplier credit, unique number | No supplier debit-note export or partial batch return workflow |
| Invoice | Implemented | `GET /sales/:id/invoice` with populated items, cashier/customer, payments, amount due | Client print view still uses the old field names (Phase 6.7) |
| Prescriptions/barcode scanning | Not Implemented | Barcode field only | No scanning or prescription flow |
| Docker/NGINX deployment | Declined | — | Not required for this project; no Dockerfile/compose/NGINX config will be added |
| Automated tests | Implemented | 79 unit suites / 535 tests + 15 integration cases (10 HTTP + 5 migration/seeder) | Live SMTP/SMS/Upstash provider behavior still unverified |

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
| Returns | Full approval workflow, VAT refunds, restocking fees, refund ledger, reversal | No partial-refund approval policy |
| Stock adjustments | Batch adjust endpoint | Writes movement and syncs; `StockAdjustment` service unreachable |
| Purchase totals | VAT/discount-aware totals persisted on recalculation | Historical pre-Phase-4 totals are not backfilled |
| Email notifications | Sending works if SMTP is reachable; auth emails have HTML templates | No retry/bounce tracking; console fallback when SMTP is unconfigured |
| SMS notifications | Implemented via `SMS_WEBHOOK_URL` | Requires `SMS_WEBHOOK_URL` and a recipient phone |
| Inventory reconciliation | Single transactional write path; sync filter applies in both session and non-session calls; expiry flagging reconciles affected medicines immediately | Optimistic conflicts surface as `409` and must be retried by the caller |
| Dashboard analytics | COGS profit, year parameter, timezone-aware series, expiring count fixed, cache invalidated on writes | No arbitrary date-range analytics |
| Swagger | Typed OpenAPI 3.0 spec; Swagger UI served at `/api-docs` | Production docs are opt-in and owner-only |
| Tests | 79 unit suites / 535 tests + 15 integration cases (10 HTTP + 5 migration/seeder) | Live SMTP/SMS/Upstash behavior remains unverified |

## 6. Not implemented

- External payment gateways (eSewa/Khalti/Stripe); the local payment/refund ledger exists.
- MFA and Google OAuth; lockout and immediate access-token revocation are now implemented.
- General sorting and arbitrary date-range filters on every list (pagination/common filters and reporting ranges exist).
- Prescription management.
- Barcode camera/scanning UI (the lookup endpoint and unique index exist).
- Multi-branch or multi-tenant support.
- Docker/NGINX deployment (declined by product decision; not planned).
- Reservation-to-order linkage (aggregate reservations remain order-unaware).
- Metrics and distributed tracing (structured logging, request IDs, and readiness are implemented).

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
| Server tests | 22 files, 223 tests passed (Phase 0 baseline; current 6.4–6.6 suite is 79 unit files / 535 tests + 15 integration cases (10 HTTP + 5 migration/seeder)) |
| Client tests | 2 files, 17 tests passed |
| `npm run build` | PASS (server `tsc`; client `tsc -b && vite build`; only the Vite chunk-size warning) |
| `npm run audit` | PASS — 0 production vulnerabilities in both packages |

### Verified during this audit

- `npx tsc --noEmit -p tsconfig.json` completes with no diagnostics.
- `npx vitest run` passes: 79 files, 535 tests (server).
- Model tests confirm active batches with stock validate, inactive batches with stock are rejected, and all ten `referenceType` values validate (including `PURCHASE_RETURN`).

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
| Security headers | Helmet (no page CSP); HSTS in production |
| Account lockout | Redis counter per normalized email; 5 failures / 15m window / 15m lock |
| Access-token revocation | Redis session deny-list plus `User.tokenVersion`; all-session revocation on reset/role change/deactivation/force logout |
| Admin password reset | Owner-only one-time email link; sessions revoked; no plaintext password returned |
| WebSocket origin check | Implemented — same allow-list as CORS; `Origin` required in production |
| Audit logging | Implemented for auth and user admin actions (`AuditLog`, owner-only `GET /api/audit`); stock movements remain the transactional stock audit |

## 10. Documentation vs repository claims

| Claim in root docs | Actual |
|---|---|
| Pagination | Implemented with cursor pagination on the main lists |
| Refresh-token mechanism (`SECURITY.md`) | Implemented (rotating refresh sessions) |
| Email/SMS notifications (`README` future list) | Implemented; SMS requires a webhook |
| Payment recording | Payment/refund ledger with outstanding balance; no external gateway |
| Swagger/OpenAPI | Implemented at `/api-docs`; production is opt-in and owner-only |
| Docker/NGINX/HTTPS/CI security checks (`SECURITY.md`) | CI scanners exist; Docker/NGINX/HTTPS are declined |
| Backend at port 8000 | Default is 3000 (`PORT`) |
| "Inventory updates automatically after every sale" | True for sales, not for all stock paths |
| "Batch history" | Endpoint now includes movements |
| "Docker containerization / NGINX / HTTPS" (`SECURITY.md`) | Declined; not planned |

## 11. Recommended next steps

Engineering follow-up:

1. ~~Return condition semantics, stock consolidation, non-session sync filter, destructive allocation removal, owner-only user writes, login status checks, validation, purchase totals~~ (done in Phases 2–4).
2. ~~Indexes, integration tests, structured logging/readiness, Redis URL handling~~ (done in Phase 5).
3. ~~Account lockout, immediate access-token revocation, admin reset, force logout, audit log, Helmet, WebSocket origin check~~ (done in Phase 6.1).
4. Add client-side role gating for user-management actions so pharmacists see a clear disabled state instead of a `403` (Phase 6.7).
5. Client contract drift is fixed for sale cancellation (uses `DELETE`), payment methods, invoice data, dead inventory calls, and dead report/roles links. Remaining client work: load-more, payments/stocktake/upload/reorder UI, barcode camera, component tests.
6. Phase 6.2 Swagger/OpenAPI, migrations, and seeders are done. Docker/NGINX/compose and a deploy workflow are declined.
7. Phase 6.3 is done. 6.4 PO numbering, stocktake, medicine barcode/index, supplier performance, and approval audit are done; partial receiving and invoice upload remain. 6.5 range/CSV/bylines are done. 6.6 MOQ/audit/manual/auto-PO/templates are done server-side.
8. MFA (6.1b) and Google OAuth/geo-IP (deferred) remain accepted gaps.

## 12. Documentation set

This audit produced 38 documents under `server/docs/`, covering architecture, database, API (including all endpoints), modules, business logic, infrastructure, development, and this status report. Source references are included throughout. At audit time no application code, schema, or dependency was modified; the blocker remediation and the Phase 0 doc reconciliation were applied afterwards.

## Related documents

- [Documentation index](README.md)
- [System overview](architecture/system-overview.md)
- [API overview](api/api-overview.md)
- [Inventory management](business-logic/inventory-management.md)
