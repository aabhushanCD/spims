# Redis and Caching

## 1. Role of Redis

Redis is used for cache-aside reads plus short-lived distributed locks for the cron jobs:

| Feature | Key pattern | TTL |
|---|---|---|
| Combined dashboard | `dashboard:full-summary` | 60 seconds |
| Smart reorder per medicine | `reorder:{medicineId}` | 12 hours |
| Auth rate limiting | `rate-limit:*` | window-scoped |
| Cron locks | `lock:expiry-check`, `lock:reorder-calculation`, `lock:notification-retry` | job-scoped |

It is not used for sessions, queues, or pub/sub. Authentication is stateless JWT.

## 2. Configuration

Source: `server/src/config/redis.config.ts`

`config/redis.target.ts` resolves the target before any client is created:

- `REDIS_URL` is preferred and may be `redis://` or `rediss://`.
- An Upstash REST `https://` URL is converted to `rediss://<host>:6379` with `UPSTASH_REDIS_REST_TOKEN` as the password.
- Without a URL, `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` are used, defaulting to `localhost:6379`.
- Unsupported URL schemes fail fast with a clear error.

`config/env.ts` loads `.env` before any config module reads `process.env`, removing the previous import-order dependency. `LOG_LEVEL` controls structured log output.

## 3. Startup dependency

`server.ts` calls `redis.ping()` before connecting to MongoDB and before listening. If Redis is unreachable, the process exits with code 1.

Implication: the API cannot start in a degraded mode without Redis, even though only two read paths use it.

## 4. Client library

- Runtime client: `ioredis` (dependency).
- `@upstash/redis` is installed but never imported.
- No connection pooling configuration, TLS options, or cluster support.
- Error and connect events are logged to the console.

## 5. Cache helpers

Source: `server/src/shared/provider/redis.provider.ts`

| Function | Behavior |
|---|---|
| `getCache(key)` | `GET`, JSON.parse if non-null, else `null` |
| `setCache(key, value, ttl)` | `SET key JSON EX ttl` |
| `deleteCache(key)` | `DEL` |

`deleteCache` powers the shared cache invalidator used by stock, purchase, sales, returns, batch, notification, and reorder writes.

No key prefixing by environment or tenant is applied. Two deployments sharing a Redis database would collide.

## 6. Dashboard cache

`DashboardService.getFullDashboard`:

1. `getCache("dashboard:full-summary")`.
2. On hit, return the parsed object.
3. On miss, run eight metric groups in parallel, then `setCache(..., 60)`.

Notes:

- TTL is `60` seconds.
- Individual dashboard endpoints (`/summary`, `/profit`, etc.) are not cached.
- Writes invalidate the key through `CacheInvalidator`; the TTL remains a fallback.
- A Redis error still propagates through the controller as a 500; cache invalidation failures are logged and do not fail the write.

## 7. Smart reorder cache

Key: `reorder:{medicineId}`. TTL: 12 hours (`12 * 60 * 60`).

Flow:

1. Read cache; return if present.
2. Compute the recommendation.
3. If stock is above ROP, cache `{ reorderNeeded: false, ... }` and **throw 400**.
4. Otherwise persist a `PENDING` record and cache it.

Behavior:

- A cached negative result still throws `400`; the endpoint contract does not change on a cache hit.
- A cached positive recommendation is returned instead of a fresh database read.
- Stock-changing writes invalidate `reorder:{medicineId}`; purchase and expiry writes also invalidate the dashboard.
- Repeated generation updates the single PENDING recommendation instead of creating duplicates.
- A partial unique index on `{ medicineId }` for `status: "PENDING"` enforces the invariant in MongoDB.

## 8. Cache data shape

The dashboard value is a plain object of nested metrics. The reorder value is either:

```json
{
  "medicineId": "...",
  "reorderNeeded": false,
  "currentStock": 100,
  "reorderPoint": 30
}
```

or the recommendation document with algorithm fields.

JSON serialization means Mongoose-specific types (ObjectId) become strings. Code that expects ObjectIds from cached values may behave differently than from database reads.

## 9. Failure modes

| Failure | Effect |
|---|---|
| Redis unavailable at startup | Process exits |
| Redis unavailable at runtime (dashboard) | 500 on `/dashboard` |
| Redis unavailable at runtime (reorder) | 500 on generation |
| Corrupt JSON in a key | `JSON.parse` throws → 500 |
| Key collision across environments | Wrong cached data |
| Stale cache | Dashboard ≤ 60 s; reorder ≤ 12 h |
| Clock/timezone | TTLs are relative, unaffected |

## 10. What is not cached

- Medicine lists and searches.
- Inventory and batch reads.
- Sales, purchases, returns.
- Notifications.
- Individual dashboard metrics.
- Auth/user lookups.

## 11. Operational recommendations

- Confirm whether the deployment provides a TCP Redis URL or the Upstash REST URL; use a `rediss://` URL for TLS.
- Set `UPSTASH_REDIS_REST_TOKEN` in the environment if the fallback path is used.
- Add a cache prefix per environment.
- Consider making Redis optional at startup if the cache is not critical.
- Invalidate `reorder:{medicineId}` after stock-changing operations if freshness matters.
- Align the dashboard TTL constant with its comment.

## Related documents

- [Background jobs](background-jobs.md)
- [Reporting](../modules/reporting.md)
- [Smart reorder](../modules/smart-reorder.md)
- [Environment variables](../development/environment-variables.md)
