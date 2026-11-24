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
| `AUTH_LOCKOUT_THRESHOLD` | No | `authConfig.ts` | Failed sign-ins before the account lock | Default `5` |
| `AUTH_LOCKOUT_WINDOW` | No | `authConfig.ts` | Failure-counting window | Default `15m` |
| `AUTH_LOCKOUT_DURATION` | No | `authConfig.ts` | Lock duration | Default `15m`; `423 ACCOUNT_LOCKED` includes `Retry-After` |
| `PORT` | No | `server.ts` | HTTP port | Default `3000` |
| `TRUST_PROXY` | No | `server.ts` | Enables Express `trust proxy` for `req.ip` | `true` (one hop) or a hop count; leave unset when directly exposed |
| `ALLOWED_ORIGINS` | No | `createApp.ts`, `server.ts`, `allowedOrigins.ts`, `verifyOrigin.middleware.ts` | JSON array of allowed CORS/HTTP/WebSocket origins | Defaults to `["http://localhost:5173","http://localhost:5174"]`; production requires an `Origin` on WebSocket upgrades |
| `ENABLE_API_DOCS` | No | `createApp.ts` | Enables `/api-docs` in production | `true` enables the UI and spec for owner sessions; outside production docs are always on |
| `REDIS_URL` | Yes (or host/port) | `config/redis.target.ts` | Preferred Redis URL | `redis://` or `rediss://` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | No | `config/redis.target.ts` | Fallback TCP connection | Default `localhost:6379` |
| `UPSTASH_REDIS_REST_URL` | No | `config/redis.target.ts` | Legacy Upstash URL | REST `https://` URLs are converted to `rediss://<host>:6379` |
| `UPSTASH_REDIS_REST_TOKEN` | No | `config/redis.target.ts` | Password for converted Upstash URL | |
| `LOG_LEVEL` | No | `shared/logger.ts` | Structured log level | `debug`, `info`, `warn`, `error`; default `info` |
| `NODE_ENV` | No | Cookie and token config | Cookie security and production-required env checks | `production` enables `secure`, `SameSite=None`, and requires refresh/CLIENT env values |
| `EMAIL_PROVIDER` | No | `email.provider.ts` | Active email transport | `brevo` (HTTPS API) or `smtp`; unset auto-detects: `SMTP_HOST` wins, then `BREVO_API_KEY`, then the development JSON transport |
| `BREVO_API_KEY` | Production with Brevo | `email.provider.ts` | Brevo API v3 key | Sent in the `api-key` header to `https://api.brevo.com/v3/smtp/email`; uses HTTPS 443, so it works on Render free where SMTP ports are blocked |
| `EMAIL_FROM` | Production with Brevo | `email.provider.ts` | Verified sender address | Required for Brevo; falls back to `SMTP_FROM` for SMTP. Must be verified in the Brevo account |
| `EMAIL_FROM_NAME` | No | `email.provider.ts` | Sender display name | Default `SPIMS` |
| `SMTP_HOST` | Production with SMTP | `email.provider.ts` | SMTP host | In development, a missing provider uses the JSON transport that logs email text. In production, `assertEmailConfig()` refuses to boot without a configured provider |
| `SMTP_PORT` | No | `email.provider.ts` | SMTP port | Default `587` |
| `SMTP_SECURE` | No | `email.provider.ts` | `"true"` for TLS | Default `false` |
| `SMTP_USER` | No | `email.provider.ts` | SMTP username | Optional |
| `SMTP_PASS` | No | `email.provider.ts` | SMTP password | Optional |
| `SMTP_FROM` | No | `email.provider.ts` | From address for the SMTP transport | Defaults to `SMTP_USER` or `no-reply@spims.local` |
| `SMS_WEBHOOK_URL` | For SMS | `sms.provider.ts` | SMS provider endpoint | Missing value makes SMS delivery fail non-retryably |
| `SMS_API_KEY` | No | `sms.provider.ts` | Bearer token for the SMS webhook | Sent only when set |
| `SEED_OWNER_EMAIL` | Seed only | `scripts/seed.ts` | First owner email | Required by `db:seed` |
| `SEED_OWNER_PASSWORD` | Seed only | `scripts/seed.ts` | First owner password | Required; minimum 8 characters; bcrypt-hashed |
| `SEED_OWNER_NAME` | No | `scripts/seed.ts` | First owner display name | Default `SPIMS Owner` |
| `SEED_ALLOW_PRODUCTION` | No | `scripts/seed.ts` | Production seeding guard | Must be `true` when `NODE_ENV=production` |
| `VAT_PERCENT` | No | `config/vat.config.ts` | VAT percentage for new sales and refunds | Default `13`; validated at startup; snapshotted per sale/return |
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
AUTH_LOCKOUT_THRESHOLD=5
AUTH_LOCKOUT_WINDOW=15m
AUTH_LOCKOUT_DURATION=15m
PORT=
NODE_ENV=
TRUST_PROXY=
REDIS_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
LOG_LEVEL=info
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:5174"]
ENABLE_API_DOCS=false
EMAIL_PROVIDER=
BREVO_API_KEY=
EMAIL_FROM=
EMAIL_FROM_NAME=SPIMS
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
REPORTING_TIMEZONE=Asia/Kathmandu
VAT_PERCENT=13
SMS_WEBHOOK_URL=
SMS_API_KEY=

# Used only by `npm run db:seed`; never commit a real password.
SEED_OWNER_EMAIL=
SEED_OWNER_PASSWORD=
SEED_OWNER_NAME=SPIMS Owner
SEED_ALLOW_PRODUCTION=false
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
| `AUTH_LOCKOUT_THRESHOLD` | Positive integer | `5` |
| `AUTH_LOCKOUT_WINDOW` | Duration with `s`, `m`, `h`, or `d` | `15m` |
| `AUTH_LOCKOUT_DURATION` | Duration with `s`, `m`, `h`, or `d` | `15m` |
| `PORT` | Integer string | `3000` |
| `ALLOWED_ORIGINS` | JSON array of exact origins | `["https://app.example.com"]` |
| `ENABLE_API_DOCS` | Boolean string | `true` |
| `EMAIL_PROVIDER` | `brevo`, `smtp`, or `json` | `brevo` |
| `BREVO_API_KEY` | Secret string | Provided by a secret manager; never committed |
| `EMAIL_FROM` | Verified email address | `no-reply@example.com` |
| `EMAIL_FROM_NAME` | String | `SPIMS` |
| `UPSTASH_REDIS_REST_URL` | Redis URL for ioredis | `redis://host:6379` or `rediss://...` |
| `SMS_WEBHOOK_URL` | HTTPS URL | `https://sms.example.com/send` |
| `SMS_API_KEY` | Random string | Sent as `Authorization: Bearer <key>` |
| `SEED_OWNER_EMAIL` | Valid email | `owner@example.com` |
| `SEED_OWNER_PASSWORD` | String, minimum 8 characters | Provided by a secret manager |
| `SEED_OWNER_NAME` | String | `Pharmacy Owner` |
| `SEED_ALLOW_PRODUCTION` | Boolean string | `true` |
| `VAT_PERCENT` | Number 0–100 | `13` |
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
- Never log the Brevo API key or SMTP password; provider errors store only the status and response message.

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
| Email | `assertEmailConfig()` requires `EMAIL_PROVIDER=brevo` with `BREVO_API_KEY` and `EMAIL_FROM`, or `SMTP_HOST`, in production; development falls back to the JSON transport |
| SMS | Not validated at startup; missing `SMS_WEBHOOK_URL` fails each SMS recipient non-retryably |
| `REPORTING_TIMEZONE` | `assertReportingConfig()` validates the IANA name at startup; defaults to `Asia/Kathmandu` |
| `NODE_ENV` | Not validated; any value other than `production` behaves as development |

### Email on Render free

Render free web services block outbound traffic on ports 25, 465, and 587, so
Gmail and other SMTP relays cannot be reached. Use the Brevo HTTPS API instead:

```env
EMAIL_PROVIDER=brevo
BREVO_API_KEY=<secret>
EMAIL_FROM=verified-sender@example.com
EMAIL_FROM_NAME=SPIMS
```

The provider posts to `https://api.brevo.com/v3/smtp/email` over HTTPS 443.
Verify the sender in Brevo first. `npm run email:test -- you@example.com` sends
a one-off test using the configured environment.

## 7. Recommended additions (not implemented)

- Full startup schema validation with Zod for every variable.
- Enforce a minimum `JWT_SECRET` / `JWT_REFRESH_SECRET` length.
- Support `REDIS_URL` explicitly and distinguish REST from TCP.
- Make Redis optional at boot. Rate limiting currently fails open if Redis is unavailable.
- Validate email provider credentials before enabling email verification in production (`npm run email:test -- <recipient>`).

## Related documents

- [Setup and installation](setup-and-installation.md)
- [Redis and caching](../infrastructure/redis-and-caching.md)
- [External integrations](../infrastructure/external-integrations.md)
