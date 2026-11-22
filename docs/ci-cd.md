# CI/CD

SPIMS uses GitHub Actions with npm and two independently installed packages:
`server/` and `client/`. There is no workspace lockfile at the repository root;
each package keeps its own `package-lock.json`.

## Workflow files

| Workflow | File | Purpose |
|---|---|---|
| CI | `.github/workflows/ci.yml` | Lint, type check, tests, build |
| Security | `.github/workflows/security.yml` | Production dependency audit, secret scan |
| CodeQL | `.github/workflows/codeql.yml` | Static security analysis |
| Dependabot | `.github/dependabot.yml` | Grouped dependency update PRs |

## Triggers

All workflows run on:

- Push to `main`.
- Pull requests targeting `main`.
- Manual `workflow_dispatch`.

Security and CodeQL also run on a weekly schedule (Monday, 03:00/04:00 UTC).
Feature branches do not trigger duplicate push runs; they are validated by the
pull request targeting `main`.

## Pipeline jobs

### CI

| Job | Steps | Working directory |
|---|---|---|
| Backend | checkout, Node 22 + npm cache, `npm ci`, lint, typecheck, test with coverage, HTTP integration tests, upload coverage artifact, build | `server` |
| Frontend | checkout, Node 22 + npm cache, `npm ci`, lint, typecheck, test, build | `client` |

Both jobs use a 15-minute timeout, a frozen lockfile install (`npm ci`), and
read-only repository permissions. Concurrency cancellation stops superseded
runs on the same ref.

Unit tests do not require MongoDB or Redis; they use fake repositories and a
fake transaction session. The Phase 5 integration suite uses
`mongodb-memory-server` and a fake in-memory Redis, so no CI service containers
are required. Run it with `npm run test:integration` (or
`npm --prefix server run test:integration`).

### Security

| Job | What it does |
|---|---|
| `dependency-audit` (matrix: server, client) | Installs with `--ignore-scripts`, runs a blocking production audit at `high`, then an informational full audit |
| `secret-scan` | Runs Gitleaks over full history |

### CodeQL

CodeQL analyzes `javascript-typescript` on push, pull request, and a weekly
schedule, and uploads results to GitHub code scanning.

## Required checks

Configure branch protection for `main` to require:

- `Backend (lint, typecheck, test, build)`
- `Frontend (lint, typecheck, test, build)`
- `Dependency audit (server)`
- `Dependency audit (client)`
- `Secret scan (Gitleaks)`
- `Analyze JavaScript / TypeScript`

CodeQL may take a few minutes on the first run. Require it only after the
repository has completed one successful analysis.

## Local CI-equivalent validation

Run from the repository root:

```bash
npm run install:all   # first checkout only (or after lockfile changes)
npm run check         # lint -> typecheck -> unit+integration -> build
npm run check:ci      # check + production dependency audit
```

Individual commands:

```bash
npm run lint
npm run lint:fix
npm run typecheck
npm test
npm run test:watch
npm run test:coverage
npm run build
npm run audit
```

Package-level commands:

```bash
npm --prefix server run <script>
npm --prefix client run <script>
```

## Interpreting failures

1. Open the failed job and the first failing step.
2. Reproduce the step locally with the same working directory and command.
3. Read the tool output:
   - ESLint prints file, line, rule, and message.
   - TypeScript prints file, line, error code, and the expected/actual types.
   - Vitest prints the failing assertion, expected and received values, and the
     source line.
   - `npm audit` prints the advisory, severity, dependency path, and whether a
     fix is available.
   - Gitleaks prints the rule and file location; secret values are redacted.
4. Fix the application or test code. Do not silence the check.

Common causes:

| Failure | Likely cause |
|---|---|
| `npm ci` fails | `package.json` and `package-lock.json` are out of sync |
| Lint fails | Unused import/variable, `let` that should be `const`, React hook rules |
| Type check fails | Real type error, or a dependency type changed |
| Tests fail | Behaviour change or non-deterministic test data |
| Audit fails | A production dependency has a high/critical advisory |
| Gitleaks fails | A credential or token is present in the commit history |
| CodeQL fails | Analysis or SARIF upload problem, or a security finding |

## Rerunning

- Re-run from the GitHub Actions UI with **Re-run all jobs** or **Re-run failed
  jobs**.
- Push a new commit to rerun automatically.
- Use **Run workflow** for a manual dispatch.

## Notes

- Third-party actions are pinned to full commit SHAs with a version comment.
- Workflows use `permissions: contents: read` unless a job needs more
  (CodeQL needs `security-events: write`).
- Pull requests from forks receive a read-only token and no repository secrets.
- No workflow prints environment variables or secrets.
- Generated output (`dist/`, `coverage/`) is never committed.
