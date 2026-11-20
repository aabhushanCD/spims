# Logging and Monitoring

## 1. Current state

There is no logging library, structured logging, log levels, request tracing, metrics endpoint, or alerting. Diagnostics rely on:

- `console.log`, `console.error`, and `console.warn`.
- HTTP `/health`.
- The `BackgroundJob` collection and the dashboard system-health endpoint.
- Notification recipient statuses.

## 2. Log inventory

| Location | Message | Level |
|---|---|---|
| `config/db.config.ts` | MongoDB connected host / error | log/error |
| `config/redis.config.ts` | Redis connected / connection error | log/error |
| `shared/middleware/verifyJwt.ts` | JWT verification failure | error |
| `shared/middleware/verifyToken.ts` | JWT verification failure | error |
| `shared/middleware/globalError.middleware.ts` | Full unhandled error | error |
| `modules/inventory/services/inventoryMovement.service.ts` | `Creating inventory movement:` + payload | log |
| `modules/purchase/controller/purchase.controller.ts` | `Request body:` on create | log |
| `modules/sales/controller/sales.controller.ts` | `Unexpected error in getAllSales:` | error |
| `modules/backgroundJobs/jobs/expiryCheck.job.ts` | Newly expired count / job failure | log/error |
| `modules/backgroundJobs/jobs/reorderCalculation.job.ts` | Completion / failure | log/error |
| `modules/worker/smartReorder.cron.ts` | Generated count / failure (dead code) | log/error |
| `server.ts` | Server running; invalid CORS JSON | log/error |

Concerns:

- The purchase controller logs full request bodies, which may include supplier and pricing data.
- The movement service logs full movement payloads.
- Logs are unstructured single-line strings without timestamps, request ids, user ids, or route context.
- Errors from the global handler are logged without the request method/path.

## 3. Health probe

`GET /health` returns:

```text
Server is healthy
```

- Status 200, `text/plain`.
- No authentication.
- Does not check MongoDB, Redis, SMTP, cron, or disk.
- Always returns the same value while the process is alive.

This is a liveness check only, not readiness.

## 4. Job monitoring

`BackgroundJob` records give per-run status:

| Question | How to answer |
|---|---|
| Did the last run succeed? | Query `backgroundjobs` by `jobName`, sort `scheduledAt` desc |
| Are any jobs stuck? | `GET /api/dashboard/system-health` (IN_PROGRESS > 60 min) |
| What was the error? | `errorMessage` field (not exposed by an API) |
| How long did it run? | `startedAt` vs `completedAt` |
| Did a run happen at all? | Presence of a record; missed runs leave no trace |

`BackgroundJobService` provides `getLatestRun`, `getByJobName`, `getByStatus`, and `getAll`, but none are exposed through a route. Only `getStaleJobs` is used by the dashboard.

## 5. Notification delivery monitoring

`GET /api/dashboard/notifications` returns counts of recipient rows by status:

```json
{ "failedDeliveries": 3, "pendingDeliveries": 10 }
```

Limitations:

- No time window; counts are all-time.
- No per-channel breakdown.
- No error reason stored.
- Pending rows can remain forever if dispatch is never retried.

## 6. Inventory/stock observability

There is no stock reconciliation report. Operators can detect drift only by comparing:

- `GET /inventory/medicine/:medicineId` → `currentStock`
- `GET /batches/medicine/:medicineId/available` → sum of `quantityRemaining`

The dashboard's inventory value and low-stock counts are derived from these same records and do not validate them.

## 7. Error visibility by surface

| Surface | What operators see |
|---|---|
| HTTP 500 | Generic message to client; stack/error in server console |
| Validation 400 | Field errors to client; nothing logged |
| Failed login | 401/404 to client; no audit log |
| Failed email | Recipient `Failed`; no reason |
| Dropped WebSocket | Nothing |
| Cron crash | `FAILED` job record + console error |
| Redis outage | Console error; requests fail |
| MongoDB outage | Driver errors; startup exits, runtime 500s |

## 8. Audit trail gaps

| Event | Audit record |
|---|---|
| Login/logout | None (lastLogin unused) |
| User create/update/delete | None |
| Role change | None |
| Purchase approval | Only status; no approver/timestamp |
| PO cancellation | Only status; no actor |
| Sale deletion | Movement with `performedBy`, but sale itself is gone |
| Inventory adjustment | Movement if context supplied; batch adjust has none |
| Batch disposal | Recorded as a `SALE` movement, with performer, due to the hardcoded type in `decreaseStock` |
| Return | `returnedBy` and movements |
| Smart reorder approval | Status only; no approver |
| Notification dispatch | Recipient status only |

## 9. Recommended minimum (not implemented)

If this system is to be operated beyond a demo, the following would be needed:

1. Structured JSON logging with request id, user id, route, status, and duration.
2. Readiness endpoint checking MongoDB and Redis.
3. Error aggregation (Sentry or equivalent).
4. Metrics for request rate/latency/errors and job duration.
5. Audit collection for auth and administrative actions.
6. Alerting on failed cron runs and notification backlogs.
7. Stock reconciliation report comparing batches and aggregates.
8. Retention policy for `backgroundjobs` and `inventorymovements`.

None of these exist in the repository.

## 10. Practical diagnosis guide

| Symptom | Check |
|---|---|
| 500 on many endpoints | Server console for Mongoose `CastError`/`ValidationError` |
| Login fails unexpectedly | `JWT_SECRET`, cookie domain/SameSite, `ALLOWED_ORIGINS`, email-verification state |
| Refresh always 401 | Cookie path `/api/auth`, `JWT_REFRESH_SECRET`, revoked/expired `AuthSession` |
| Reset/verification link missing | `SMTP_HOST` unset (link is in `[Email:dev]` console output) or `CLIENT_URL` wrong |
| Auth requests return 429 | Redis `rate-limit:*` counters |
| Server exits at boot | `assertAuthConfig()` error, Redis `ping`, MongoDB URI |
| Dashboard zeros | Collections empty, date filters (current month/year), or cached stale payload |
| Reorder always 400 | Negative cache entry, no purchase history, stock above ROP |
| Notifications stuck Pending | Dispatch not called or Redis/DB error |
| WebSocket never delivers | Cookie not sent on upgrade, expired token, no open socket |
| Stock mismatch | Aggregate-only operations, GOOD returns, sale deletion, non-session sync |

## Related documents

- [Background jobs](background-jobs.md)
- [External integrations](external-integrations.md)
- [Error handling](../api/error-handling.md)
- [Reporting](../modules/reporting.md)
