# External Integrations

## 1. Summary

| Integration | Status | Notes |
|---|---|---|
| MongoDB | Implemented | Primary datastore |
| Redis (ioredis) | Implemented | Cache only |
| SMTP / Nodemailer | Partially Implemented | Falls back to an Ethereal test account |
| WebSocket (`ws`) | Implemented | In-process |
| Upstash REST client | Not Implemented | Package installed, unused |
| SMS provider | Not Implemented | Type accepted, no delivery |
| Payment gateways (eSewa/Khalti/Stripe) | Not Implemented | Payment method is a label |
| File storage/S3 | Not Implemented | Invoice file is a string |
| Google OAuth | Not Implemented | Schema field only |
| Docker/NGINX/CI deploy | Not present in repository | Claims exist in `SECURITY.md` |

## 2. SMTP and email

Source: `server/src/shared/provider/email.provider.ts`

```ts
const user = await nodemailer.createTestAccount();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || user.smtp.host,
  port: Number(process.env.SMTP_PORT) || user.smtp.port,
  secure: process.env.SMTP_SECURE === "true" || user.smtp.secure,
  auth: {
    user: process.env.SMTP_USER || user.user,
    pass: process.env.SMTP_PASS || user.pass,
  },
});
```

### Behavior

- At module import, `nodemailer.createTestAccount()` contacts Ethereal and creates a temporary account.
- If SMTP env vars are absent, the Ethereal account is used.
- `sendEmail` sends plain text with `from = SMTP_FROM || SMTP_USER`.
- There is no HTML template, attachment, retry, or bounce handling.
- The test account is ephemeral; messages are visible only in Ethereal, not delivered to real inboxes.
- Because this runs at import time, startup performs an outbound network call before the server listens. Offline startup or Ethereal downtime can delay or break boot.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `SMTP_HOST` | no | SMTP host |
| `SMTP_PORT` | no | SMTP port |
| `SMTP_SECURE` | no | `"true"` for TLS |
| `SMTP_USER` | no | SMTP username |
| `SMTP_PASS` | no | SMTP password |
| `SMTP_FROM` | no | From address |

None are in `.env.example`.

### Usage

Only `NotificationService.dispatchToRecipient` calls `sendEmail`, for notifications with `type: "Email"`.

## 3. Redis / Upstash

| Item | Detail |
|---|---|
| Client | `ioredis` |
| URL variable | `UPSTASH_REDIS_REST_URL` |
| Password variable | `UPSTASH_REDIS_REST_TOKEN` (fallback branch only) |
| Package `@upstash/redis` | Installed, never imported |
| Startup check | `redis.ping()` before listening |

The variable naming suggests Upstash's REST API, but the code passes the value to a TCP Redis client. See [Redis and caching](redis-and-caching.md) for the failure modes.

## 4. WebSocket

`ws` runs in the same HTTP server. It is an internal integration, documented in [Realtime communication](realtime-communication.md).

## 5. MongoDB

- Connection string: `MONGO_URI`.
- Transactions require a replica set (Atlas provides this by default).
- No TLS options are set explicitly; the driver uses URI options.
- No read preference, write concern, or retry configuration.

## 6. Payment gateways

There is no gateway code, SDK, webhook, or signature verification. `paymentMethod` accepts `CASH`, `CARD`, `QR`, `Mobile Banking`, `CREDIT`, but no payment record is created.

The root README lists eSewa and Khalti as future improvements. They are **Not Implemented**.

## 7. SMS

`Notification.type` includes `SMS`, and the controller accepts it. `dispatchToRecipient` has no SMS branch, so the recipient is immediately marked `Sent` without any provider call.

Status: **Not Implemented**; the API surface is misleading.

## 8. File uploads

`PurchaseOrder.invoiceFile` is a string. There is no multer, S3, GridFS, or static file route. Clients can only store a URL or filename they already have.

## 9. Google OAuth

`User.provider` can be `google`, and `password` is conditional on `local`. There is no OAuth route, callback, token exchange, or client configuration. Google users cannot authenticate.

## 10. Outbound calls inventory

| Destination | Trigger | Blocking? |
|---|---|---|
| MongoDB | Startup and every request |
| Redis | Startup and cache operations |
| Ethereal/SMTP | Module import and email dispatch |
| No other services | — |

No HTTP client is used for business integrations.

## 11. Operational implications

- A deployment must provide MongoDB and Redis; the SMTP/Ethereal path is best-effort.
- Real email requires all `SMTP_*` variables; otherwise messages are not delivered to users.
- There is no integration health check; `/health` returns OK regardless of dependencies.
- No retry/outbox exists for failed emails; failed recipients can be re-dispatched manually.

## 12. Configuration checklist

| Capability | Variables |
|---|---|
| Database | `MONGO_URI` |
| Auth | `JWT_SECRET` |
| Cache | `UPSTASH_REDIS_REST_URL`, optionally `UPSTASH_REDIS_REST_TOKEN` |
| CORS | `ALLOWED_ORIGINS` (JSON array) |
| Port | `PORT` |
| Cookies | `NODE_ENV` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |

## Related documents

- [Environment variables](../development/environment-variables.md)
- [Redis and caching](redis-and-caching.md)
- [Notifications](../modules/notifications.md)
- [Setup and installation](../development/setup-and-installation.md)
