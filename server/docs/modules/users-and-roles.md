# Users and Roles

## 1. Purpose

Manage staff accounts and enforce the role checks used across the API.

## 2. Responsibilities

- CRUD users (create, read, update, delete).
- Hash passwords on creation.
- Toggle activation.
- Query by role, status, and last-login date.

Authorization itself is implemented in `shared/middleware/authorize.ts`, not in this module.

## 3. Structure

```text
modules/user/
├── controller/user.controller.ts
├── model/user.model.ts
├── repo/user.repo.ts
├── routes/user.route.ts
├── schema/user.schema.ts
├── service/user.service.ts
└── types/user.dto.ts
```

## 4. Routes

Mounted at `/api/users` with roles **`owner` and `pharmacist` only**. Every write route additionally requires `owner`. `inventory_manager` cannot access user administration.

| Method | Path | Notes |
|---|---|---|
| POST | `/` | Create user; owner only |
| GET | `/` | List all |
| GET | `/:id` | Get by id; ObjectId validated |
| PUT | `/:id` | Update; owner only |
| DELETE | `/:id` | Owner only; JWT role is authoritative; body must be empty |
| GET | `/role/:role` | Filter by role |
| GET | `/status/:isActive/last-login/:date` | Reads `:isActive` path param |
| GET | `/role/:role/last-login/:date` | Filter |
| GET | `/role/:role/status/:isActive` | Reads `:isActive` path param |
| GET | `/active` | Registered before `/:id` |
| GET | `/inactive` | All inactive users |
| GET | `/last-login/:date` | Filter |
| PATCH | `/:id/toggleUserActivation` | Toggle; owner only |
| PATCH | `/:id/role` | Change role; owner only |
| POST | `/:id/reset-password` | Send a one-time reset link; owner only; revokes sessions |
| POST | `/:id/force-logout` | Revoke all sessions and access tokens; owner only |

Full contracts: [endpoints.md](../api/endpoints.md#users).

## 5. Controllers

`UserController` returns public user documents or arrays for most operations. It checks for `null` results and returns `404` directly. Errors go through `next(error)`.

`deleteUser` derives the actor role from `req.user.role`; a client-supplied body role is rejected by `deleteUserBodySchema`.

## 6. Services

`UserService` (`modules/user/service/user.service.ts`):

| Method | Behavior |
|---|---|
| `createUser` | Owner check → role allow-list check → email uniqueness → bcrypt hash → create verified user |
| `updateUser` | Owner check → validates role → bcrypt-hashes a supplied password → update |
| `deleteUser` | Owner check from the authenticated role |
| `changeRole` | Owner check → confirms the user exists → updates the role |
| `getAllUsers` / `getByRole` / `getActive` / `getInactive` | Read-only |
| `getUsersByStatusAndLastLogin` / `getByRoleAndLastLogin` / `getByLastLogin` | Read-only |
| `toggleUserActivation` | Owner check → flips `isActive` |

## 7. Model

`User` (`modules/user/model/user.model.ts`): `name`, `email` (unique), `password` (conditional on provider, `select: false`), `provider`, `role`, optional `phone`, `notificationPreferences` (`{ email, sms }`, both default `true`), `isActive`, `emailVerified`, `lastLogin`, `tokenVersion` (included as `ver` in access tokens, default `0`), timestamps, plus select-false email-verification and password-reset token hashes. The legacy `refreshToken` / `refreshTokenExpiresAt` fields remain but the refresh flow now uses the `authsessions` collection.

`phone` is the optional SMS destination. `notificationPreferences` is written by
the notification preference routes through dedicated repository methods; it is
not part of the generic user update contract.

`lastLogin` is written by successful logins. Public user responses are sanitized by `modules/user/utils/publicUser.ts`, so password and token hashes are never returned.

## 8. Validation

`modules/user/schema/user.schema.ts` defines the runtime schemas wired to the routes:

- `createUserSchema` and `updateUserSchema` validate names, email, password length, roles, phone format, and `isActive`.
- `deleteUserBodySchema` is strict and accepts only an empty body.
- ObjectId, role, status, and date params are validated before controllers.
- Invalid values return `400` with the standard `{ success: false, errors }` shape; non-owner writes return `403`.
- Email changes do not reset `emailVerified`.

## 9. Middleware

| Middleware | Applies to |
|---|---|
| `verifyToken` | Whole `/users` mount |
| `authorize(["owner","pharmacist"])` | Whole `/users` mount |

There is no per-action ownership check and no self-service endpoint.

## 10. Effective role matrix

The API still has broad module-level roles. User management is the main owner-only area.

| Capability | owner | pharmacist | inventory_manager |
|---|---|---|---|
| Register/login/logout/me | yes | yes | yes |
| View users | yes | yes | **no** (403 at mount) |
| Create/update/delete/role-change users | yes | **no** (403) | no |
| Toggle user activation | yes | **no** (403) | no |
| Medicine/catalog CRUD | yes | yes | yes |
| Supplier CRUD | yes | yes | yes |
| Purchase create/approve/receive/delete | yes | yes | yes |
| Inventory adjust/reserve/release/sync | yes | yes | yes |
| Sales create/delete | yes | yes | yes |
| Returns create | yes | yes | yes |
| Batch create/adjust/dispose | yes | yes | yes |
| Smart reorder generate | yes | **no** (403) | yes |
| Smart reorder delete | yes | no | no |
| Dashboard/notifications | yes | yes | yes |

The only meaningful distinctions are: user writes are owner-only, and reorder generation/deletion has extra checks.

## 11. Business rules

1. Email uniqueness is enforced by the database.
2. Passwords are bcrypt-hashed (cost 10) on create, update, register, and reset.
3. Role defaults to `pharmacist`; public registration always creates a pharmacist.
4. Deletion is a hard delete, not a deactivation; `toggleUserActivation` is the soft option.
5. Deleting a user does not check for references (sales, movements, returns, notifications).
6. `isActive: false` blocks login and refresh. Existing access tokens remain valid until expiry.
7. Users created from the admin dashboard are marked `emailVerified: true`; public registrations start unverified.

## 12. Dependencies

- `UserRepository`
- `bcrypt`
- `AppError`
- Auth middleware for protection

## 13. Workflows

### Create staff account

1. Owner sends `POST /users`; pharmacists receive `403`.
2. Zod validates the role, email, and password; the service repeats the role check.
3. Password is hashed.
4. User is stored and returned.

### Deactivate instead of delete

1. Owner sends `PATCH /users/:id/toggleUserActivation`.
2. `isActive` flips.
3. Login and refresh reject the deactivated account.

### Delete

1. Owner sends `DELETE /users/:id` with no body.
2. Service authorizes from the JWT role, not client data.
3. A client-supplied `{ "role": "owner" }` body is rejected by validation.
4. Hard delete.

## 14. Limitations and risks

| Issue | Status | Phase |
|---|---|---|
| Pharmacist can create an `owner` or promote any user (including themselves) | Already fixed (owner-only writes plus service checks) | — |
| Invalid role accepted on update | Already fixed | — |
| Password update stored in plaintext | Already fixed (bcrypt) | — |
| Delete authorization uses request body | Already fixed (JWT role; body role rejected) | — |
| `GET /users/active` shadowed by `GET /users/:id` | Already fixed (route order) | — |
| `GET /users/:id/inactive` ignores `:id` | Already fixed (replaced by `GET /users/inactive`) | — |
| Duplicate status route unreachable | Already fixed (single route) | — |
| `isActive` ignored at login | Already fixed | — |
| `lastLogin` never updated | Already fixed | — |
| Admin password reset | Implemented: owner-only one-time email link; sessions revoked; token version bumped | — |
| Force logout | Implemented: owner-only revoke of all sessions and access tokens | — |
| Pagination/search | Fixed: cursor pagination with role/status/search | — |
| Audit trail for user changes | Implemented: create/update/delete/role/toggle/reset/force-logout written to `AuditLog`; owner-only `GET /api/audit` | — |
| Token invalidation on role/password/activation change | Implemented via `User.tokenVersion` and session revocation | — |

## Related documents

- [Authentication module](authentication.md)
- [API authentication](../api/authentication.md)
- [Project status](../project-status.md)
