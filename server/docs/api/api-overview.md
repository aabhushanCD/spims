# API Overview

## 1. Base URL and prefixes

| Item | Value |
|---|---|
| Mount point | `/api` |
| Default port | `3000` (`PORT` env overrides) |
| Local base URL | `http://localhost:3000/api` |
| Health probe | `GET /health` (outside `/api`, no auth) |
| WebSocket | `ws://localhost:3000/ws` |
| API versioning | None |
| OpenAPI/Swagger | Not served |

Source: `server/src/server.ts`, `server/src/modules/app.routes.ts`

## 2. Content type

All endpoints accept and return JSON. There is no form-data or multipart handling. `invoiceFile` on purchase orders is a plain string field; no upload endpoint exists.

## 3. Authentication

- Authentication uses a **cookie**, not an `Authorization` header.
- Cookie name: `token`.
- The JWT payload is `{ userId, email, role }`, signed with `JWT_SECRET`, expiring in 15 days.
- Requests to every router except `/api/auth` pass through `verifyToken` and `authorize`.
- `POST /api/auth/register` and `POST /api/auth/login` are public.
- `POST /api/auth/logout` and `GET /api/auth/me` require the cookie.

See [Authentication](authentication.md) for details and [Users and roles](../modules/users-and-roles.md) for the effective permission matrix.

## 4. Roles

Three roles exist: `owner`, `pharmacist`, `inventory_manager`.

| Router group | Allowed roles |
|---|---|
| `/users` | `owner`, `pharmacist` |
| Everything else under `/api` | `owner`, `inventory_manager`, `pharmacist` |
| `/smart-reorders/generate*` | `owner`, `inventory_manager` (additional check) |
| `DELETE /smart-reorders/:id` | `owner` (additional check) |

Because almost every router allows all three roles, authorization is effectively authentication-only for most business operations. A pharmacist can create purchases, delete sales, or manage suppliers.

## 5. Request validation

Validation is implemented with Zod and applied by `validate(schema)` middleware. It parses **only `req.body`**, replaces the body with the parsed value, and returns `400` on failure.

| Module | Create | Update | Delete/actions |
|---|---|---|---|
| auth | register, login | — | — |
| medicines | yes | yes | — |
| brands/categories/generic names/units | yes | yes | — |
| suppliers | yes | yes | — |
| purchases | create, add item, update item | — | — |
| sales | create | **no** | — |
| returns | schema exists but **not wired** | **no** | — |
| inventory | schema exists but **not wired** | **no** | **no** |
| batches | **no** | **no** | **no** |
| notifications | **no** (manual checks) | — | — |
| smart reorders | **no** | — | — |

Params and query strings are never validated by middleware; controllers validate a few numeric query parameters manually (`threshold`, `quantity`, `limit`, `year`).

## 6. Response envelopes

The API is not consistent. Three patterns occur:

| Pattern | Example modules | Shape |
|---|---|---|
| Wrapped success | inventory, batches, sales, sale items, returns, notifications, dashboard, smart reorders, purchases | `{ "success": true, "data": ... }` |
| Message + data | suppliers, purchases (some), supplier CRUD | `{ "success": true, "message": "...", "data": ... }` |
| Raw document/array | auth, users, medicines, brands, categories, generic names, units | the document or array itself |

Errors are consistent only when produced by the global handler:

```json
{ "success": false, "message": "..." }
```

Validation errors use a different shape:

```json
{ "success": false, "errors": { "field": ["message"] } }
```

404 for unknown routes:

```json
{ "message": "Route not found" }
```

## 7. Identifiers, dates, and money

- All identifiers are 24-character MongoDB ObjectId strings.
- Most endpoints do not validate ObjectId format before querying; supplier endpoints are the exception (explicit `isValid` checks). Invalid ids elsewhere usually surface as Mongoose `CastError` and become HTTP 500.
- Dates are ISO-8601 strings on input. Zod schemas coerce strings to `Date`. Endpoints without validation pass raw strings to Mongoose.
- Money is a JSON number with no currency code. No rounding contract exists except sales VAT, which is rounded to 2 decimals.
- `saleDate`, `returnDate`, `orderDate`, `expectedDeliveryDate`, `manufacturingDate`, and `expiryDate` are client-supplied.

## 8. Pagination, filtering, sorting

None of the list endpoints paginate. They return every matching document. Only these filtering options exist:

| Endpoint | Filter |
|---|---|
| `GET /medicines/search?query=` | regex over name/strength/manufacturer/barcode |
| `GET /inventory/medicines/search?query=` | regex over medicine name/strength/barcode, stock only |
| `GET /batches/low-stock?threshold=` | per-batch quantity |
| `GET /dashboard/recent-activity?limit=` | limit |
| `GET /dashboard/top-selling?limit=` | limit |
| `GET /dashboard/sales?year=` | year |
| `GET /users/role/:role`, status/last-login variants | role/status/date |
| `GET /users/last-login/:date` | last login |

No `page`, `pageSize`, `sort`, or `order` parameters exist.

## 9. Route ordering caveats

| Path | Issue |
|---|---|
| `GET /users/active` | Registered after `GET /users/:id`, so it is captured by `getUserById("active")` and is effectively unreachable |
| `GET /users/status/:isActive/last-login/:date` | Registered twice; the second handler (`findByStatusAndLastLogin`) is unreachable |
| `GET /users/:id/inactive` | Returns inactive users and ignores `:id` |
| `GET /purchases/supplier/:supplierId` | Works because it is two segments after the base; do not confuse with `GET /purchases/:id` |
| `GET /batches/expired/awaiting-disposal` | Defined before `/:id`, so it resolves correctly |
| `POST /batches/mark-expired` | Defined before `POST /:id/...`, resolves correctly |

## 10. Status codes

| Code | Meaning in this API |
|---|---|
| 200 | Read/update/action success |
| 201 | Create success (register, medicines, brands, categories, generic names, units, suppliers, sales, returns, notifications, batches, inventory) |
| 400 | Zod validation failure, business rule violation (`AppError.badRequest`) |
| 401 | Missing/invalid token; unauthenticated action |
| 403 | Role not allowed |
| 404 | Resource not found, unknown route |
| 409 | Duplicate entity, stock conflict |
| 422 | Defined in `AppError` but not used by any route |
| 500 | Unhandled error, Mongoose cast/validation error, database failure |

## 11. Health check

`GET /health` → `200 text/plain` with `Server is healthy`. It does not check MongoDB or Redis health.

## 12. Endpoint index

The complete reference lives in [endpoints.md](endpoints.md). Summary by module:

| Module | Endpoints | Prefix |
|---|---|---|
| Auth | 4 | `/auth` |
| Users | 14 registrations (13 distinct) | `/users` |
| Medicines | 6 | `/medicines` |
| Units | 5 | `/units` |
| Categories | 5 | `/categories` |
| Brands | 5 | `/brands` |
| Generic names | 5 | `/generic-names` |
| Suppliers | 5 | `/suppliers` |
| Purchases | 13 | `/purchases` |
| Inventory | 12 | `/inventory` |
| Sales | 5 | `/sales` |
| Sale items | 4 | `/sale-items` |
| Returns | 4 | `/returns` |
| Batches | 17 | `/batches` |
| Smart reorders | 9 | `/smart-reorders` |
| Notifications | 7 | `/notifications` |
| Dashboard | 14 | `/dashboard` |

## Related documents

- [Authentication](authentication.md)
- [Endpoint reference](endpoints.md)
- [Error handling](error-handling.md)
- [Users and roles](../modules/users-and-roles.md)
