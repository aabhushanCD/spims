# Security

## Scanners

| Control | Tool | Where | Blocking |
|---|---|---|---|
| Production dependency advisories | `npm audit --omit=dev --audit-level=high` | `security.yml`, both packages | Yes |
| Full dependency advisories (including dev tools) | `npm audit --audit-level=high` | `security.yml` | No (informational) |
| Secret scanning | Gitleaks | `security.yml` | Yes |
| Static analysis | GitHub CodeQL (`javascript-typescript`) | `codeql.yml` | Code scanning alerts |
| Dependency updates | Dependabot | `.github/dependabot.yml` | Creates PRs |

No additional scanners are configured. Adding another tool requires a clear
gap that these do not cover.

## Severity policy

- **Critical / High** in a production dependency: CI fails. Fix, upgrade, or
  remove the dependency before merging.
- **Moderate / Low** in a production dependency: tracked, not blocking. Address
  during normal dependency maintenance.
- **Critical / High** in a development-only dependency: reported by the
  informational full audit, tracked by Dependabot, and not blocking unrelated
  application work.
- **CodeQL findings**: triage before merge. Fix real issues; dismiss false
  positives with a written reason in GitHub.
- **Secret findings**: always blocking. Treat any committed credential as
  compromised and rotate it, even if the commit is removed.

The production audit is deliberately scoped to shipped dependencies. It is not
a disabled check; it is the gate for code that reaches production.

## Current status

At the time of this change, both packages report **0 vulnerabilities** for
production dependencies. The full audits still report high-severity advisories
in development tooling (Vite/ESLint transitive packages such as `picomatch` and
`tinyglobby`). Those are tracked as informational and updated through
Dependabot.

## Secret scanning

- Gitleaks runs on every push, pull request, manual dispatch, and weekly.
- It checks full Git history, not only the working tree.
- Findings are reported without printing the secret value.
- `.env` files are ignored by Git; `.env.example` contains names only.
- Use `.env` locally. Never add real credentials to examples, tests, docs, or
  workflow files.
- If Gitleaks fails, rotate the credential, remove it from history, and add a
  narrowly scoped allowlist entry only for a verified false positive.

The Gitleaks GitHub Action requires `GITLEAKS_LICENSE` only for
organization-owned repositories. Add it as a repository secret if needed.
Fork pull requests do not receive repository secrets.

## Dependency updates

Dependabot opens grouped weekly PRs for:

- `server` production and development dependencies (minor/patch).
- `client` production and development dependencies (minor/patch).
- GitHub Actions.

Major upgrades are left for manual review because they can change runtime or
tooling behaviour. Every Dependabot PR must pass the full CI and Security
workflows before merge.

## Handling a security failure

1. Identify the advisory and dependency path from `npm audit` or the GitHub
   alert.
2. Prefer a patched version. Use `npm audit fix` for non-breaking updates.
3. If a fix needs a major upgrade, read the migration notes, update the code,
   and run `npm run check`.
4. If no fix exists, document the exposure and compensating control in the PR,
   and open a tracking issue. Do not add a permanent audit bypass.
5. For secrets: rotate first, then clean history, then verify Gitleaks passes.
6. For CodeQL: fix the data flow or dismiss with a documented justification.

## Local checks

```bash
npm run audit       # production audit (blocking policy)
npm run audit:all   # full audit, including dev tooling
```

Run Gitleaks locally if it is installed:

```bash
gitleaks detect --source . --redact --verbose
```

## CI permissions and secrets

- Workflows default to `contents: read`.
- CodeQL alone receives `security-events: write`.
- No workflow echoes environment variables or secrets.
- Untrusted pull-request code does not receive repository secrets.
- Dependency audit installs with `--ignore-scripts` because it only reads the
  dependency tree.
