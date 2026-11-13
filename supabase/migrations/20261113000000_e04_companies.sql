-- =============================================================================
-- Kestara — E04-C Company Profile and Memberships data layer
-- Migration: 20261113000000_e04_companies
--
-- Implements:
--   public.companies           (company profile, E04-C)
--   public.company_memberships (recruiter <-> company ownership, E04-C)
--
-- Scope notes:
--   * Company registration (E04-C): admin/recruiter only, duplicate detection on
--     normalized company name and website domain.
--   * Membership rows are created by trigger for the recruiter who registers a
--     company, so company + ownership are created in one statement (no
--     service-role bypass, no partial registration state).
--
-- Idempotent: safe to re-run against a local database.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Website normalization helper (used for duplicate detection + unique index)
-- -----------------------------------------------------------------------------
create or replace function public.company_website_domain(raw_website text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  value text;
begin
  value := lower(btrim(coalesce(raw_website, '')));
  if value = '' then
    return null;
  end if;

  value := regexp_replace(value, '^[a-z][a-z0-9+.\-]*://', '');
  value := split_part(value, '/', 1);
  value := split_part(value, '?', 1);
  value := split_part(value, '#', 1);
  value := regexp_replace(value, '^www\.', '');
  value := regexp_replace(value, ':[0-9]+$', '');
  value := btrim(value, '.');

  if value = '' then
    return null;
  end if;

  return value;
end;
$$;

comment on function public.company_website_domain(text) is
  'Normalizes a website value to a comparable host used for duplicate detection.';

revoke all on function public.company_website_domain(text) from public;
revoke all on function public.company_website_domain(text) from anon;
grant execute on function public.company_website_domain(text) to authenticated;

-- -----------------------------------------------------------------------------
-- public.companies
-- -----------------------------------------------------------------------------
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) > 0),
  description text,
  website     text,
  location    text,
  logo_path   text,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.companies is
  'Company profile. Created by an admin or a recruiter (E04-C).';
comment on column public.companies.logo_path is
  'Storage object path only. Never a public URL and never a credential.';

-- Duplicate detection: normalized company name (trimmed, case-insensitive,
-- internal whitespace collapsed).
create unique index if not exists companies_name_normalized_key
  on public.companies (regexp_replace(lower(btrim(name)), '\s+', ' ', 'g'));

-- Duplicate detection: website domain, ignoring scheme/www/path differences.
create unique index if not exists companies_website_domain_key
  on public.companies (public.company_website_domain(website))
  where public.company_website_domain(website) is not null;

create index if not exists companies_created_by_idx on public.companies (created_by);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- public.company_memberships
-- -----------------------------------------------------------------------------
create table if not exists public.company_memberships (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  role       text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  constraint company_memberships_company_user_key unique (company_id, user_id)
);

comment on table public.company_memberships is
  'Links a recruiter to a company. Authorization for company-scoped actions is derived from this table, never from a client-supplied company id alone.';

create index if not exists company_memberships_user_id_idx
  on public.company_memberships (user_id);

-- -----------------------------------------------------------------------------
-- Helpers for RLS: company membership / ownership check
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
      and m.role = 'owner'
  );
$$;

comment on function public.is_company_member(uuid) is
  'True when the caller holds any membership row for the company.';
comment on function public.is_company_owner(uuid) is
  'True when the caller holds the owner membership row for the company.';

revoke all on function public.is_company_member(uuid) from public, anon;
revoke all on function public.is_company_owner(uuid) from public, anon;
grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.is_company_owner(uuid) to authenticated;

-- Server-side duplicate probe used by the application layer. Returns a boolean
-- only, so no company rows are disclosed beyond what authenticated SELECT allows.
create or replace function public.company_duplicate_exists(candidate_name text, candidate_domain text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.companies c
    where regexp_replace(lower(btrim(c.name)), '\s+', ' ', 'g')
            = regexp_replace(lower(btrim(coalesce(candidate_name, ''))), '\s+', ' ', 'g')
       or (
         nullif(btrim(coalesce(candidate_domain, '')), '') is not null
         and public.company_website_domain(c.website) = btrim(candidate_domain)
       )
  );
$$;

revoke all on function public.company_duplicate_exists(text, text) from public, anon;
grant execute on function public.company_duplicate_exists(text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Ownership bootstrap: a recruiter who registers a company becomes its owner
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_company()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  creator_role text;
begin
  if new.created_by is null then
    return new;
  end if;

  select u.role into creator_role
  from public.users u
  where u.id = new.created_by;

  if creator_role = 'recruiter' then
    insert into public.company_memberships (company_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict (company_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_company() from public, anon, authenticated;

drop trigger if exists companies_create_owner_membership on public.companies;
create trigger companies_create_owner_membership
after insert on public.companies
for each row execute function public.handle_new_company();

-- -----------------------------------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;

-- -----------------------------------------------------------------------------
-- public.companies policies
-- -----------------------------------------------------------------------------
drop policy if exists companies_select_authenticated on public.companies;
create policy companies_select_authenticated on public.companies
  for select to authenticated
  using (true);

drop policy if exists companies_insert_staff on public.companies;
create policy companies_insert_staff on public.companies
  for insert to authenticated
  with check (
    public.is_active_account()
    and public.current_app_role() in ('admin', 'recruiter')
    and created_by = auth.uid()
  );

drop policy if exists companies_update_owner on public.companies;
create policy companies_update_owner on public.companies
  for update to authenticated
  using (
    public.is_active_account()
    and (public.is_admin() or public.is_company_owner(id))
  )
  with check (
    public.is_active_account()
    and (public.is_admin() or public.is_company_owner(id))
  );

drop policy if exists companies_delete_owner on public.companies;
create policy companies_delete_owner on public.companies
  for delete to authenticated
  using (
    public.is_active_account()
    and (public.is_admin() or public.is_company_owner(id))
  );

-- -----------------------------------------------------------------------------
-- public.company_memberships policies
-- -----------------------------------------------------------------------------
drop policy if exists company_memberships_select_scoped on public.company_memberships;
create policy company_memberships_select_scoped on public.company_memberships
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_company_member(company_id)
  );

drop policy if exists company_memberships_insert_admin on public.company_memberships;
create policy company_memberships_insert_admin on public.company_memberships
  for insert to authenticated
  with check (public.is_active_account() and public.is_admin());

drop policy if exists company_memberships_update_owner on public.company_memberships;
create policy company_memberships_update_owner on public.company_memberships
  for update to authenticated
  using (public.is_active_account() and (public.is_admin() or public.is_company_owner(company_id)))
  with check (public.is_active_account() and (public.is_admin() or public.is_company_owner(company_id)));

drop policy if exists company_memberships_delete_owner on public.company_memberships;
create policy company_memberships_delete_owner on public.company_memberships
  for delete to authenticated
  using (
    public.is_active_account()
    and (public.is_admin() or public.is_company_owner(company_id) or user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- Table / column privileges
-- -----------------------------------------------------------------------------
revoke all on public.companies from anon, authenticated;
grant select on public.companies to authenticated;
grant insert (name, description, website, location, logo_path, created_by)
  on public.companies to authenticated;
grant update (name, description, website, location, logo_path)
  on public.companies to authenticated;
grant delete on public.companies to authenticated;

revoke all on public.company_memberships from anon, authenticated;
grant select on public.company_memberships to authenticated;
grant insert (company_id, user_id, role) on public.company_memberships to authenticated;
grant update (role) on public.company_memberships to authenticated;
grant delete on public.company_memberships to authenticated;
