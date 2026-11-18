# Environment Variables

All variables are read via `process.env`. No values are reproduced here.

## 1. Variables used by code

| Variable | Required | Used by | Purpose | Notes |
|---|---|---|---|---|
| `MONGO_URI` | Yes | `config/db.config.ts` | MongoDB connection string | Process exits if connection fails |
| `JWT_SECRET` | Yes | `shared/utils/generateJwtToken.ts`, `shared/middleware/verifyJwt.ts` | HS256 signing key | No validation at startup; missing value causes runtime failures |
| `PORT` | No | `server.ts` | HTTP port | Default `3000` |
| `ALLOWED_ORIGINS` | No | `server.ts` | JSON array of allowed CORS origins | Defaults to `["http://localhost:5173","http://localhost:5174"]`; invalid JSON falls back with a console error |
| `UPSTASH_REDIS_REST_URL` | Yes (for startup) | `config/redis.config.ts` | Redis URL | Passed directly to `ioredis` when set; `https://` REST URLs are not valid for ioredis |
| `UPSTASH_REDIS_REST_TOKEN` | No | `config/redis.config.ts` | Redis password in fallback branch | Not in `.env.example` |
| `NODE_ENV` | No | `auth.controller.ts` | Cookie security flags | `production` enables `secure` and `SameSite=None` |
| `SMTP_HOST` | No | `email.provider.ts` | SMTP host | Falls back to Ethereal |
| `SMTP_PORT` | No | `email.provider.ts` | SMTP port | Falls back to Ethereal |
| `SMTP_SECURE` | No | `email.provider.ts` | `"true"` for TLS | Falls back to Ethereal |
| `SMTP_USER` | No | `email.provider.ts` | SMTP username | Falls back to Ethereal |
| `SMTP_PASS` | No | `email.provider.ts` | SMTP password | Falls back to Ethereal |
| `SMTP_FROM` | No | `email.provider.ts` | From address | Defaults to `SMTP_USER` |

## 2. Example template (names only)

The committed `.env.example` contains:

```env
MONGO_URI=
JWT_SECRET=
PORT=
UPSTASH_REDIS_REST_URL=
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:5174"]
```

It omits:

- `NODE_ENV`
- `UPSTASH_REDIS_REST_TOKEN`
- All `SMTP_*` variables

## 3. Value formats

| Variable | Format | Example shape |
|---|---|---|
| `MONGO_URI` | MongoDB URI | `mongodb://host:27017/db` or `mongodb+srv://...` |
| `JWT_SECRET` | Random string | At least 32 bytes recommended |
| `PORT` | Integer string | `3000` |
| `ALLOWED_ORIGINS` | JSON array of exact origins | `["https://app.example.com"]` |
| `UPSTASH_REDIS_REST_URL` | Redis URL for ioredis | `redis://host:6379` or `rediss://...` |
| `NODE_ENV` | `development` / `production` | unset in development |

## 4. Loading order and an order-dependent side effect

`server.ts` has static imports followed by `dotenv.config()` in the module body. Under ESM, all static imports are evaluated **before** the body runs.

However, `.env` is normally loaded earlier by accident:

- `app.routes.ts` imports `auth.route.ts` first.
- `auth.route.ts` imports `shared/middleware/verifyToken.ts`.
- `verifyToken.ts` calls `dotenv.config()` at **module scope**.
- This happens before `app.routes.ts` imports the container, which imports Redis and SMTP providers.

Consequences:

- `MONGO_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `PORT`, `NODE_ENV`, Redis, and SMTP values are normally available from `.env` by the time they are read.
- The `dotenv.config()` call in `server.ts` is later and effectively redundant.
- The behavior depends on import order. Refactoring the auth/verify-token imports could silently change when `.env` is loaded.

Status: **Implemented by import-order side effect**, not by a deliberate bootstrap. A robust setup would load dotenv in a dedicated entry module before anything else (or use the runtime's `--env-file`).

## 5. Security rules

- Never commit `.env` (it is gitignored).
- Never log secrets. The code logs error objects that may include connection strings in driver errors.
- Use different secrets per environment.
- Rotate `JWT_SECRET` invalidates all tokens.
- Do not put the Upstash REST token in client code.

## 6. Startup validation gaps

| Variable | Validated? |
|---|---|
| `MONGO_URI` | Only by the driver; failure exits |
| `JWT_SECRET` | Not at startup; login fails later if missing |
| `ALLOWED_ORIGINS` | JSON parse with fallback |
| Redis URL | Only by `ioredis`/`ping`; failure exits |
| SMTP | Not validated; Ethereal fallback |
| `NODE_ENV` | Not validated; any value other than `production` behaves as development |

## 7. Recommended additions (not implemented)

- Startup schema validation with Zod for env.
- Fail fast if `JWT_SECRET` is missing or short.
- Support `REDIS_URL` explicitly and distinguish REST from TCP.
- Make Redis optional at boot.
- Make SMTP optional without network calls at import.
- Document `SMTP_*` and `NODE_ENV` in `.env.example`.

## Related documents

- [Setup and installation](setup-and-installation.md)
- [Redis and caching](../infrastructure/redis-and-caching.md)
- [External integrations](../infrastructure/external-integrations.md)
