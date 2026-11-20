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

Mounted at `/api/users` with roles **`owner` and `pharmacist` only**. `inventory_manager` cannot access user administration.

| Method | Path | Notes |
|---|---|---|
| POST | `/` | Create user |
| GET | `/` | List all |
| GET | `/:id` | Get by id |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Requires `role` in body |
| GET | `/role/:role` | Filter by role |
| GET | `/status/:isActive/last-login/:date` | Reads `?isActive=` instead of path param |
| GET | `/role/:role/last-login/:date` | Filter |
| GET | `/role/:role/status/:isActive` | Reads `?isActive=` instead of path param |
| GET | `/active` | **Shadowed** by `/:id` |
| GET | `/:id/inactive` | Returns all inactive users, ignores `:id` |
| GET | `/last-login/:date` | Filter |
| GET | `/status/:isActive/last-login/:date` | Duplicate registration, unreachable |
| PATCH | `/:id/toggleUserActivation` | Toggle |

Full contracts: [endpoints.md](../api/endpoints.md#users).

## 5. Controllers

`UserController` returns raw user documents or arrays for most operations. It checks for `null` results and returns `404` directly. Errors go through `next(error)`.

`deleteUser` reads `req.body.role` and passes it to the service.

## 6. Services

`UserService` (`modules/user/service/user.service.ts`):

| Method | Behavior |
|---|---|
| `createUser` | Role allow-list check → email uniqueness → bcrypt hash → create verified user |
| `updateUser` | Validates role → bcrypt-hashes a supplied password → update |
| `deleteUser` | Requires the supplied role to equal `owner` |
| `getAllUsers` / `getByRole` / `getActive` / `getInactive` | Read-only |
| `getUsersByStatusAndLastLogin` / `getByRoleAndLastLogin` / `getByLastLogin` | Read-only |
| `toggleUserActivation` | Flips `isActive` |

## 7. Model

`User` (`modules/user/model/user.model.ts`): `name`, `email` (unique), `password` (conditional on provider, `select: false`), `provider`, `role`, optional `phone`, `notificationPreferences` (`{ email, sms }`, both default `true`), `isActive`, `emailVerified`, `lastLogin`, timestamps, plus select-false email-verification and password-reset token hashes. The legacy `refreshToken` / `refreshTokenExpiresAt` fields remain but the refresh flow now uses the `authsessions` collection.

`phone` is the optional SMS destination. `notificationPreferences` is written by
the notification preference routes through dedicated repository methods; it is
not part of the generic user update contract.

`lastLogin` is written by successful logins. Public user responses are sanitized by `modules/user/utils/publicUser.ts`, so password and token hashes are never returned.

## 8. Validation

`modules/user/schema/user.schema.ts` defines `createUserSchema` and `updateUserSchema`, but **neither is wired to a route**. Consequences:

- `POST /users` accepts arbitrary fields; the Mongoose schema filters unknown paths.
- `PUT /users/:id` accepts arbitrary fields. A supplied `password` is bcrypt-hashed by the service.
- `role` values are checked in both `createUser` and `updateUser`; invalid values return `400`.
- `updateUserSchema` now accepts an optional `phone` (7–20 characters) but the
  route does not run it; the Mongoose schema trims and stores the value.
- Email changes do not reset `emailVerified`.

## 9. Middleware

| Middleware | Applies to |
|---|---|
| `verifyToken` | Whole `/users` mount |
| `authorize(["owner","pharmacist"])` | Whole `/users` mount |

There is no per-action ownership check and no self-service endpoint.

## 10. Effective role matrix

The API claims RBAC, but only two real restrictions exist.

| Capability | owner | pharmacist | inventory_manager |
|---|---|---|---|
| Register/login/logout/me | yes | yes | yes |
| User administration | yes | yes | **no** (403 at mount) |
| Delete user | yes (with `role: "owner"` in body) | yes, **if body says `owner`** | no |
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

The only meaningful distinctions are: user administration is closed to inventory managers, and reorder generation/deletion has extra checks.

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

1. Owner/pharmacist sends `POST /users`.
2. Service validates role and email.
3. Password is hashed.
4. User is stored and returned.

### Deactivate instead of delete

1. `PATCH /users/:id/toggleUserActivation`.
2. `isActive` flips.
3. The user can still log in (see limitations).

### Delete

1. `DELETE /users/:id` with body `{ "role": "owner" }`.
2. Service compares the **body** role to `owner`.
3. Hard delete.

## 14. Limitations and risks

| Issue | Status |
|---|---|
| Invalid role accepted on update | Fixed: service returns `400` |
| Password update stored in plaintext | Implemented behavior — security defect |
| Delete authorization uses request body | Implemented behavior — security defect |
| `GET /users/active` unreachable | Implemented behavior |
| Duplicate status route unreachable | Implemented behavior |
| `isActive` ignored at login | Implemented behavior |
| `lastLogin` never updated | Not Implemented |
| Admin password reset | Not Implemented |
| Pagination/search | Not Implemented |
| Audit trail for user changes | Not Implemented |

## Related documents

- [Authentication module](authentication.md)
- [API authentication](../api/authentication.md)
- [Project status](../project-status.md)
