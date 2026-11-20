# PBI Implementation Guide

This guide explains how a team member integrates a PBI on top of the development foundation. It does not define product rules — use Jira and approved docs for that.

## 1. Before coding

1. Confirm the real Jira issue key, Epic, PBI (one CRUD operation), acceptance criteria, and assignee.
2. Read `AGENTS.md`, `docs/README.md`, the relevant requirement, acceptance criteria, and architecture docs.
3. Check `git status`. Never overwrite unrelated changes or the staged foundation files.

## 2. Branch

Create a branch from the current integration base using the real Jira key:

```bash
git switch -c feat/<JIRA-KEY>-short-description
```

Never invent a Jira key. Do not push directly to `main`.

## 3. Implement across the three tiers

- **Data layer:** add a new versioned migration in `supabase/migrations/` for any schema/RLS change (never edit applied migrations). Include constraints, indexes, RLS, and grants.
- **Application layer:** add validation (`lib/validations/`), use-case/service logic (`lib/services/`), authorization (`requireUser`/`requireRole`), and a route handler or server action. Return the standard response envelope.
- **Presentation layer:** build the page/form using Green Teal tokens, with loading, empty, error, and success states.

## 4. Security checklist

- Enforce ownership/role on the server and in RLS.
- Never trust a client-supplied `user_id`, role, status, or score.
- Redact Blind Profile data at the server/database boundary (E05).
- Keep private files in private buckets; use the path builders.
- Do not bypass RLS with the service-role key unless explicitly approved.

## 5. Database changes

```bash
npx supabase migration new <pbi-scope>
# edit the generated SQL
npm run db:reset        # LOCAL only: verify migrations apply cleanly
npm run test:rls        # verify access rules
```

For remote: preflight, backup, and approval only. Never `db:reset` remotely.

## 6. Tests

- Add unit tests under `tests/unit/` for validation/business helpers.
- Add/extend RLS/auth checks for authorization boundaries.
- Run before opening a PR:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Record actual results. Do not claim a check passed if it was not run.

## 7. Commit and PR

Use the repository commit format, referencing the Jira key:

```bash
git commit -m "feat(<JIRA-KEY>): <imperative summary>"
```

Open a PR with: Jira key/link, what changed and why, scope included/excluded, screenshots for UI, test commands + results, migration/RLS/storage impact, env var changes (names only), security notes, limitations. Request review; do not self-merge.

## 8. Definition of Done

Acceptance criteria pass; authorization enforced on server/database; validation/error states implemented; tests run with evidence; no secrets/PII exposed; docs updated; code reviewed; authorized reviewer accepts.
