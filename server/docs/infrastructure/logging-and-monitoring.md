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
| `config/db.config.ts` | MongoDB connected / error event | info/error |
| `config/redis.config.ts` | Redis connected / connection error | info/error |
| `shared/middleware/verifyToken.ts` | JWT/session/token-version verification failures | warn |
| `shared/middleware/requestLogger.ts` | HTTP request completion with request id, user id, status, duration | info |
| `shared/middleware/globalError.middleware.ts` | Unhandled error with method/path/stack | error |
| `modules/audit/service/audit.service.ts` | Audit persistence failure | error |
| `shared/security/sessionRevocation.ts` | Deny-list read/write failures | warn |
| `shared/security/tokenVersion.ts` | Version-cache read/write failures | warn |
| `modules/backgroundJobs/jobs/*.job.ts` | Job completion/failure | info/error |
| `server.ts` | Server started/startup failure; WebSocket origin/revocation rejection | info/error |

Concerns:

- Logs are JSON lines and redact the configured secret keys, but callers must still avoid passing raw tokens or passwords in metadata.
- Audit metadata is additionally redacted for keys matching password/token/secret/authorization/cookie/api-key.

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
| Failed login | 401/423 to client; `AuditLog` row with reason (never the password) |
| Failed email | Recipient `Failed` with stored error and scheduled retries |
| Failed SMS | Recipient `Failed` with stored error and scheduled retries |
| Dropped WebSocket | Nothing |
| Cron crash | `FAILED` job record + console error |
| Redis outage | Console error; requests fail |
| MongoDB outage | Driver errors; startup exits, runtime 500s |

## 8. Audit trail gaps

| Event | Audit record |
|---|---|
| Login/logout | `AuditLog` success/failure/lock rows; login also updates `lastLogin` |
| User create/update/delete | `AuditLog` rows with actor and changed fields |
| Role change / activation / admin reset / force logout | `AuditLog` rows |
| Session revocation | `AuditLog` row; Redis deny-list entry |
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
3. Alerting on failed cron runs and notification backlogs.
4. Stock reconciliation report comparing batches and aggregates.
5. Retention policy for `auditlogs`, `backgroundjobs`, and `inventorymovements`.
6. Audit coverage for purchase/return/reorder approvals (the model and read API exist; those write sites are Phase 6.3–6.6).

## 10. Practical diagnosis guide

| Symptom | Check |
|---|---|
| 500 on many endpoints | Server console for Mongoose `CastError`/`ValidationError` |
| Login fails unexpectedly | `JWT_SECRET`, cookie domain/SameSite, `ALLOWED_ORIGINS`, email-verification state |
| Refresh always 401 | Cookie path `/api/auth`, `JWT_REFRESH_SECRET`, revoked/expired `AuthSession` |
| Reset/verification link missing | No email provider configured (link is in `[Email:dev]` console output), Brevo sender not verified, or `CLIENT_URL` wrong |
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
