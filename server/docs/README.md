# SPIMS Backend Documentation

Technical documentation for the server-side implementation of **SPIMS — Smart Pharmacy Inventory Management System**.

This documentation describes what the code in `server/` actually does. It is based on a direct reading of the source, not on the repository's marketing README or the Swagger stubs. Where a feature is missing, partial, or could not be verified without a live environment, it is labelled accordingly.

## Purpose

SPIMS is a single-pharmacy inventory and point-of-sale backend. Its responsibilities are:

- Medicine catalog management (medicines, brands, categories, generic names, units).
- Supplier management.
- Batch-level inventory, expiry tracking, and FEFO (First Expire First Out) sales allocation.
- Purchase order lifecycle from creation to goods receipt.
- Sales invoicing with 13% VAT and stock deduction.
- Sales returns with stock restoration and refund calculation.
- Stock movement audit trail.
- Dashboard analytics and smart reorder recommendations.
- In-app, email, and (stub) SMS notifications.
- JWT cookie authentication and role checks.

## Technology stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js 22 (CI matrix) | ESM (`"type": "module"`) |
| HTTP | Express 5 | `express.json()`, `cookie-parser`, `cors` |
| Language | TypeScript | NodeNext, strict, `.ts` import specifiers |
| Database | MongoDB + Mongoose 9 | 21 models, no migrations |
| Validation | Zod 4 | Body-only middleware |
| Auth | `jsonwebtoken`, `bcrypt` | HS256 JWT, 15-day expiry, httpOnly cookie |
| Cache | `ioredis` | `@upstash/redis` is installed but unused |
| Jobs | `node-cron` | In-process; 01:00 and 02:00 daily |
| Realtime | `ws` | `/ws`, cookie-authenticated, server push only |
| Email | `nodemailer` | Falls back to an Ethereal test account |
| Tests | Vitest | One test file |
| Build | `tsc` | Output in `dist/` |

## Architecture at a glance

```mermaid
flowchart LR
  Client["React client"] -->|"HTTP /api (cookie JWT)"| Express["Express app"]
  Client <-->|"WebSocket /ws"| WS["ws server"]
  Express --> Routes["Routers"]
  Routes --> Middleware["verifyToken + authorize + validate"]
  Middleware --> Controllers["Controllers"]
  Controllers --> Services["Services (business logic)"]
  Services --> Repos["Repositories"]
  Repos --> Mongo[("MongoDB")]
  Services --> Redis[("Redis cache")]
  Services --> SocketProvider["WebSocket registry"]
  Services --> Mail["SMTP / Ethereal"]
  Cron["node-cron jobs"] --> Services
```

The backend uses a **modular layered architecture** with manual dependency injection. `src/app/container.ts` constructs every repository, service, and controller once, and routers import controllers from that container.

## Documentation map

| Document | What it covers |
|---|---|
| [architecture/system-overview.md](architecture/system-overview.md) | Runtime topology, layers, startup, design decisions |
| [architecture/project-structure.md](architecture/project-structure.md) | Actual folder layout and module anatomy |
| [architecture/data-flow.md](architecture/data-flow.md) | Request lifecycle and cross-module flows |
| [database/database-overview.md](database/database-overview.md) | MongoDB usage, indexes, constraints, lifecycle |
| [database/schema-and-relationships.md](database/schema-and-relationships.md) | Every model, field, and relationship |
| [database/inventory-data-model.md](database/inventory-data-model.md) | Inventory, batch, movement, and adjustment data |
| [api/api-overview.md](api/api-overview.md) | Base URL, conventions, auth, response envelopes |
| [api/authentication.md](api/authentication.md) | Login, register, logout, cookie and JWT behavior |
| [api/endpoints.md](api/endpoints.md) | Complete endpoint reference |
| [api/error-handling.md](api/error-handling.md) | `AppError`, validation failures, status codes |
| [modules/authentication.md](modules/authentication.md) | Auth module internals |
| [modules/users-and-roles.md](modules/users-and-roles.md) | User management and the actual role matrix |
| [modules/products.md](modules/products.md) | Medicine catalog and lookup data |
| [modules/suppliers.md](modules/suppliers.md) | Supplier module |
| [modules/inventory.md](modules/inventory.md) | Aggregate inventory operations |
| [modules/batches.md](modules/batches.md) | Batches, expiry, disposal, allocation |
| [modules/purchases.md](modules/purchases.md) | Purchase orders and receiving |
| [modules/sales.md](modules/sales.md) | Sales creation, pricing, deletion |
| [modules/returns.md](modules/returns.md) | Sales returns |
| [modules/notifications.md](modules/notifications.md) | Notification creation, dispatch, inbox |
| [modules/smart-reorder.md](modules/smart-reorder.md) | Reorder algorithm and recommendation lifecycle |
| [modules/reporting.md](modules/reporting.md) | Dashboard and analytics endpoints |
| [business-logic/inventory-management.md](business-logic/inventory-management.md) | Stock rules, reconciliation, edge cases |
| [business-logic/stock-movements.md](business-logic/stock-movements.md) | Movement types and audit semantics |
| [business-logic/fefo-fifo.md](business-logic/fefo-fifo.md) | Batch selection algorithm |
| [business-logic/vat-and-pricing.md](business-logic/vat-and-pricing.md) | VAT, discounts, rounding, refunds |
| [business-logic/business-workflows.md](business-logic/business-workflows.md) | End-to-end workflows |
| [infrastructure/redis-and-caching.md](infrastructure/redis-and-caching.md) | Redis config, keys, TTLs |
| [infrastructure/background-jobs.md](infrastructure/background-jobs.md) | Cron schedules and job tracking |
| [infrastructure/realtime-communication.md](infrastructure/realtime-communication.md) | WebSocket handshake and push |
| [infrastructure/external-integrations.md](infrastructure/external-integrations.md) | SMTP, Upstash, third-party status |
| [infrastructure/logging-and-monitoring.md](infrastructure/logging-and-monitoring.md) | Logging and health signals |
| [development/setup-and-installation.md](development/setup-and-installation.md) | Local setup and run commands |
| [development/environment-variables.md](development/environment-variables.md) | Every environment variable used |
| [development/development-workflow.md](development/development-workflow.md) | Scripts, build, CI, conventions |
| [development/testing.md](development/testing.md) | Test setup and coverage |
| [project-status.md](project-status.md) | Implemented / partial / missing matrix |

## Implementation status summary

| Area | Status |
|---|---|
| Authentication (login, JWT cookie, logout, current user) | Implemented |
| Role-based authorization | Partially Implemented — three roles, effectively identical permissions |
| User administration | Implemented |
| Medicine catalog | Implemented |
| Supplier management | Implemented |
| Batch inventory and FEFO | Partially Implemented — FEFO implemented; positive-quantity batch creation blocked by validator |
| Aggregate inventory | Partially Implemented — reconciliation gaps |
| Purchase orders and receiving | Partially Implemented — receiving aborts at batch creation |
| Sales and VAT | Implemented |
| Sales returns | Partially Implemented |
| Purchase returns | Not Implemented |
| Stock adjustments | Partially Implemented — service not exposed |
| Smart reorder | Implemented |
| Dashboard analytics | Implemented |
| Notifications | Partially Implemented — SMS is a no-op |
| Redis caching | Partially Implemented |
| Background jobs | Implemented |
| WebSocket push | Implemented |
| Swagger/OpenAPI | Not Implemented (unmounted stubs) |
| Pagination | Not Implemented |
| Automated tests | Partially Implemented — one unit test file |

## Conventions used in this documentation

- **Status labels:** `Implemented`, `Partially Implemented`, `Not Implemented`, `Unverified`.
- **Source references** use paths relative to the repository root, for example `server/src/modules/sales/services/sales.service.ts`.
- All API paths are relative to the `/api` mount point.
- Unless stated otherwise, every non-auth endpoint requires a valid `token` cookie and accepts the roles `owner`, `inventory_manager`, and `pharmacist`.
- Response shapes are quoted from controllers. The API does **not** use one consistent envelope; this is documented per endpoint.
- No secrets are reproduced. Environment variables are documented by name and purpose only.

## Important caveat

Several behaviors in the code are internally inconsistent or broken (for example, two stock sources that can drift, a batch allocation endpoint that mutates stock and returns an empty array, a batch validator that blocks positive-quantity creation, and a return path that does not refund VAT). These are documented as **current behavior**, with the corresponding risk called out in the module and business-logic documents. They are not documented as intended behavior.
