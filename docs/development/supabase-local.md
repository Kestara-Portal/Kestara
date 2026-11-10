# Supabase Local Development

> Applies to the current implementation. Local Supabase requires Docker Desktop.

## Prerequisites

- Docker Desktop installed and **running** (local Supabase containers need it).
- Supabase CLI available through the project devDependency (no global install required).

Verify tools:

```bash
docker --version
docker ps            # must NOT error
npx supabase --version
```

## Start / stop the local stack

```bash
npm run db:start     # supabase start (first run downloads images)
npx supabase status  # shows local URL/keys (never commit these)
npm run db:stop      # supabase stop
```

`supabase status` prints the local API URL and keys. Treat keys as secrets even locally; do not paste them into Git, docs, chat, or screenshots.

## Database migrations

SQL migrations live in `supabase/migrations/` and are the source of truth once Supabase is in use.

```bash
npx supabase migration new <name>   # create a new empty migration file
npm run db:reset                    # LOCAL ONLY: apply migrations + seed from scratch
npm run db:diff                     # generate a diff migration from the local DB
```

Rules:

- Never edit a migration that has already been applied to a shared environment.
- Add new changes as a new migration file.
- **Never run `db:reset` or `db:push` against the remote project.**
- Remote changes require preflight, backup, and Project Owner approval.

## Seed

`supabase/seed.sql` is intentionally minimal and safe. Synthetic auth users are created through Auth, not raw SQL:

```bash
npm run seed:users   # creates synthetic jobseeker A/B, mentor, recruiter, admin
```

This requires `SUPABASE_SECRET_KEY` in `.env.local` (server-only). The legacy `SUPABASE_SERVICE_ROLE_KEY` is still accepted as a temporary fallback.

## Database / RLS testing

```bash
npm run test:rls     # integration checks for constraints + RLS (needs local Supabase)
npm run db:test      # pgTAP tests via `supabase test db` (if SQL tests exist)
```

## Verification status

With Docker running, the foundation was verified locally:

- `supabase db reset` applied all six migrations cleanly and ran the seed.
- `npm run test:rls` passed **28/28** checks (RLS, auth, provisioning, storage isolation, account-status enforcement).

Remote Supabase was **not** touched. Do not run remote operations without preflight, backup, and approval.

## Remote project

The remote project is confirmed by the Project Owner, but **no remote operations were performed**. Do not push/reset remotely without the preflight procedure in the master task.
