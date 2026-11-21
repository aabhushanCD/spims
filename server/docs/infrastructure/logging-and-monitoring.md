# Logging and Monitoring

## 1. Current state

Runtime logs are structured JSON through `shared/logger.ts`: timestamp, level, event name, and context. `LOG_LEVEL` controls verbosity. HTTP requests log method, path, status, duration, request id, and user id; `X-Request-Id` is returned to the client. Secrets and tokens are redacted.

Diagnostics also rely on:

- HTTP `/health` (liveness) and `/ready` (MongoDB + Redis readiness).
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

## 3. Health and readiness probes

`GET /health` returns `Server is healthy` with status 200. It is a liveness check only.

`GET /ready` checks MongoDB and Redis and returns:

```json
{ "status": "ready", "checks": { "mongo": true, "redis": true } }
```

It returns `503` with `status: "not_ready"` when either dependency fails. It does not expose connection strings or secrets.

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
{
  "failedDeliveries": 3,
  "pendingDeliveries": 10,
  "skippedDeliveries": 2
}
```

Limitations:

- No time window; counts are all-time.
- No per-channel breakdown.
- Failed rows store a truncated provider error; skipped rows store the opt-out
  reason.
- Pending rows are swept by the notification-retry job: never-attempted rows on
  the next tick, claimed-but-unfinished rows after 15 minutes. A sweep that
  keeps failing can still leave them pending.

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
| Failed email | Recipient `Failed` with stored error and scheduled retries |
| Failed SMS | Recipient `Failed` with stored error and scheduled retries |
| Dropped WebSocket | Nothing |
| Cron crash | `FAILED` job record + console error |
| Redis outage | Console error; requests fail |
| MongoDB outage | Driver errors; startup exits, runtime 500s |

## 8. Audit trail gaps

| Event | Audit record |
|---|---|
| Login/logout | Login updates `lastLogin`; no dedicated audit row. Logout has no record |
| User create/update/delete | None |
| Role change | None |
| Purchase approval | Only status; no approver/timestamp |
| PO cancellation | Only status; no actor |
| Sale deletion | Movement with `performedBy`, but sale itself is gone |
| Inventory adjustment | Movement for every wired mutation, including batch adjust |
| Batch disposal | Recorded as an `EXPIRED` movement, with performer (the requested type is preserved) |
| Return | `returnedBy` and movements |
| Smart reorder approval | Status only; no approver |
| Notification dispatch | Recipient status only |

## 9. Remaining observability gaps

Implemented in Phase 5:

1. Structured JSON logging with request id, user id, route, status, and duration.
2. Readiness endpoint checking MongoDB and Redis.

Still not implemented:

1. Error aggregation (Sentry or equivalent).
2. Metrics for request rate/latency/errors and job duration.
3. Audit collection for auth and administrative actions.
4. Alerting on failed cron runs and notification backlogs.
5. Stock reconciliation report comparing batches and aggregates.
6. Retention policy for `backgroundjobs` and `inventorymovements`.

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
| Notifications stuck Pending | Dispatch not called, or the retry sweep is failing; never-attempted rows are swept next tick, abandoned claims after 15 minutes |
| WebSocket never delivers | Cookie not sent on upgrade, expired token, no open socket |
| Stock mismatch | Aggregate-only operations, GOOD returns, sale deletion |

## Related documents

- [Background jobs](background-jobs.md)
- [External integrations](external-integrations.md)
- [Error handling](../api/error-handling.md)
- [Reporting](../modules/reporting.md)
