# Authentication API

## 1. Summary

| Endpoint | Method | Auth | Handler |
|---|---|---|---|
| `/api/auth/register` | POST | Public | `AuthController.registerUser` |
| `/api/auth/login` | POST | Public | `AuthController.loginUser` |
| `/api/auth/refresh` | POST | Refresh cookie | `AuthController.refreshToken` |
| `/api/auth/logout` | POST | Refresh cookie (optional) | `AuthController.logoutUser` |
| `/api/auth/logout-all` | POST | Access cookie | `AuthController.logoutAllSessions` |
| `/api/auth/verify-email` | POST | Public | `AuthController.verifyEmail` |
| `/api/auth/resend-verification` | POST | Public | `AuthController.resendVerification` |
| `/api/auth/forgot-password` | POST | Public | `AuthController.requestPasswordReset` |
| `/api/auth/reset-password` | POST | Public | `AuthController.resetPassword` |
| `/api/auth/me` | GET | Access cookie | `AuthController.getCurrentUser` |
| `/api/auth/sessions` | GET | Access cookie | `AuthController.listSessions` |
| `/api/auth/sessions/:id` | DELETE | Access cookie | `AuthController.revokeSession` |

Source: `server/src/modules/auth/routes/auth.route.ts`

All routes pass through `verifyOrigin`, which rejects browser requests whose
`Origin` is not in `ALLOWED_ORIGINS`. Requests without an `Origin` header are
allowed for CLI/server-to-server use.

## 2. Cookies

| Cookie | Path | Lifetime | Purpose |
|---|---|---|---|
| `token` | `/` | `JWT_ACCESS_EXPIRES_IN` (default 15m) | Access JWT |
| `refreshToken` | `/api/auth` | `JWT_REFRESH_EXPIRES_IN` (default 7d) | Refresh JWT |

Both cookies are `httpOnly`. In production they are `secure` and
`SameSite=None`; in development they are `SameSite=Strict`.

The refresh cookie is scoped to `/api/auth`, so it is not sent to inventory,
sales, or other API routes.

## 3. Token contract

### Access token

| Claim | Value |
|---|---|
| `userId` | string ObjectId |
| `email` | user email |
| `role` | `owner` \| `pharmacist` \| `inventory_manager` |
| `sessionId` | AuthSession ObjectId |
| `type` | `access` |
| `iat`, `exp` | standard; 15 minutes by default |

### Refresh token

| Claim | Value |
|---|---|
| `userId` | string ObjectId |
| `sessionId` | AuthSession ObjectId |
| `type` | `refresh` |
| `jti` | random UUID |
| `iat`, `exp` | standard; 7 days by default |

Refresh tokens are signed with `JWT_REFRESH_SECRET`. Only a SHA-256 hash is
stored in `AuthSession.refreshTokenHash`. Every refresh rotates the token.
The previous hash is accepted for `REFRESH_TOKEN_GRACE_PERIOD` (default 60s)
so two tabs refreshing at the same moment do not revoke each other.

## 4. `POST /api/auth/register`

### Request

```json
{
  "name": "Asha Sharma",
  "email": "asha@example.com",
  "password": "example-password-123"
}
```

`role` is ignored by the server. Public registration always creates a
`pharmacist`. Unknown body keys are stripped.

### Behavior

1. Reject with `409` if the email already exists.
2. Hash the password with bcrypt (cost 10).
3. Create a local user with `emailVerified: false`.
4. Store a SHA-256 verification-token hash with a 24-hour expiry.
5. Send a verification email linking to
   `${CLIENT_URL}/verify-email?token=...`.
6. Do not sign the user in.

### Response (`201`)

```json
{
  "message": "Account created. Please check your email to verify your address before signing in.",
  "user": {
    "_id": "665f...",
    "name": "Asha Sharma",
    "email": "asha@example.com",
    "role": "pharmacist",
    "isActive": true,
    "emailVerified": false,
    "provider": "local",
    "lastLogin": null,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### Errors

| Status | Code | Condition |
|---|---|---|
| 400 | — | Zod validation failure |
| 409 | — | Email already registered |
| 429 | `RATE_LIMITED` | More than 10 attempts per IP per hour |
| 500 | — | Unhandled error |

## 5. `POST /api/auth/verify-email`

### Request

```json
{ "token": "<64-char hex token from the email>" }
```

### Behavior

1. Hash the token and find a user with a matching unexpired hash.
2. Set `emailVerified: true`.
3. Clear the verification hash and expiry.
4. Return `200`.

The token is single-use.

### Response (`200`)

```json
{ "message": "Email verified successfully. You can now sign in." }
```

### Errors

| Status | Code | Condition |
|---|---|---|
| 400 | `INVALID_VERIFICATION_TOKEN` | Unknown, used, or expired token |
| 429 | `RATE_LIMITED` | Too many attempts |

## 6. `POST /api/auth/resend-verification`

### Request

```json
{ "email": "asha@example.com" }
```

### Behavior

Always returns the same generic message. A new verification email is sent
only when a local, active, unverified account exists. This prevents account
enumeration.

### Response (`200`)

```json
{
  "message": "If an account exists for that email and still needs verification, a new verification link has been sent."
}
```

## 7. `POST /api/auth/login`

### Request

```json
{ "email": "asha@example.com", "password": "example-password-123" }
```

### Behavior

1. `findByEmail` with an explicit `+password` projection.
2. Compare the bcrypt hash.
3. Generic `401` for unknown email, missing password, or wrong password.
4. After a valid password, reject deactivated accounts (`403`) and
   unverified accounts (`403`, `EMAIL_NOT_VERIFIED`).
5. Update `lastLogin`.
6. Create an `AuthSession` with device/browser/OS/IP/location metadata.
7. Sign an access token and a refresh token.
8. Set both cookies and return the public user.

### Response (`200`)

```json
{
  "_id": "665f...",
  "name": "Asha Sharma",
  "email": "asha@example.com",
  "role": "pharmacist",
  "isActive": true,
  "emailVerified": true,
  "provider": "local",
  "lastLogin": "2026-01-01T00:00:00.000Z",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

No token is included in the JSON body; tokens are httpOnly cookies only.

### Errors

| Status | Code | Condition |
|---|---|---|
| 400 | — | Validation failure |
| 401 | — | Invalid email or password |
| 403 | `ACCOUNT_DEACTIVATED` | Valid password, inactive account |
| 403 | `EMAIL_NOT_VERIFIED` | Valid password, unverified account |
| 429 | `RATE_LIMITED` | More than 10 attempts per IP per 15 minutes |

## 8. `POST /api/auth/refresh`

No request body. Reads the `refreshToken` cookie.

### Behavior

1. Verify the refresh JWT and its `type` claim.
2. Load the `AuthSession` by `sessionId`.
3. Reject if revoked, expired, or owned by a different user.
4. Compare the SHA-256 hash of the cookie with the current stored hash and
   the previous hash within the configured grace window.
5. If neither matches, treat it as token reuse/theft and revoke the session.
6. Reject if the user is missing, inactive, or unverified.
7. Rotate both tokens, update `lastUsedAt`, device/IP/location, and expiry.
8. Set both cookies and return the public user.

### Response (`200`)

Same public-user shape as login.

### Errors

| Status | Code | Condition |
|---|---|---|
| 401 | `INVALID_REFRESH_TOKEN` | Missing, expired, revoked, or mismatched token |
| 429 | `RATE_LIMITED` | More than 120 refreshes per IP per 15 minutes |

On failure both cookies are cleared.

## 9. `POST /api/auth/logout`

Reads the refresh cookie, revokes the matching session if the token is
valid, clears both cookies, and returns `200`.

Logout does not require a valid access token, so a client with an expired
access cookie can still clear its httpOnly cookies.

```json
{ "message": "User logged out successfully" }
```

## 10. `POST /api/auth/logout-all`

Requires a valid access cookie. Revokes every active session for the user,
clears both cookies, and returns:

```json
{ "message": "All sessions have been signed out" }
```

## 11. `GET /api/auth/sessions`

Requires a valid access cookie. Returns active sessions sorted by
`lastUsedAt` descending.

```json
[
  {
    "id": "665f...",
    "device": "Chrome on Windows",
    "browser": "Chrome",
    "os": "Windows",
    "ip": "203.0.113.10",
    "location": "Kathmandu, Bagmati, NP",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "lastUsedAt": "2026-01-02T00:00:00.000Z",
    "expiresAt": "2026-01-09T00:00:00.000Z",
    "isCurrent": true
  }
]
```

`location` comes from proxy/hosting headers such as `cf-ipcity`,
`cf-region`, `cf-ipcountry`, `x-vercel-ip-city`, and
`x-vercel-ip-country-region`. Without those headers it is `"Unknown"`.

## 12. `DELETE /api/auth/sessions/:id`

Requires a valid access cookie. The session must belong to the current user.
Revoking the current session also clears both cookies.

```json
{ "message": "Session revoked successfully", "sessionId": "665f..." }
```

## 13. `GET /api/auth/me`

Requires a valid access cookie. Returns the public user shape. The password
hash, refresh hashes, verification hashes, and reset hashes are never
returned.

## 14. `POST /api/auth/forgot-password`

### Request

```json
{ "email": "asha@example.com" }
```

### Behavior

Always returns the same message. If a local, active account exists, a
single-use token is stored as a SHA-256 hash with a 30-minute expiry and a
link is emailed to `${CLIENT_URL}/reset-password?token=...`.

The `emailVerificationTokenHash` / `passwordResetTokenHash` fields are
select-false and are never serialized.

### Response (`200`)

```json
{
  "message": "If an account exists for that email, a password reset link has been sent."
}
```

### Errors

| Status | Code | Condition |
|---|---|---|
| 400 | — | Invalid email |
| 429 | `RATE_LIMITED` | More than 5 requests per IP per hour |

## 15. `POST /api/auth/reset-password`

### Request

```json
{
  "token": "<64-char hex token from the email>",
  "password": "new-password-123"
}
```

### Behavior

1. Hash the token and find a matching unexpired user.
2. Reject inactive accounts or invalid/expired tokens.
3. Hash the new password with bcrypt.
4. Set `emailVerified: true`.
5. Clear reset and verification fields.
6. Revoke every refresh session for the user.
7. Clear the access and refresh cookies.

### Response (`200`)

```json
{
  "message": "Password reset successfully. Please sign in with your new password."
}
```

### Errors

| Status | Code | Condition |
|---|---|---|
| 400 | — | Validation failure |
| 400 | `INVALID_RESET_TOKEN` | Unknown, used, or expired token |
| 429 | `RATE_LIMITED` | More than 10 attempts per IP per hour |

## 16. Rate-limit policy

| Endpoint | Window | Max per IP |
|---|---|---|
| Register | 1 hour | 10 |
| Login (per IP + email) | 15 minutes | 10 |
| Login (per IP, all accounts) | 15 minutes | 50 |
| Refresh | 15 minutes | 120 |
| Forgot password | 1 hour | 5 |
| Reset password | 1 hour | 10 |
| Verify email | 1 hour | 20 |
| Resend verification | 1 hour | 5 |

Rate limiting uses Redis `INCR` + `PEXPIRE`. If Redis is unavailable, the
limiter logs the error and fails open so authentication remains available.
Rate limits are keyed by the Express `req.ip`, plus the submitted email for
login attempts. Set `TRUST_PROXY` when running behind a real proxy so
`req.ip` reflects the client rather than the proxy; leave it unset when the
app is directly exposed. Shared NAT addresses still share the per-IP login
bucket.

## 17. Client requirements

- Send `credentials: "include"` (Axios `withCredentials: true`).
- On `401`, call `POST /api/auth/refresh` once, then retry the original
  request. The SPIMS client implements a single-flight refresh interceptor.
- Do not retry the refresh endpoint itself.
- After a failed refresh, clear local auth state and redirect to `/login`.
- Never store access or refresh tokens in `localStorage`.
- The frontend must be listed in `ALLOWED_ORIGINS`, and `CLIENT_URL` must
  point at the frontend origin used in email links.

## 18. Limitations

- Registration returns `409` for an existing email, so the public register
  endpoint can still be used to check whether an account exists.
- Access tokens already issued remain valid until expiry (15 minutes by
  default) after logout or password reset.
- Device location is only as accurate as the proxy/hosting headers. There is
  no Geo-IP database.
- Rate limiting is fixed-window. Login is limited per IP+email and per IP;
  the other endpoints are per IP. It is not a persistent account lockout.
- Refresh sessions are capped at `MAX_SESSIONS_PER_USER` (default 10); the
  oldest sessions are revoked after a new login.
- Refresh-token rotation has a 60-second previous-token grace window to
  absorb concurrent tabs. The frontend also uses a single-flight refresh
  interceptor. Three or more truly simultaneous refreshes can still race, and
  a stolen token that was just rotated can be accepted during that window.

## Related documents

- [Authentication module](../modules/authentication.md)
- [Users and roles](../modules/users-and-roles.md)
- [Environment variables](../development/environment-variables.md)
- [Error handling](error-handling.md)
