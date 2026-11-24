# External Integrations

## 1. Summary

| Integration | Status | Notes |
|---|---|---|
| MongoDB | Implemented | Primary datastore |
| Redis (ioredis) | Implemented | Cache and auth rate limiting |
| Email providers | Implemented | SMTP (Nodemailer) or Brevo HTTPS API; lazy transport with phase timeouts; JSON/console fallback in development; production fails fast without a configured provider |
| WebSocket (`ws`) | Implemented | In-process |
| Upstash REST client | Not Implemented | Package installed, unused |
| SMS provider | Implemented | Generic HTTP webhook (`SMS_WEBHOOK_URL`) |
| Payment gateways (eSewa/Khalti/Stripe) | Not Implemented | Payment method is a label |
| File storage/S3 | Not Implemented | Invoice file is a string |
| Google OAuth | Not Implemented | Schema field only |
| Docker/NGINX/CI deploy | Not present in repository | Claims exist in `SECURITY.md` |

## 2. Email providers

Source: `server/src/shared/provider/email.provider.ts`

Two transports are supported:

- **`smtp`** — Nodemailer over `SMTP_HOST`/`SMTP_PORT`/`SMTP_*`.
- **`brevo`** — Brevo's HTTPS API (`POST https://api.brevo.com/v3/smtp/email`)
  with `BREVO_API_KEY`. This uses port 443 and works on hosts that block
  outbound SMTP ports, such as Render free web services.

`EMAIL_PROVIDER` selects the transport explicitly. When unset, `SMTP_HOST`
wins (backward compatible), then `BREVO_API_KEY`, then the development JSON
transport. Transports are created lazily on the first email, so importing the
provider or the auth container performs no network call.

```ts
// Brevo path (simplified)
await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json" },
  body: JSON.stringify({
    sender: { name, email: process.env.EMAIL_FROM },
    to: [{ email: message.to }],
    subject: message.subject,
    textContent: message.text,
    htmlContent: message.html,
  }),
  signal: AbortSignal.timeout(15_000),
});
```

### Behavior

- No Ethereal account is created and no network call happens at import time.
- If no provider is configured, the JSON transport keeps the message in-process
  and the text (including the verification/reset link) is logged to the server
  console.
- **Production fails fast**: `assertEmailConfig()` runs at boot and throws when
  `NODE_ENV=production` without a configured provider (`SMTP_HOST`, or
  `EMAIL_PROVIDER=brevo` with `BREVO_API_KEY` and `EMAIL_FROM`), so notification
  rows cannot be marked `Sent` against a transport that writes nothing.
- SMTP phases are bounded (10s connect/greeting, 20s socket); the Brevo request
  aborts after 15s.
- Brevo non-2xx responses throw with the HTTP status and a truncated provider
  message. The API key is never included in the error.
- The auth module sends HTML + plain-text verification and password-reset
  emails through `modules/auth/services/auth.mailer.ts`.
- `NotificationService.dispatchToRecipient` sends plain-text email
  notifications through the same provider.
- Notification email failures are retried automatically at +1 minute and
  +5 minutes when transient; permanent provider errors are terminal. The
  provider error is stored on the recipient row.
- Auth emails still have no retry, bounce handling, or delivery tracking.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `EMAIL_PROVIDER` | no | `brevo` or `smtp`; unset auto-detects |
| `BREVO_API_KEY` | with Brevo | Brevo API v3 key |
| `EMAIL_FROM` | with Brevo | Verified sender address |
| `EMAIL_FROM_NAME` | no | Sender display name (default `SPIMS`) |
| `SMTP_HOST` | with SMTP | SMTP host |
| `SMTP_PORT` | no | SMTP port |
| `SMTP_SECURE` | no | `"true"` for TLS |
| `SMTP_USER` | no | SMTP username |
| `SMTP_PASS` | no | SMTP password |
| `SMTP_FROM` | no | From address for the SMTP transport |

All email variables are listed in `.env.example`. Send a one-off check with
`npm run email:test -- you@example.com`.

### Usage

- `AuthMailer` sends verification and password-reset emails.
- `NotificationService.dispatchToRecipient` sends notification emails with `type: "Email"`.

## 3. Redis / Upstash

| Item | Detail |
|---|---|
| Client | `ioredis` |
| URL variable | `UPSTASH_REDIS_REST_URL` |
| Password variable | `UPSTASH_REDIS_REST_TOKEN` (fallback branch only) |
| Package `@upstash/redis` | Installed, never imported |
| Startup check | `redis.ping()` before listening |
| Auth rate limiting | `shared/middleware/rateLimit.middleware.ts` uses `INCR` + `PEXPIRE` and fails open on Redis errors |

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

Source: `server/src/shared/provider/sms.provider.ts`

`Notification.type` includes `SMS`. Delivery uses a generic HTTP webhook:

- `POST SMS_WEBHOOK_URL` with JSON `{ to, message }`.
- `content-type: application/json`; `authorization: Bearer <SMS_API_KEY>` when
  the key is set.
- 5-second timeout via `AbortSignal.timeout`.
- Any 2xx is success. A non-2xx response throws a retryable error containing
  the status and a short body.
- A network or timeout error is retryable.
- Missing `SMS_WEBHOOK_URL` is non-retryable.
- A recipient without `User.phone` is non-retryable and fails with
  `"Recipient has no phone number"`.

Environment variables:

| Variable | Required | Purpose |
|---|---|---|
| `SMS_WEBHOOK_URL` | For SMS | Provider endpoint |
| `SMS_API_KEY` | No | Bearer token sent to the provider |

Status: **Implemented** for the webhook contract above. No vendor-specific SDK
is bundled.

## 8. File uploads

`PurchaseOrder.invoiceFile` is a string. There is no multer, S3, GridFS, or static file route. Clients can only store a URL or filename they already have.

## 9. Google OAuth

`User.provider` can be `google`, and `password` is conditional on `local`. There is no OAuth route, callback, token exchange, or client configuration. Google users cannot authenticate.

## 10. Outbound calls inventory

| Destination | Trigger | Blocking? |
|---|---|---|
| MongoDB | Startup and every request |
| Redis | Startup, cache operations, and auth rate limiting |
| SMTP | Email dispatch only (lazy transport) |
| SMS webhook | SMS dispatch only (`SMS_WEBHOOK_URL`) |
| No other services | — |

No HTTP client is used for business integrations.

## 11. Operational implications

- A deployment must provide MongoDB and Redis. Email is best-effort in
  development but a provider is mandatory in production.
- Real email requires either `SMTP_HOST` (and credentials when the server
  requires auth) or `EMAIL_PROVIDER=brevo` with `BREVO_API_KEY` and
  `EMAIL_FROM`. Production refuses to boot without a configured provider; in
  development verification and reset links are logged to the console.
- On Render free, outbound SMTP ports 25/465/587 are blocked; use the Brevo
  HTTPS transport instead of Gmail/SMTP.
- SMS requires `SMS_WEBHOOK_URL` and a recipient `phone`; otherwise the row fails with a clear, non-retryable error.
- There is no integration health check; `/health` returns OK regardless of dependencies.
- Notification email and SMS failures are retried at +1m/+5m; auth email still has no retry/outbox.
- SMTP connect/greeting (10s) and socket (20s) timeouts keep a hung provider from
  blocking the at-least-once dispatch window.

## 12. Configuration checklist

| Capability | Variables |
|---|---|
| Database | `MONGO_URI` |
| Auth | `JWT_SECRET` |
| Cache | `UPSTASH_REDIS_REST_URL`, optionally `UPSTASH_REDIS_REST_TOKEN` |
| CORS | `ALLOWED_ORIGINS` (JSON array) |
| Port | `PORT` |
| Cookies | `NODE_ENV` |
| Email | `EMAIL_PROVIDER`, `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME` (Brevo), or `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (SMTP) |
| SMS | `SMS_WEBHOOK_URL`, optionally `SMS_API_KEY` |

## Related documents

- [Environment variables](../development/environment-variables.md)
- [Redis and caching](redis-and-caching.md)
- [Notifications](../modules/notifications.md)
- [Setup and installation](../development/setup-and-installation.md)
