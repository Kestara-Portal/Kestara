-- =============================================================================
-- Kestara — E04 & E02 Core Tables (Companies & Jobs)
-- Migration: 20261111100000_e04_companies_and_jobs
--
-- Mendukung modul E04 (Kelola Data Mitra Perusahaan) dan relasinya dengan
-- lowongan kerja (E02), termasuk aturan penghapusan/soft delete (KP-31, KP-33, KP-34).
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

comment on table public.companies is
  'Mitra perusahaan Kestara supporting E04 module.';
comment on column public.companies.status is
  'active | suspended | deleted (soft delete untuk menjaga integritas data riwayat).';

create index if not exists companies_status_idx on public.companies (status);
create index if not exists companies_name_idx on public.companies (name);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

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

comment on table public.jobs is
  'Lowongan pekerjaan Kestara supporting E02 module.';
comment on column public.jobs.status is
  'draft | published | closed | archived.';

create index if not exists jobs_company_id_idx on public.jobs (company_id);
create index if not exists jobs_status_idx on public.jobs (status);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.jobs enable row level security;

-- Admin: kontrol penuh atas companies (KP-31 / E04-D)
drop policy if exists companies_admin_all on public.companies;
create policy companies_admin_all on public.companies
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Publik / User: membaca perusahaan yang aktif saja
drop policy if exists companies_select_active on public.companies;
create policy companies_select_active on public.companies
  for select to authenticated, anon
  using (status = 'active');

-- Admin: kontrol penuh atas jobs
drop policy if exists jobs_admin_all on public.jobs;
create policy jobs_admin_all on public.jobs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Publik / User: membaca lowongan yang dipublikasikan
drop policy if exists jobs_select_published on public.jobs;
create policy jobs_select_published on public.jobs
  for select to authenticated, anon
  using (status = 'published');

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
grant select on public.companies to authenticated, anon;
grant insert, update, delete on public.companies to authenticated;

grant select on public.jobs to authenticated, anon;
grant insert, update, delete on public.jobs to authenticated;
