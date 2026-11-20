# Authentication Guide (Supabase Auth Foundation)

> Status: foundation implemented in code. Verified only through typecheck/build so far; runtime verification requires local Supabase.

## Clients

| File | Purpose |
|---|---|
| `lib/supabase/client.ts` | Browser client (`createBrowserClient`), public key only |
| `lib/supabase/server.ts` | Request-aware server client (`createServerClient`) using async `cookies()` |
| `lib/supabase/admin.ts` | Server-only service-role client (bypasses RLS; narrow use only) |
| `lib/supabase/proxy.ts` | Session refresh helper |
| `proxy.ts` | Next.js 16 proxy entry (renamed from middleware) |

## Session helpers

`lib/auth/session.ts`:

- `getCurrentUser()` → authenticated user + profile, or `null`.
- `requireUser()` → throws `AuthError("UNAUTHENTICATED")` when absent.
- `requireRole([...])` → throws `AuthError("FORBIDDEN")` when the role is not allowed.
- Deactivated/suspended accounts are treated as not authenticated.

## Server actions

`lib/auth/actions.ts`:

- `signUpAction` — validates input, allows **only** public roles, calls `supabase.auth.signUp`.
- `signInAction` — validates input, calls `signInWithPassword`.
- `signOutAction` — clears the session.

## Routes

| Route | Purpose |
|---|---|
| `/auth/register` | Supabase registration (jobseeker / mentor / recruiter only) |
| `/auth/login` | Supabase login |
| `/auth/callback` | Exchanges the auth code for a session (email confirmation / OAuth) |
| `/auth/logout` | Signs out and redirects |

The legacy `/login`, `/register`, and `/api/auth/[...nextauth]` remain intact during migration. They are **not** removed until the Supabase flow is verified and the Project Owner approves.

## Profile provisioning

A database trigger (`on_auth_user_created` → `public.handle_new_user()`) creates exactly one `public.users` row per new auth identity, idempotently.

- Role is read from `raw_user_meta_data.role` **only** if it is `jobseeker`, `mentor`, or `recruiter`.
- `admin` can never be granted through public registration; unrecognized roles fall back to `jobseeker`.
- Password and email live in `auth.users`, never in `public.users`.

## Controlled admin provisioning

Admin accounts are created out-of-band with the service-role key:

```bash
npm run provision:admin -- admin@example.com "StrongPassword123" "Admin Name"
```

The script creates the auth user, then sets `public.users.role = 'admin'` through the elevated client. Never expose this path to the browser.

## Legacy password migration — PENDING DECISION

Legacy bcrypt hashes from MySQL are **not** migrated automatically. Options (require Project Owner approval):

1. Force a password reset on first Supabase login.
2. Controlled import of password hashes into `auth.users.encrypted_password` plus `auth.identities`.

Do not move raw hashes into `public.users` and do not delete the legacy stack until this is decided and tested.
