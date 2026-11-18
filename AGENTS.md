# AGENTS.md — instructions for AI coding agents

This repository is **SPIMS**, a MERN pharmacy inventory system with two
independently installed packages:

- `server/` — Express 5 + TypeScript + Mongoose + Redis, layered modules
  (`controller` → `service` → `repo` → `model`).
- `client/` — React 19 + Vite + TypeScript, feature folders under `src/features`.

Read this file, `README.md`, and the relevant `server/docs/` documents before
changing code. Do not assume commands run from the root; use the scripts below.

## Quality gates (authoritative commands)

Run from the repository root:

| Command | What it does |
|---|---|
| `npm run install:all` | `npm ci` in `server/` and `client/` |
| `npm run lint` | ESLint for server and client |
| `npm run lint:fix` | ESLint with autofix (does not auto-run in CI) |
| `npm run typecheck` | `tsc --noEmit` (server) and `tsc -b` (client) |
| `npm test` | Vitest single run (server) |
| `npm run test:watch` | Vitest watch mode (server) |
| `npm run test:coverage` | Vitest with V8 coverage (server) |
| `npm run build` | `tsc` (server) and `tsc -b && vite build` (client) |
| `npm run audit` | Production dependency audit, high+ |
| `npm run check` | lint → typecheck → test → build |
| `npm run check:ci` | `check` plus the production dependency audit |

Package-level equivalents:

```bash
npm --prefix server run lint
npm --prefix client run lint
npm --prefix server run typecheck
npm --prefix client run typecheck
npm --prefix server run test:ci
npm --prefix server run build
npm --prefix client run build
```

The repository uses **npm**, not pnpm. Do not introduce a workspace or a second
package manager without an explicit request.

## Non-negotiable rules

1. Read project instructions and the relevant architecture docs before editing.
2. Match existing architecture, naming, layering, and import conventions.
3. Add or update tests for behaviour you change, especially inventory, FEFO,
   sales, returns, VAT, purchases, and authorization.
4. Run the relevant tests after implementation.
5. Run lint.
6. Run type checking.
7. Run the production build.
8. Run the security audit when dependencies or configuration change.
9. Fix errors introduced by your changes. Do not leave a red gate for the next
   agent.
10. Never disable, skip, or weaken tests, lint rules, TypeScript settings,
    audits, or security checks to make a pipeline pass.
11. Never claim a check passed unless you actually ran it. Report skipped,
    unavailable, or environment-blocked checks explicitly.
12. Never modify CI configuration to hide an application failure. Fix the
    application or report the failure.

Additional constraints:

- Do not change business logic only to satisfy a test.
- Do not use `any`, `@ts-ignore`, or broad exclusions to hide type errors. The
  existing `no-explicit-any` rule is a warning for legacy code; new code should
  not add `any`.
- Do not commit `.env` files, build output, coverage, or secrets.
- Do not reformat unrelated files.
- Do not commit or push unless explicitly asked.

## Test conventions

- Framework: Vitest 4, tests next to the code as `*.test.ts`.
- Use real `AppError` and assert `statusCode`.
- Inject fake repositories into services; never connect to production MongoDB or
  Redis in unit tests.
- Transactional services receive a fake connection whose `startSession()` and
  `withTransaction()` execute the callback.
- Always `await` rejection assertions.
- Keep tests deterministic (fixed dates, no live network, no shared state).
- A test that cannot fail is not a test. Assert observable behaviour.

See `docs/testing.md` for current coverage and integration-testing limitations.

## Where to look

| Topic | Path |
|---|---|
| Backend entrypoint | `server/src/server.ts` |
| Dependency wiring | `server/src/app/container.ts` |
| Routes | `server/src/modules/app.routes.ts` |
| FEFO allocation | `server/src/modules/inventory/services/inventory.service.ts` |
| Batch query/deduction | `server/src/modules/batch/repo/medicineBatch.repo.ts` |
| Sales/VAT | `server/src/modules/sales/services/sales.service.ts` |
| Returns/refunds | `server/src/modules/sales/services/return.service.ts` |
| Reorder math | `server/src/modules/smartReorder/utils/smartReorder.Calculatro.ts` |
| Authorization | `server/src/shared/middleware/authorize.ts` |
| CI/CD | `docs/ci-cd.md` |
| Security policy | `docs/security.md` |

## Git and GitHub workflow

Every AI agent must follow these rules. The full workflow is in
[`docs/development/git-workflow.md`](docs/development/git-workflow.md) and
[`CONTRIBUTING.md`](CONTRIBUTING.md).

1. Read repository instructions before modifying code.
2. Inspect Git status before starting work (`git status`, `git branch -vv`).
3. Never overwrite unrelated user changes.
4. Never use destructive Git commands (`reset --hard`, `clean -fd`,
   `checkout --`, history rewrites) without explicit authorization.
5. Follow Conventional Commits: `<type>(<scope>): <description>`. Supported
   types are `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`,
   `security`, `perf`, and `build`.
6. Use meaningful branch names: `feature/`, `fix/`, `refactor/`, `docs/`,
   `test/`, `ci/`, `security/`, or `chore/` followed by a short hyphenated
   name. Never commit directly to `main`.
7. Run relevant tests and quality checks before committing.
8. Review the staged diff (`git diff --cached`) before creating commits.
9. Never stage unrelated files. Stage explicit paths, not `git add .`.
10. Never commit secrets, credentials, `.env` files, build output, coverage, or
    generated artifacts that should not be tracked.
11. Create descriptive pull requests using
    `.github/PULL_REQUEST_TEMPLATE.md`, with a title in Conventional Commit
    form.
12. Include actual verification results in the PR. Do not check a box for a
    command you did not run.
13. Never bypass CI or branch protection. Do not merge with failing required
    checks.
14. Never force-push shared branches. Do not rewrite published history.
15. Never merge a PR with failing required checks.
16. Do not claim that a commit, push, PR, or merge succeeded unless GitHub
    confirms the operation.

If the user asks for a commit, push, PR, or merge, confirm the target branch
and remote first. If the changes are on `main`, create a feature branch before
committing. If a push or merge fails, report the exact error instead of
retrying destructively.

## Before completing any task

- [ ] Reviewed relevant project instructions (`AGENTS.md`, `README.md`, docs).
- [ ] Reviewed the existing implementation and conventions.
- [ ] Implemented the requested changes.
- [ ] Added or updated relevant tests.
- [ ] Ran lint (`npm run lint`).
- [ ] Ran typecheck (`npm run typecheck`).
- [ ] Ran tests (`npm test`).
- [ ] Ran build (`npm run build`).
- [ ] Reviewed security implications (`npm run audit` when relevant).
- [ ] Reported all validation results, including anything not run.

## Reporting results

State each command you ran and its result. Example:

```text
npm run lint       PASS (0 errors, existing warnings only)
npm run typecheck  PASS
npm test           PASS (9 files, 82 tests)
npm run build      PASS
npm run audit      PASS (0 production vulnerabilities)
```

If a command could not run, say why (missing service, missing binary,
unsupported platform) and what the user must run locally. Do not substitute
"I verified it" for an actual command result.
