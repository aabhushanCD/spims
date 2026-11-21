# Environment Variables

All variables are read via `process.env`. No values are reproduced here.

## 1. Variables used by code

| Variable | Required | Used by | Purpose | Notes |
|---|---|---|---|---|
| `MONGO_URI` | Yes | `config/db.config.ts` | MongoDB connection string | Process exits if connection fails |
| `JWT_SECRET` | Yes | `modules/auth/utils/authTokens.ts`, `shared/middleware/verifyJwt.ts` | HS256 signing key for access tokens | Validated at startup (`assertAuthConfig`) |
| `JWT_REFRESH_SECRET` | Production | `modules/auth/utils/authTokens.ts` | Separate HS256 key for refresh tokens | Falls back to `JWT_SECRET` in development; required in production |
| `JWT_ACCESS_EXPIRES_IN` | No | `authConfig.ts` | Access-token lifetime (`15m`, `1h`, `7d`) | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | `authConfig.ts` | Refresh-token lifetime | Default `7d` |
| `REFRESH_TOKEN_GRACE_PERIOD` | No | `authConfig.ts` | Window in which the previous rotated refresh token is still accepted | Default `60s`; prevents multi-tab logout races |
| `PASSWORD_RESET_EXPIRES_IN` | No | `authConfig.ts` | Password-reset link lifetime | Default `30m` |
| `EMAIL_VERIFICATION_EXPIRES_IN` | No | `authConfig.ts` | Email-verification link lifetime | Default `24h` |
| `CLIENT_URL` | Production | `authConfig.ts` | Frontend origin used in email links | Default `http://localhost:5173`; required in production |
| `MAX_SESSIONS_PER_USER` | No | `authConfig.ts` | Active refresh sessions kept per user | Default `10`; oldest sessions are revoked |
| `PORT` | No | `server.ts` | HTTP port | Default `3000` |
| `TRUST_PROXY` | No | `server.ts` | Enables Express `trust proxy` for `req.ip` | `true` (one hop) or a hop count; leave unset when directly exposed |
| `ALLOWED_ORIGINS` | No | `server.ts`, `verifyOrigin.middleware.ts` | JSON array of allowed CORS/Origin values | Defaults to `["http://localhost:5173","http://localhost:5174"]` |
| `REDIS_URL` | Yes (or host/port) | `config/redis.target.ts` | Preferred Redis URL | `redis://` or `rediss://` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | No | `config/redis.target.ts` | Fallback TCP connection | Default `localhost:6379` |
| `UPSTASH_REDIS_REST_URL` | No | `config/redis.target.ts` | Legacy Upstash URL | REST `https://` URLs are converted to `rediss://<host>:6379` |
| `UPSTASH_REDIS_REST_TOKEN` | No | `config/redis.target.ts` | Password for converted Upstash URL | |
| `LOG_LEVEL` | No | `shared/logger.ts` | Structured log level | `debug`, `info`, `warn`, `error`; default `info` |
| `NODE_ENV` | No | Cookie and token config | Cookie security and production-required env checks | `production` enables `secure`, `SameSite=None`, and requires refresh/CLIENT env values |
| `SMTP_HOST` | Production | `email.provider.ts` | SMTP host | In development, missing value uses the JSON transport that logs email text. In production, `assertEmailConfig()` refuses to boot without it |
| `SMTP_PORT` | No | `email.provider.ts` | SMTP port | Default `587` |
| `SMTP_SECURE` | No | `email.provider.ts` | `"true"` for TLS | Default `false` |
| `SMTP_USER` | No | `email.provider.ts` | SMTP username | Optional |
| `SMTP_PASS` | No | `email.provider.ts` | SMTP password | Optional |
| `SMTP_FROM` | No | `email.provider.ts` | From address | Defaults to `SMTP_USER` or `no-reply@spims.local` |
| `SMS_WEBHOOK_URL` | For SMS | `sms.provider.ts` | SMS provider endpoint | Missing value makes SMS delivery fail non-retryably |
| `SMS_API_KEY` | No | `sms.provider.ts` | Bearer token for the SMS webhook | Sent only when set |
| `REPORTING_TIMEZONE` | No | `config/reporting.config.ts` | IANA timezone for reporting month/year boundaries and grouping | Default `Asia/Kathmandu`; invalid values fail fast at boot |

## 2. Example template (names only)

The committed `.env.example` contains:

```env
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_GRACE_PERIOD=60s
CLIENT_URL=http://localhost:5173
PASSWORD_RESET_EXPIRES_IN=30m
EMAIL_VERIFICATION_EXPIRES_IN=24h
MAX_SESSIONS_PER_USER=10
PORT=
NODE_ENV=
TRUST_PROXY=
REDIS_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
LOG_LEVEL=info
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:5174"]
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
REPORTING_TIMEZONE=Asia/Kathmandu
SMS_WEBHOOK_URL=
SMS_API_KEY=
```

## 3. Value formats

| Variable | Format | Example shape |
|---|---|---|
| `MONGO_URI` | MongoDB URI | `mongodb://host:27017/db` or `mongodb+srv://...` |
| `JWT_SECRET` | Random string | At least 32 bytes recommended |
| `JWT_REFRESH_SECRET` | Random string, different from `JWT_SECRET` | At least 32 bytes recommended |
| `JWT_ACCESS_EXPIRES_IN` | Duration with `s`, `m`, `h`, or `d` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Duration with `s`, `m`, `h`, or `d` | `7d` |
| `PASSWORD_RESET_EXPIRES_IN` | Duration | `30m` |
| `EMAIL_VERIFICATION_EXPIRES_IN` | Duration | `24h` |
| `CLIENT_URL` | Exact frontend origin, no trailing slash | `https://app.example.com` |
| `MAX_SESSIONS_PER_USER` | Positive integer | `10` |
| `PORT` | Integer string | `3000` |
| `ALLOWED_ORIGINS` | JSON array of exact origins | `["https://app.example.com"]` |
| `UPSTASH_REDIS_REST_URL` | Redis URL for ioredis | `redis://host:6379` or `rediss://...` |
| `SMS_WEBHOOK_URL` | HTTPS URL | `https://sms.example.com/send` |
| `SMS_API_KEY` | Random string | Sent as `Authorization: Bearer <key>` |
| `REPORTING_TIMEZONE` | IANA timezone name | `Asia/Kathmandu`, `UTC` |
| `NODE_ENV` | `development` / `production` | unset in development |

## 4. Loading order

`config/env.ts` calls `dotenv.config()` and is imported by `server.ts`, `config/db.config.ts`, `config/redis.config.ts`, and other config modules that read env at module scope. This removes the previous dependency on the auth route import chain and makes `dotenv.config()` calls in middleware unnecessary.

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
| `JWT_SECRET` | `assertAuthConfig()` fails at startup if missing |
| `JWT_REFRESH_SECRET` | Required in production at startup; falls back to `JWT_SECRET` in development |
| `CLIENT_URL` | Required in production at startup |
| `ALLOWED_ORIGINS` | JSON parse with fallback |
| Redis URL | `resolveRedisTarget` rejects unsupported schemes; connection is still verified by `ping` at startup |
| `LOG_LEVEL` | Unknown values fall back to `info` |
| SMTP | `assertEmailConfig()` requires `SMTP_HOST` in production; development falls back to the JSON transport |
| SMS | Not validated at startup; missing `SMS_WEBHOOK_URL` fails each SMS recipient non-retryably |
| `REPORTING_TIMEZONE` | `assertReportingConfig()` validates the IANA name at startup; defaults to `Asia/Kathmandu` |
| `NODE_ENV` | Not validated; any value other than `production` behaves as development |

## 7. Recommended additions (not implemented)

- Full startup schema validation with Zod for every variable.
- Enforce a minimum `JWT_SECRET` / `JWT_REFRESH_SECRET` length.
- Support `REDIS_URL` explicitly and distinguish REST from TCP.
- Make Redis optional at boot. Rate limiting currently fails open if Redis is unavailable.
- Validate SMTP credentials before enabling email verification in production.

## Related documents

- [Setup and installation](setup-and-installation.md)
- [Redis and caching](../infrastructure/redis-and-caching.md)
- [External integrations](../infrastructure/external-integrations.md)
