# Contributing to Kestara

Jira is the source of truth for assignments and work status. GitHub is used for source code, branches, commits, and reviews.

## Before starting

1. Read `AGENTS.md`.
2. Read `docs/README.md` and the documents relevant to your Jira issue.
3. Confirm the Jira issue key, scope, acceptance criteria, and assignee.
4. Update local `main` and check your working tree.

```bash
git switch main
git pull --ff-only origin main
git status --short --branch
```

## Branch naming

Use the real issue key from the Kestara Jira board:

```text
feat/KP-123-short-description
fix/KP-123-short-description
docs/KP-123-short-description
chore/KP-123-short-description
```

`KP-123` is only an example. Never invent an issue key.

Create your branch from the updated `main`:

```bash
git switch -c feat/KP-123-short-description
```

Do not create or use `develop` unless the PM/team explicitly approves it.

## Commit messages

```text
feat(KP-123): add user profile form
fix(KP-124): handle invalid login response
docs(KP-125): update setup instructions
chore(KP-126): organize repository configuration
```

Use the actual Jira key. Do not include secrets, personal data, or unrelated changes.

## Push and pull request

```bash
git push -u origin feat/KP-123-short-description
```

Open a Pull Request with base `main`. Include the Jira key, scope, implementation notes, actual test results, known limitations, and screenshots for UI changes. Request review from another team member and resolve review conversations before merging.

## Safety rules

- Never commit `.env` files or secrets.
- Never push directly to `main`.
- Never force-push or rewrite shared branch history without explicit authorization.
- Do not merge your own PR unless the team's agreed review policy explicitly allows it.
- Review database changes and destructive migrations before execution.
- Keep each PR focused on its Jira scope.
- Coordinate cross-module changes with affected teammates and the PM.

## Jira and GitHub

- Jira: assignment, priority, status, sprint, and acceptance criteria.
- GitHub: branches, commits, source changes, code review, and merge history.
- Link the Jira issue in the branch, commit, and PR where applicable.
- Update Jira status according to the team's workflow after PR creation, review, and merge.
- Do not duplicate Jira tasks as GitHub issues unless the team agrees to that practice.
