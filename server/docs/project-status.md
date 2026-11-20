# Project Status

Assessment of the backend as found in the repository. Status labels: **Implemented**, **Partially Implemented**, **Not Implemented**, **Unverified**.

## 1. Overall assessment

The backend is a working prototype of a single-pharmacy inventory and POS system. Core flows are present end to end: catalog, suppliers, purchasing, FEFO sales, VAT, returns, dashboard, and reorder recommendations. Authentication and role checks exist. Two schema-level defects currently block key paths: positive-quantity batch creation fails the `isActive` validator (which blocks purchase receiving), and GOOD returns pass an invalid movement `referenceType`.

It is not production-hardened. The main risks are:

- Two stock sources that can drift, with several paths that update only one.
- Authorization is almost flat across roles.
- Security defects in user management and registration.
- Missing validation on many write endpoints.
- No automated coverage beyond four auth tests.
- Several endpoints have logic defects (batch allocation, sync filters, VAT on returns, purchase totals).

## 2. Endpoint and model inventory

| Metric | Count |
|---|---|
| Mongoose models | 21 |
| Router files | 18 (including `app.routes.ts`) |
| Mounted route prefixes | 17 |
| Route registrations (actual calls) | 134 |
| Distinct live handlers | 133 (one duplicate path/method; one additional line is commented out) |
| Endpoint rows documented | 134 (133 distinct) |
| Transactions | 7 flows |
| Cron jobs | 2 active, 1 dead duplicate |
| Tests | 12 files, 109 cases |

## 3. Module status matrix

| Module | Status | Evidence | Main gaps |
|---|---|---|---|
| Authentication | Implemented | Register/login/refresh/logout, email verification, password reset, multi-session management, rate limiting, 15m access + 7d refresh | No MFA, no account lockout, no immediate access-token revocation |
| Users & roles | Partially Implemented | CRUD, activation toggle, role checks, hashed password updates, public responses sanitized | Flat permissions, body-based delete check, dead routes |
| Medicine catalog | Implemented | CRUD + 4 lookup tables, duplicate checks | No pagination, no unit validation, hard-delete lookups, inactive not filtered |
| Suppliers | Implemented | CRUD, email/phone uniqueness | No phone index, no delete guards, unused reliability field |
| Inventory (aggregate) | Partially Implemented | CRUD, increase/decrease, reserve/release, sync | Drift, reservedStock unused, no unique medicine index, sync filter bug |
| Batches & expiry | Partially Implemented | CRUD, FEFO query, expiry flagging, disposal | **Positive-quantity batch creation blocked by `isActive` validator**, no movement on adjust, broken allocate endpoint, no history |
| Purchases | Partially Implemented | Create/approve; receive logic present | **Receiving aborts because batch creation fails validation**, VAT/discount ignored, no partial receipt, stale totals, hard delete |
| Sales | Implemented | FEFO allocation, VAT, invoice counter, transaction | Delete doesn't restore batches, no payment ledger, item edits don't recompute totals |
| Returns | Partially Implemented | Create/list/update, refunds, partial/full status | GOOD path enum mismatch, damaged restocked, no VAT refund, statuses unreachable |
| Notifications | Partially Implemented | Create/dispatch, inbox, WS/email | SMS no-op, push result ignored, no retry beyond manual dispatch |
| Smart reorder | Implemented | WADS/SS/ROP/ROQ/confidence, cron, cache, approve/reject | No PO creation, stale cache, no dedupe, missing date handling |
| Dashboard/reporting | Implemented | 14 endpoints, 8-part cached payload | Year params ignored, profit not COGS, top-selling includes returns |
| Redis caching | Partially Implemented | Dashboard + reorder cache | No invalidation, fragile connection config, hard startup dependency |
| Background jobs | Implemented | 2 cron jobs + job audit records | In-process, no lock/retry, duplicate dead scheduler |
| WebSocket | Implemented | Cookie-auth upgrade, per-user push | No heartbeat/acks/rooms, offline marked Sent |
| Email | Implemented | Lazy Nodemailer transport, HTML auth emails, console fallback | No retry/bounce tracking; real SMTP must be configured |
| Swagger/OpenAPI | Not Implemented | Stubs exist | Not mounted, most files empty, `swagger-jsdoc` not a dependency |
| Pagination/search | Not Implemented | — | List endpoints return everything |
| Payments | Not Implemented | Payment method string only | No gateway/ledger/refund transaction |
| Purchase returns | Not Implemented | — | No route/model |
| Prescriptions/barcode scanning | Not Implemented | Barcode field only | No scanning or prescription flow |
| Docker/deployment assets | Not Implemented | — | No Dockerfile/compose/NGINX config in repo |
| Automated tests | Partially Implemented | 12 suites / 109 tests | No HTTP integration tests; controllers, Redis, Mongo, and SMTP are mocked or uncovered |

## 4. Implemented features

- Short-lived access JWT + rotating refresh sessions stored as hashes, bcrypt password hashing on registration/user creation/reset.
- Email verification, password reset, multi-device session listing/revocation, and Redis-backed auth rate limiting.
- Role gates at router level for all protected modules.
- Medicine, brand, category, generic name, unit CRUD with Zod validation.
- Supplier CRUD with uniqueness checks.
- Purchase order creation and approval with transaction protection.
- Receiving logic (validation, one batch per line, expiry/manufacturing checks) — currently blocked by the batch `isActive` validator.
- FEFO batch selection and atomic per-batch deduction.
- Sales with invoice counter, line/invoice discounts, 13% VAT, transaction.
- Sales returns with quantity guards, refund calculation, and sale status updates.
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
| Reservations | Reserve/release adjust availability | `reservedStock` never changes; not linked to orders |
| Returns | Creation, refund, status | GOOD path fails movement enum validation; damaged/expired restocked; no VAT refund; no approval flow |
| Stock adjustments | Batch adjust endpoint | No movement log; `StockAdjustment` service unreachable |
| Purchase totals | Base total computed | VAT/discount ignored, recalculate not persisted |
| Email notifications | Sending works if SMTP is reachable; auth emails have HTML templates | No retry/bounce tracking; console fallback when SMTP is unconfigured |
| SMS notifications | Accepted and marked Sent | No provider call |
| Inventory reconciliation | Sync method exists | Non-session branch includes unsellable batches; manual ops drift |
| Dashboard analytics | Metrics returned | Several filters/parameters ignored; some counts always zero |
| Swagger | Two partial spec files | Not served, most files empty, missing dependency |
| Tests | 12 suites / 109 tests | No HTTP integration tests; controllers and external services are not exercised end-to-end |

## 6. Not implemented

- Purchase returns / supplier returns.
- Payment gateways, payment records, refunds, credit tracking.
- Refresh tokens, password reset, email verification, MFA.
- Rate limiting, account lockout, CSRF protection, security headers.
- Pagination, sorting, date-range filters.
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
| Runtime GOOD-return 500 | Enum rejection confirmed in isolation; full HTTP path not exercised against MongoDB |
| Live batch creation failure | Validator failure confirmed in isolation; full `save()` against MongoDB not exercised |

### Verified during this audit

- `npx tsc --noEmit -p tsconfig.json` completes with no diagnostics.
- `npx vitest run` passes: 1 file, 4 tests.
- Isolated Mongoose validation confirms the `Batch.isActive` failure for positive quantity.
- Isolated Mongoose enum validation confirms `SALES_RETURN`, `RESERVE`, `RELEASE`, and `PURCHASE` are rejected for `InventoryMovement.referenceType`.

## 8. Highest-risk defects (ranked)

1. **Batch creation is blocked** by the inverted `isActive` validator (confirmed via isolated Mongoose validation). This prevents purchase receiving and any positive-stock batch insert.
2. **GOOD returns fail** due to `referenceType: "SALES_RETURN"` not being in the enum (confirmed enum validation; runtime transaction failure expected).
3. **Stock drift**: GOOD returns and sale deletion update aggregate only; damaged returns do the opposite of the label.
4. **Destructive GET** `GET /batches/medicine/:id/allocate` deducts stock and returns `[]`.
5. **Sync includes unsellable batches** when called without a session.
6. **Disposal is mislabeled**: `decreaseStock` hardcodes `movementType: "SALE"`, so disposal and manual expired decreases look like sales in the audit trail (`EXPIRED` is only reachable through a manual inventory patch).
7. **Movement reference defaults are invalid**: `PURCHASE`, `RESERVE`, and `RELEASE` are not in the enum, so manual increase and reserve/release can fail if the client omits a valid `referenceType`.
8. **Plaintext password** written by `PUT /users/:id`.
9. **Privilege escalation** via public registration with `role: "owner"`.
10. **Delete-user authorization** trusts a body field.
11. **Purchase totals** ignore VAT/discount; item updates leave stale totals.
12. **Return refunds omit VAT** while `returnItems.VAT` is required but unwritten.

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
| Input validation | Partial (body only, several modules missing) |
| Output sanitization | Auth and user responses strip password/refresh/reset hashes |
| Role enforcement | Partial/flat |
| Secret management | `.env` + gitignore; startup validation for JWT/CLIENT in production |
| CORS | Allow-list with credentials |
| WebSocket origin check | Not Implemented |
| Audit logging | Partial movement log only |

## 10. Documentation vs repository claims

| Claim in root docs | Actual |
|---|---|
| Pagination | Not implemented |
| Refresh-token mechanism (`SECURITY.md`) | Placeholder only |
| Email/SMS notifications (`README` future list) | Email partial, SMS no-op |
| Payment recording | Only a payment method string |
| Swagger/OpenAPI | Unmounted stubs, missing dependency |
| Docker/NGINX/HTTPS/CI security checks (`SECURITY.md`) | Not present in repository |
| Backend at port 8000 | Default is 3000 |
| "Inventory updates automatically after every sale" | True for sales, not for all stock paths |
| "Batch history" | Endpoint returns metadata, not movements |

## 11. Recommended next steps

Engineering (not performed in this documentation task):

1. Fix the return reference type and decide condition semantics (restock vs write-off).
2. Resolve the batch `isActive` validator and add schema tests.
3. Consolidate stock writes behind one service that always updates batch + aggregate + movement in a transaction.
4. Fix the non-session `getTotalStock` filter or require a session.
5. Remove or repair the destructive allocation endpoint.
6. Hash passwords on update and restrict role changes.
7. Require invitations/admin creation for privileged roles; remove `role` from public registration.
8. Check `isActive` at login and implement token revocation/refresh if needed.
9. Wire validation for inventory, batches, returns, sales updates, and notifications.
10. Apply purchase VAT/discount or remove the fields; persist recalculated totals.
11. Add indexes for `inventories.medicineId`, `salesitems.salesId`, `returns.salesId`, and status/date queries.
12. Add integration tests for sale, receipt, return, disposal, and reorder.
13. Replace console logging with structured logging and add readiness checks.
14. Fix the environment loading order and Redis URL handling.

## 12. Documentation set

This audit produced 38 documents under `server/docs/`, covering architecture, database, API (including all endpoints), modules, business logic, infrastructure, development, and this status report. Source references are included throughout. No application code, schema, or dependency was modified.

## Related documents

- [Documentation index](README.md)
- [System overview](architecture/system-overview.md)
- [API overview](api/api-overview.md)
- [Inventory management](business-logic/inventory-management.md)
