# Setup and Installation

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 22 | CI uses Node 22; the code uses ESM and top-level await |
| npm | `package-lock.json` is present |
| MongoDB | A replica set is required for the transactional flows (sales, returns, receiving, notifications) |
| Redis | Required at startup (`redis.ping()` before listen) |
| Git | To clone the repository |

Optional:

- An SMTP account for real email. Without it, Nodemailer's Ethereal test account is used.
- A MongoDB GUI for inspection (no admin UI is included).

## 2. Install

```bash
git clone https://github.com/aabhushanCD/spims.git
cd SPMS/server
npm install
```

Do not use `npm ci --omit=dev` for a runnable server: `bcrypt` is listed in `devDependencies`, so auth breaks if dev dependencies are omitted.

## 3. Configure environment

```bash
cp .env.example .env
```

Fill in at least:

```env
MONGO_URI=mongodb://127.0.0.1:27017/spims
JWT_SECRET=<long random string>
PORT=3000
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:5174"]
UPSTASH_REDIS_REST_URL=redis://127.0.0.1:6379
```

See [Environment variables](environment-variables.md) for all variables and caveats.

Notes:

- `.env.example` does not include `NODE_ENV`, the Redis token, or SMTP variables.
- `UPSTASH_REDIS_REST_URL` is passed directly to `ioredis`; for local Redis use a `redis://` URL, not an `https://` REST URL.

## 4. Start MongoDB and Redis

Local examples (any installation method works):

```bash
# MongoDB with a replica set (required for transactions)
mongod --dbpath ./data --replSet rs0
mongosh --eval "rs.initiate()"

# Redis
redis-server
```

If MongoDB runs as a standalone, the transactional endpoints fail at runtime.

## 5. Run the server

Development (watch mode):

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Defaults:

| Item | Value |
|---|---|
| API | `http://localhost:3000/api` |
| Health | `http://localhost:3000/health` |
| WebSocket | `ws://localhost:3000/ws` |
| Build output | `dist/` |
| Entry after build | `dist/server.js` |

The root README says port 8000; the code defaults to 3000 unless `PORT` is set.

## 6. First use

1. `GET /health` → `Server is healthy`.
2. `POST /api/auth/register` to create the first user. The public register endpoint accepts `role`, so create the initial owner explicitly:

```json
{
  "name": "Owner",
  "email": "owner@example.com",
  "password": "change-me-123",
  "role": "owner"
}
```

3. `POST /api/auth/login` and keep the `token` cookie.
4. Create catalog data (category, brand, generic name, unit), then a medicine.
5. Create a supplier.
6. Create a purchase order, approve it, and receive it with batch data.
7. Create a sale.

There are no seed scripts, fixtures, or default users.

## 7. Database initialization

There are no migrations or seeders. Mongoose creates collections and indexes on first use (default `autoIndex`). To start clean, drop the database and restart.

## 8. Common issues

| Symptom | Cause | Fix |
|---|---|---|
| Server exits immediately | Redis `ping` failed | Start Redis; check the URL scheme |
| `Invalid URL` from ioredis | `https://` Upstash REST URL passed to ioredis | Use a `redis://`/`rediss://` TCP URL |
| Transactions fail | MongoDB standalone | Run a replica set |
| `Cannot find module 'bcrypt'` in production | bcrypt is a devDependency | Install full dependencies |
| Login fails after registration | Cookie not stored/sent, origin not allowed, or wrong password | Check `Set-Cookie`, client `credentials`, `ALLOWED_ORIGINS`, and the password |
| CORS blocked | Origin not in `ALLOWED_ORIGINS` | Add the exact origin (scheme + host + port) |
| No email delivered | Ethereal fallback | Configure all `SMTP_*` variables |
| Slow/hanging startup offline | Ethereal account creation at import | Ensure network access or preconfigure SMTP |
| Dashboard values stale | 60-second cache | Wait or restart Redis |
| Batch create fails validation | `isActive` validator conflict | Confirmed defect; positive-quantity batches cannot be saved | See [Batches](../modules/batches.md) |
| Port already in use | Another process on `PORT` | Change `PORT` |

## 9. Verification checklist

```bash
npm run build        # TypeScript compilation
npm run test:run     # Vitest (one suite)
```

Manual smoke tests:

1. Register + login, verify `Set-Cookie`.
2. `GET /api/auth/me` with the cookie.
3. Create catalog + supplier + purchase order.
4. Approve and receive; verify batch and inventory records.
5. Create a sale; verify batch deduction, movement rows, and VAT totals.
6. Create a return; expect the GOOD path to fail if the enum mismatch is confirmed.
7. `GET /api/dashboard`.
8. Open `/ws` with the cookie and trigger an InApp notification.

## 10. Deployment notes

- Run a single instance unless cron duplication is acceptable.
- Provide MongoDB (replica set) and Redis.
- Terminate TLS in front of the app; production cookies require HTTPS.
- Set `NODE_ENV=production` to enable `secure` cookies and `SameSite=None`.
- There is no Dockerfile, compose file, or process manager configuration in the repository.

## Related documents

- [Environment variables](environment-variables.md)
- [Development workflow](development-workflow.md)
- [Testing](testing.md)
- [Project status](../project-status.md)
