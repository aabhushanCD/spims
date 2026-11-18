# Git and GitHub workflow

This document is the canonical Git workflow for SPIMS. It applies to human
developers and AI coding agents. [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
summarizes the same rules; [`AGENTS.md`](../../AGENTS.md) adds agent-specific
constraints.

## Repository model

- `main` is the protected integration branch and the source of truth.
- All changes reach `main` through a pull request.
- Feature work happens on short-lived branches, one logical change per branch.
- The repository uses npm and two separately installed packages (`server/`,
  `client/`). There is no root workspace lockfile.
- CI runs on pull requests targeting `main` and on pushes to `main`.

## Branch names

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

Use lowercase and hyphens. Do not rename or delete branches that other people
may be working on. Do not commit directly to `main`.

## Commit convention

Use Conventional Commits:

```text
<type>(<scope>): <description>
```

Supported types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`,
`security`, `perf`, `build`.

Example:

```text
test(server): add FEFO allocation tests
```

Rules:

- Imperative, concise subject.
- One coherent change per commit; do not mix unrelated files.
- Never invent a description. Review `git diff --cached` first.
- Add `BREAKING CHANGE:` in the footer for incompatible changes.
- Do not amend or rewrite published history unless the branch is private and
  explicitly authorized.

## Daily workflow

```bash
# 1. Inspect before starting
git status
git branch --show-current

# 2. Update main
git checkout main
git pull --ff-only origin main

# 3. Create a branch
git checkout -b chore/quality-gates-and-docs

# 4. Make changes and validate
npm run check
npm run audit        # when dependencies or configuration changed

# 5. Review exactly what will be committed
git status
git diff
git diff --check

# 6. Stage selectively and review the staged diff
git add <specific-files>
git diff --cached

# 7. Commit
git commit -m "chore(server): resolve ESLint warnings"

# 8. Push and open a pull request
git push -u origin chore/quality-gates-and-docs
gh pr create --base main --fill
```

## What must never be committed

- `.env` files or any credential, token, key, or connection string.
- `node_modules/`, `dist/`, `coverage/`, logs, and temporary files.
- Local database dumps or generated artifacts that are not documentation.
- `.vscode/` or `.idea/` local settings, except approved shared files.

Check `.gitignore` and run `git status --ignored` when a file's status is
unclear. If a secret was committed, treat it as compromised, rotate it, and
remove it from history; deleting the file in a later commit is not enough.

## Pull requests

- Base branch: `main`.
- Title: `<type>(<scope>): <description>`.
- Follow `.github/PULL_REQUEST_TEMPLATE.md`.
- Include only changes relevant to the PR.
- Report verification commands actually executed. Never mark a check as passed
  unless it was run.
- Link issues with `Closes #<number>`.
- Do not open a duplicate PR for a branch that already has one.

## CI and branch protection

Required checks for `main` (job names as reported by GitHub Actions):

- `Backend (lint, typecheck, test, build)`
- `Frontend (lint, typecheck, build)`
- `Dependency audit (server)`
- `Dependency audit (client)`
- `Secret scan (Gitleaks)`
- `Analyze JavaScript / TypeScript`

Branch protection for `main` should require:

- A pull request before merging.
- At least one approval when another reviewer is available.
- All required status checks to pass.
- Conversations to be resolved.
- Branches to be up to date before merging, where practical.
- Linear history if the team adopts squash-only merges.
- No force pushes and no branch deletion.
- No bypass of required checks for regular contributors.

Administrators may need to configure these settings in GitHub; local files
cannot enforce remote repository rules. If a required check name changes,
update the protection rule in the same change that renames the job.

## Merge strategy

- Squash merge for focused PRs and multi-commit work that does not need
  individual commits on `main`.
- Merge commit when preserving a meaningful commit sequence matters.
- Never merge with failing required checks, unresolved conflicts, or pending
  required reviews.
- Delete the source branch after the merge is confirmed.

## Failure handling

If CI fails:

1. Read the first failing step and reproduce it locally with the same working
   directory.
2. Fix the application, test, or configuration. Do not bypass, disable, or
   weaken the check.
3. Re-run the local gate (`npm run check`, plus `npm run audit` when relevant).
4. Commit the fix and push. The pull request updates automatically.

If the branch diverges from `main`, fetch and rebase or merge `main` locally.
Never force-push a shared branch. If a conflict cannot be resolved safely, stop
and ask the branch owner.

## AI-agent requirements

Every AI agent must:

1. Read repository instructions before modifying code.
2. Inspect Git status before starting work.
3. Never overwrite unrelated user changes.
4. Never run destructive Git commands without explicit authorization.
5. Follow Conventional Commits and the branch naming rules above.
6. Run the relevant tests and quality checks before committing.
7. Review the staged diff before each commit.
8. Never stage unrelated files or secrets.
9. Create a descriptive pull request with real verification results.
10. Never bypass CI, branch protection, or required reviews.
11. Never force-push shared branches.
12. Never claim a commit, push, PR, or merge succeeded unless the remote
    confirms it.
