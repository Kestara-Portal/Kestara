# RLS & Security Guide

> Status: policies implemented across `20261110090100_e01_rls.sql`, `20261110090400_e01_account_status_guard.sql`, and `20261110090500_function_grants.sql`. Runtime verification passed locally (`npm run test:rls`, 28/28 checks).

## Principles

1. RLS is enabled on every exposed E01 table.
2. Policies are defined per operation (SELECT / INSERT / UPDATE / DELETE).
3. A user's identity is always `auth.uid()` — never a value from the request body.
4. Ownership and role checks are enforced in the database, not only in the UI.
5. Admin does not get blanket access to user professional content.

## Helper functions (SECURITY DEFINER)

Defined with `search_path = ''`, fully-qualified names, and restricted `EXECUTE`:

| Function | Returns | Used by |
|---|---|---|
| `public.current_app_role()` | text | role checks |
| `public.is_admin()` | boolean | admin read policy / RPC |
| `public.can_manage_professional_data()` | boolean | skills/portfolio insert/update |
| `public.is_active_account()` | boolean | blocks mutations/uploads for suspended/deactivated users |

They are `SECURITY DEFINER` to avoid RLS recursion when reading `public.users`. Only `authenticated` gets `EXECUTE`; `anon` is explicitly revoked (Supabase default privileges may otherwise grant it).

## Access matrix (E01)

### `public.users`
| Op | jobseeker | mentor | recruiter | admin | anon |
|---|---|---|---|---|---|
| SELECT | own | own | own | controlled read | deny |
| INSERT | deny (trigger) | deny | deny | deny (RPC) | deny |
| UPDATE | own safe columns | own safe columns | own safe columns | via RPC | deny |
| DELETE | deny | deny | deny | controlled | deny |

### `public.user_skills` / `public.portfolio_items`
| Op | jobseeker | mentor | recruiter | admin | anon |
|---|---|---|---|---|---|
| SELECT | own | own | own | deny | deny |
| INSERT | own | own | own | deny | deny |
| UPDATE | own | own | own | deny | deny |
| DELETE | own | own | own | deny | deny |

## Column-level protection

Users cannot change `role` or `account_status` because those columns are **not** granted for UPDATE:

```sql
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;
grant update (full_name, bio, phone_number, avatar_path) on public.users to authenticated;
```

`role` can only be changed by the admin provisioning path; `account_status` only through `admin_set_account_status(uuid, text)` (admin-only RPC).

Suspended/deactivated accounts cannot perform protected mutations or storage uploads because `is_active_account()` is required by the UPDATE/INSERT/DELETE policies. Direct `account_status` self-edits are also blocked by column privileges.

## Testing

`npm run test:rls` creates isolated synthetic users and verifies: anon denial, own-read, cross-user denial, role-change denial, own CRUD, cross-user skill edit denial, admin no-blanket skill access, admin user listing.

Minimum additional checks (once Docker is available): deactivated account cannot mutate, admin RPC authorization, storage isolation.

## Rules for new tables/PBIs

- Enable RLS and write per-operation policies.
- Never add a broad `is_admin()` bypass to sensitive content.
- Keep `SECURITY DEFINER` functions minimal, fixed `search_path`, restricted grants.
- Add allow **and** deny tests for all four roles.
