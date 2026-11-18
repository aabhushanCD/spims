# Contributing to SPIMS

SPIMS is a MERN pharmacy inventory system with two independently installed
packages:

- `server/` — Express 5, TypeScript, Mongoose, Redis.
- `client/` — React 19, Vite, TypeScript.

Read [`AGENTS.md`](AGENTS.md) and [`docs/`](docs/README.md) before changing
code. AI coding agents must follow `AGENTS.md` in addition to this guide.

## Getting started

```bash
# From the repository root (npm, not pnpm or yarn)
npm run install:all
npm run check
```

`npm run check` runs lint, type checking, server tests, and both builds. Use
`npm run check:ci` to also run the production dependency audit.

## Branch naming

Branch from an up-to-date `main`. Use a short, lowercase, hyphenated name:

```text
feature/<feature-name>
fix/<bug-name>
refactor/<module-name>
docs/<documentation-name>
test/<test-name>
ci/<pipeline-name>
security/<security-improvement>
chore/<maintenance-task>
```

Examples: `feature/batch-expiry-alerts`, `fix/sales-vat-rounding`,
`docs/server-architecture`, `ci/quality-gates`.

Rules:

- One branch per logical change.
- Do not commit directly to `main`; `main` is protected and requires a pull
  request.
- Do not rename or delete shared branches without coordinating with the owner.

## Commit messages

SPIMS uses [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <description>
```

| Type | Purpose |
|---|---|
| `feat` | New functionality |
| `fix` | Bug fixes |
| `refactor` | Internal code improvements |
| `docs` | Documentation changes |
| `test` | Test additions or modifications |
| `chore` | Maintenance and configuration |
| `ci` | CI/CD changes |
| `security` | Security improvements |
| `perf` | Performance improvements |
| `build` | Build system changes |

Examples:

```text
feat(inventory): implement batch stock allocation

fix(sales): correct VAT calculation rounding

test(inventory): add FEFO allocation tests

docs(server): document backend architecture

ci(github): add automated quality checks

chore(server): resolve ESLint warnings

security(deps): update vulnerable dependencies
```

Rules:

- Use the imperative mood: `add`, `fix`, `remove`, not `added` or `fixes`.
- Keep the subject concise (roughly 72 characters or fewer).
- Use a meaningful scope: module, package, or area (`inventory`, `sales`,
  `client`, `server`, `github`, `deps`).
- Do not use generic subjects such as `update`, `changes`, or `fix stuff`.
- Do not combine unrelated changes in one commit.
- Add a body when the reason is not obvious; explain what and why, not how.
- Use `BREAKING CHANGE:` in the footer when a change is not backward compatible.
- Never fabricate a commit message that does not match the diff. Review
  `git diff --cached` before committing.

## Pull requests

Every change to `main` goes through a pull request.

Before opening a PR:

1. Rebase or merge the latest `main` into your branch and resolve conflicts
   locally.
2. Run `npm run check` and, when dependencies changed, `npm run audit`.
3. Review `git diff main...HEAD` for unrelated or accidental changes.
4. Confirm no `.env`, credentials, build output, coverage, or logs are staged.

PR requirements:

- Follow the pull-request template.
- Title format: `<type>(<scope>): <description>`, for example
  `chore(github): establish contribution and quality-gate rules`.
- Describe what changed, why, and the important technical decisions.
- List the verification commands actually executed and their results. Do not
  check a box for a check you did not run.
- Link the related issue with `Closes #<number>` when applicable.
- Note breaking changes and migration steps, or state "None".
- Keep the diff focused. Split unrelated work into separate PRs.

## Code quality requirements

- Match the existing architecture and layering:
  `controller → service → repo → model` on the server and feature folders
  under `client/src/features`.
- Do not add `any`, `@ts-ignore`, or broad lint/TypeScript exclusions to hide
  errors. The existing `no-explicit-any` warning applies to legacy code only.
- Do not disable, skip, or weaken tests, lint rules, audits, or security checks.
- Do not reformat unrelated files.
- Keep secrets out of source control. Use `.env` locally and update
  `.env.example` with names only.
- Do not modify CI configuration to hide application failures.

## Testing requirements

- Add or update tests for behaviour you change, especially inventory, FEFO,
  sales, returns, VAT, purchases, and authorization.
- Server tests use Vitest and live next to the code as `*.test.ts`.
- Inject fake repositories; never connect tests to production MongoDB or Redis.
- Assert observable behaviour and status codes, and always `await` rejection
  assertions.
- Run `npm test` (single CI run) or `npm run test:coverage`.
- The client currently has no unit-test harness; its gate is lint, type
  checking, and the production build. Add component tests if you introduce a
  test runner.

See [`docs/testing.md`](docs/testing.md) for current coverage and integration
test limitations.

## Review expectations

- At least one approving review is required when another reviewer is available.
- Reviewers check correctness, security, data integrity, tests, and
  documentation — not only style.
- Address review comments with new commits; do not force-push a branch under
  review unless the reviewer agrees.
- All required CI checks must be green before merge.
- A reviewer may request a smaller PR if the change mixes unrelated work.

## Merge strategy

- **Squash merge** is the default for focused changes and multi-commit PRs that
  do not need individual commit history on `main`.
- **Merge commit** is acceptable when preserving a sequence of meaningful,
  independently useful commits is important.
- Never merge with failing required checks, unresolved conflicts, or pending
  required reviews.
- Delete the source branch after merge once the merge is confirmed.

## Documentation requirements

- Update the README, `docs/`, or `server/docs/` when behaviour, setup,
  environment variables, architecture, or workflows change.
- Keep documentation accurate. Do not claim coverage, checks, or guarantees
  that were not verified.
- Update `AGENTS.md` when you introduce a workflow rule that AI agents must
  follow.
- Add code comments only where the code cannot explain itself.

## Reporting problems

Use the issue templates in `.github/ISSUE_TEMPLATE/` for bugs and feature
requests. For security vulnerabilities, follow [`SECURITY.md`](SECURITY.md)
instead of opening a public issue.
