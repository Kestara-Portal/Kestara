-- =============================================================================
-- Kestara — E04-U: Company Membership & Company Profile Update (KP-27)
-- Migration: 20261112090000_e04u_company_memberships_and_update
--
-- Adds the membership relation that E04 authorization depends on and the
-- UPDATE path that lets an authorized Recruiter maintain their company profile.
--
-- Summary:
--   * public.company_memberships: recruiter <-> company relation. Authorization
--     must never assume every Recruiter may edit every company.
--   * public.is_company_member() / public.is_company_owner(): SECURITY DEFINER
--     helpers (fixed empty search_path, fully-qualified names) so policies can
--     read memberships without RLS recursion.
--   * companies_update_owner: UPDATE allowed only for an active account that is
--     an admin or an active member of that company.
--   * Column privileges restrict a member's UPDATE to the profile columns.
--     status/created_by stay administrator-only through a guard trigger, because
--     the admin soft-delete path (KP-31/KP-33) updates status through the same
--     authenticated role.
--   * Normalized unique indexes prevent duplicate companies by name or website.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- public.company_memberships
-- -----------------------------------------------------------------------------
create table if not exists public.company_memberships (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  user_id         uuid not null references public.users (id) on delete cascade,
  membership_role text not null default 'member'
                    check (membership_role in ('owner', 'member')),
  status          text not null default 'active'
                    check (status in ('active', 'invited', 'revoked')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint company_memberships_company_user_key unique (company_id, user_id)
);

comment on table public.company_memberships is
  'Recruiter <-> company authorization relation (E04). Only active memberships grant edit rights.';
comment on column public.company_memberships.status is
  'active | invited | revoked. Invitation/approval lifecycle is still TBD by the Project Owner.';

create index if not exists company_memberships_user_id_idx
  on public.company_memberships (user_id);
create index if not exists company_memberships_company_status_idx
  on public.company_memberships (company_id, status);

drop trigger if exists company_memberships_set_updated_at on public.company_memberships;
create trigger company_memberships_set_updated_at
before update on public.company_memberships
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Helper functions
-- -----------------------------------------------------------------------------
create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships m
    where m.company_id = target_company_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_company_owner(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships m
    where m.company_id = target_company_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.membership_role = 'owner'
  );
$$;

comment on function public.is_company_member(uuid) is
  'True when the caller holds an active membership for the given company.';
comment on function public.is_company_owner(uuid) is
  'True when the caller holds an active owner membership for the given company.';

revoke all on function public.is_company_member(uuid) from public;
revoke all on function public.is_company_owner(uuid) from public;
grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.is_company_owner(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RLS: public.company_memberships
-- -----------------------------------------------------------------------------
alter table public.company_memberships enable row level security;

drop policy if exists company_memberships_select_own on public.company_memberships;
create policy company_memberships_select_own on public.company_memberships
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists company_memberships_admin_all on public.company_memberships;
create policy company_memberships_admin_all on public.company_memberships
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No INSERT/UPDATE/DELETE policy for non-admins: membership provisioning and
-- invitation/approval lifecycle is a controlled operation (TBD), never a
-- recruiter self-service write.

-- -----------------------------------------------------------------------------
-- RLS: public.companies UPDATE (KP-27)
-- -----------------------------------------------------------------------------
drop policy if exists companies_update_owner on public.companies;
create policy companies_update_owner on public.companies
  for update to authenticated
  using (
    public.is_active_account()
    and (public.is_admin() or public.is_company_member(id))
  )
  with check (
    public.is_active_account()
    and (public.is_admin() or public.is_company_member(id))
  );

-- -----------------------------------------------------------------------------
-- Column privileges: profile columns only
-- -----------------------------------------------------------------------------
-- The E04 migration granted table-wide UPDATE to authenticated. Replace it with
-- a column allowlist so a member cannot touch identifiers or timestamps.
-- `updated_at` is deliberately excluded: companies_set_updated_at owns it, and
-- the application no longer sends it in the UPDATE payload.
revoke update on public.companies from authenticated;
grant update (name, description, website, location, logo_path, status)
  on public.companies to authenticated;

-- status is granted only because the administrator soft-delete path runs as the
-- authenticated admin. Non-admins are blocked by the guard trigger below.
create or replace function public.companies_guard_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'perubahan status perusahaan hanya dapat dilakukan administrator'
      using errcode = '42501';
  end if;

  if new.created_by is distinct from old.created_by then
    raise exception 'kolom created_by tidak dapat diubah'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function public.companies_guard_protected_columns() is
  'Blocks non-admin changes to companies.status / companies.created_by (KP-27 column allowlist).';

revoke all on function public.companies_guard_protected_columns() from public;

drop trigger if exists companies_guard_protected_columns on public.companies;
create trigger companies_guard_protected_columns
before update on public.companies
for each row execute function public.companies_guard_protected_columns();

-- -----------------------------------------------------------------------------
-- Normalized uniqueness (duplicate company collisions)
-- -----------------------------------------------------------------------------
-- The application stores name/website already trimmed; the indexes compare the
-- normalized form so " PT Maju " and "pt maju" collide. Soft-deleted companies
-- are excluded so a name can be reused after removal.
create unique index if not exists companies_normalized_name_key
  on public.companies (lower(btrim(name)))
  where status <> 'deleted';

create unique index if not exists companies_normalized_website_key
  on public.companies (lower(btrim(website)))
  where website is not null and status <> 'deleted';

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
revoke all on public.company_memberships from anon, authenticated;
grant select on public.company_memberships to authenticated;
