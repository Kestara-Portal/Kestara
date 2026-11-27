# RLS & Security Guide

> Status: E01 and KP-35 company/job policies are implemented in local migrations. Remote migrations have not been applied.

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

## Access matrix (E04-C / E02-U)

Implemented in `supabase/migrations/20261113000000_e02_e04_companies_vacancies.sql`.

### `public.companies`
| Op | jobseeker | mentor | recruiter | admin | anon |
|---|---|---|---|---|---|
| SELECT | read | read | read | read | deny |
| INSERT | deny | deny | own (`created_by = auth.uid()`) | allow | deny |
| UPDATE | deny | deny | owner membership only | allow | deny |
| DELETE | deny | deny | owner membership only | allow | deny |

Duplicate protection is enforced by two unique indexes (normalized name, normalized website domain), not only by the application check.

### `public.company_memberships`
| Op | jobseeker | mentor | recruiter | admin | anon |
|---|---|---|---|---|---|
| SELECT | own | own | own + same-company | allow | deny |
| INSERT | deny | deny | deny (created by trigger) | allow | deny |
| UPDATE | deny | deny | owner of that company | allow | deny |
| DELETE | deny | deny | own row / company owner | allow | deny |

### `public.job_vacancies`
| Op | jobseeker | mentor | recruiter | admin | anon |
|---|---|---|---|---|---|
| SELECT | active only | active only | active + own company | all | deny |
| INSERT | deny | deny | member of the company | allow | deny |
| UPDATE | deny | deny | member of the vacancy's company | allow | deny |
| DELETE | deny | deny | company owner | allow | deny |

`company_id` and `recruiter_id` are excluded from the `UPDATE` column grant, so even an authorized recruiter cannot move a vacancy to another company or hand it to another recruiter.

### Helpers added
| Function | Returns | Used by |
|---|---|---|
| `public.company_website_domain(text)` | text | unique index + duplicate probe |
| `public.is_company_member(uuid)` | boolean | vacancy update/select, membership select |
| `public.is_company_owner(uuid)` | boolean | company update/delete, vacancy delete |
| `public.company_duplicate_exists(text, text)` | boolean | E04-C application-layer duplicate check |
| `public.handle_new_company()` (trigger) | trigger | creates the owner membership on company insert |

All are `SECURITY DEFINER` with `search_path = ''`; `EXECUTE` is revoked from `public` and `anon` and granted only to `authenticated` (the trigger function is granted to nobody).

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

`npm run test:rls` creates isolated synthetic users and verifies E01 access controls plus verified-company visibility, pending/revoked access, recruiter cross-company isolation, and admin-only membership verification/revocation.

`public.company_memberships` keeps the latest verified/revoked actor and timestamps. It does not keep an append-only history of every status transition. Revoking a membership blocks future job creation; existing jobs are not automatically changed or deleted.

## Rules for new tables/PBIs

- Enable RLS and write per-operation policies.
- Never add a broad `is_admin()` bypass to sensitive content.
- Keep `SECURITY DEFINER` functions minimal, fixed `search_path`, restricted grants.
- Add allow **and** deny tests for all four roles.
