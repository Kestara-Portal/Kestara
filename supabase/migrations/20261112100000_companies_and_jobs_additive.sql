-- =============================================================================
-- Kestara — Additive Schema & RLS for Companies and Jobs
-- Migration: 20261112100000_companies_and_jobs_additive
--
-- Ensures public.companies and public.jobs exist with required columns,
-- indexes, triggers, and Row Level Security (RLS) policies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- public.companies
-- -----------------------------------------------------------------------------
create table if not exists public.companies (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (length(btrim(name)) > 0),
  description    text,
  industry       text,
  location       text,
  website        text,
  size           text,
  logo_path      text,
  status         text not null default 'active'
                   check (status in ('active', 'suspended', 'deleted')),
  created_by     uuid references public.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists companies_status_idx on public.companies (status);
create index if not exists companies_name_idx on public.companies (name);

-- -----------------------------------------------------------------------------
-- public.jobs
-- -----------------------------------------------------------------------------
create table if not exists public.jobs (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies (id) on delete cascade,
  title          text not null check (length(btrim(title)) > 0),
  description    text,
  requirements   text,
  type           text not null default 'Full-time',
  location       text,
  salary         text,
  status         text not null default 'published'
                   check (status in ('draft', 'published', 'closed', 'archived')),
  created_by     uuid references public.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.jobs
  add column if not exists company_id uuid references public.companies (id) on delete cascade,
  add column if not exists requirements text,
  add column if not exists type text not null default 'Full-time',
  add column if not exists salary text;

create index if not exists jobs_company_id_idx on public.jobs (company_id);
create index if not exists jobs_status_idx on public.jobs (status);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.jobs enable row level security;

-- Admin policies: Full management
drop policy if exists companies_admin_all on public.companies;
create policy companies_admin_all on public.companies
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists jobs_admin_all on public.jobs;
create policy jobs_admin_all on public.jobs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Public / active selection policies
drop policy if exists companies_select_active on public.companies;
create policy companies_select_active on public.companies
  for select to authenticated, anon
  using (status = 'active');

drop policy if exists jobs_select_published on public.jobs;
create policy jobs_select_published on public.jobs
  for select to authenticated, anon
  using (status = 'published');

-- Role grants
grant select on public.companies to authenticated, anon;
grant insert, update, delete on public.companies to authenticated;

grant select on public.jobs to authenticated, anon;
grant insert, update, delete on public.jobs to authenticated;
