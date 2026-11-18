# Redis and Caching

## 1. Role of Redis

Redis is used only for **cache-aside reads**:

| Feature | Key pattern | TTL |
|---|---|---|
| Combined dashboard | `dashboard:full-summary` | 60 seconds |
| Smart reorder per medicine | `reorder:{medicineId}` | 12 hours |

It is not used for sessions, rate limiting, queues, locks, or pub/sub. Authentication is stateless JWT.

## 2. Configuration

Source: `server/src/config/redis.config.ts`

```ts
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redis = redisUrl ? new Redis(redisUrl) : new Redis(options);
```

If `UPSTASH_REDIS_REST_URL` is set, it is passed **directly** to `ioredis`. Otherwise, host/port/password are derived by parsing that URL (host from after `@`, port from after `:`, password from `UPSTASH_REDIS_REST_TOKEN`).

Consequences:

- `ioredis` expects a `redis://` or `rediss://` URL. An Upstash **REST** URL (`https://...`) is not a valid ioredis target and may fail at startup. The environment variable name suggests the REST endpoint, not the TCP endpoint.
- The parsing fallback branch is dead whenever the variable is set, because the direct URL branch wins.
- `UPSTASH_REDIS_REST_TOKEN` is used as the password in the fallback branch but is **not** listed in `.env.example`.
- `maxRetriesPerRequest: null` is set in the options object, which only applies when the fallback branch is used.

Status: **Unverified** against a live Upstash instance. Treat the connection configuration as fragile until tested with the actual deployment values.

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

`deleteCache` is exported but unused.

No key prefixing by environment or tenant is applied. Two deployments sharing a Redis database would collide.

## 6. Dashboard cache

`DashboardService.getFullDashboard`:

1. `getCache("dashboard:full-summary")`.
2. On hit, return the parsed object.
3. On miss, run eight metric groups in parallel, then `setCache(..., 60)`.

Notes:

- The source comment says "2 min", but the constant is `60` seconds.
- Individual dashboard endpoints (`/summary`, `/profit`, etc.) are not cached.
- Writes do not invalidate the key; a sale can take up to 60 seconds to appear.
- A Redis error propagates through the controller as a 500 (no fallback to computing without cache).

## 7. Smart reorder cache

Key: `reorder:{medicineId}`. TTL: 12 hours (`12 * 60 * 60`).

Flow:

1. Read cache; return if present.
2. Compute the recommendation.
3. If stock is above ROP, cache `{ reorderNeeded: false, ... }` and **throw 400**.
4. Otherwise persist a `PENDING` record and cache it.

Consequences:

- A negative result (`reorderNeeded: false`) is cached, then the same request throws 400. **On subsequent requests within the TTL, the cached negative object is returned with HTTP 200/201** because the cache lookup returns before the reorder-point check. This means a second `generate` call for the same medicine can report success and even be counted as `created` by `generateForAllMedicines`.
- A cached positive recommendation is returned instead of a fresh database read. Its shape is the JSON serialized at cache time.
- No invalidation after sales, receipts, returns, or stock adjustments. A recommendation can be 12 hours stale.
- `deleteCache` is not called anywhere.
- Repeated `generate` calls within the TTL return the same cached recommendation and do not create duplicates.
- After 12 hours, a new generation can create another pending recommendation for the same medicine; there is no uniqueness constraint or deduplication.

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
