-- =============================================================================
-- Kestara — E02-U Job Vacancy data layer
-- Migration: 20261113010000_e02_vacancies
--
-- Implements:
--   public.job_vacancies       (vacancy records, E02-U / E02-C / E02-R / E02-D)
--
-- Scope notes:
--   * Vacancy update (E02-U): admin, or a recruiter who is a member of the
--     vacancy's company. company_id / recruiter_id are NOT updatable (column
--     privileges below), so a vacancy can never be moved to another company.
--
-- Idempotent: safe to re-run against a local database.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- public.job_vacancies
-- -----------------------------------------------------------------------------
create table if not exists public.job_vacancies (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  recruiter_id    uuid not null references public.users (id) on delete cascade,
  title           text not null check (length(btrim(title)) > 0),
  description     text not null check (length(btrim(description)) > 0),
  required_skills jsonb not null default '[]'::jsonb,
  employment_type text,
  location        text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint job_vacancies_required_skills_is_array
    check (jsonb_typeof(required_skills) = 'array'),
  constraint job_vacancies_employment_type_allowed
    check (employment_type is null
           or employment_type in ('full_time', 'part_time', 'contract', 'internship', 'freelance'))
);

comment on table public.job_vacancies is
  'Job vacancy owned by exactly one company. company_id/recruiter_id are immutable after insert.';

create index if not exists job_vacancies_company_id_idx on public.job_vacancies (company_id);
create index if not exists job_vacancies_recruiter_id_idx on public.job_vacancies (recruiter_id);
create index if not exists job_vacancies_is_active_idx on public.job_vacancies (is_active);

drop trigger if exists job_vacancies_set_updated_at on public.job_vacancies;
create trigger job_vacancies_set_updated_at
before update on public.job_vacancies
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------------------------------
alter table public.job_vacancies enable row level security;

-- -----------------------------------------------------------------------------
-- public.job_vacancies policies
-- -----------------------------------------------------------------------------
drop policy if exists job_vacancies_select_active on public.job_vacancies;
create policy job_vacancies_select_active on public.job_vacancies
  for select to authenticated
  using (is_active);

drop policy if exists job_vacancies_select_managers on public.job_vacancies;
create policy job_vacancies_select_managers on public.job_vacancies
  for select to authenticated
  using (public.is_admin() or public.is_company_member(company_id));

drop policy if exists job_vacancies_insert_company_member on public.job_vacancies;
create policy job_vacancies_insert_company_member on public.job_vacancies
  for insert to authenticated
  with check (
    public.is_active_account()
    and (
      public.is_admin()
      or (
        public.current_app_role() = 'recruiter'
        and recruiter_id = auth.uid()
        and public.is_company_member(company_id)
      )
    )
  );

drop policy if exists job_vacancies_update_company_member on public.job_vacancies;
create policy job_vacancies_update_company_member on public.job_vacancies
  for update to authenticated
  using (
    public.is_active_account()
    and (
      public.is_admin()
      or (public.current_app_role() = 'recruiter' and public.is_company_member(company_id))
    )
  )
  with check (
    public.is_active_account()
    and (
      public.is_admin()
      or (public.current_app_role() = 'recruiter' and public.is_company_member(company_id))
    )
  );

drop policy if exists job_vacancies_delete_company_owner on public.job_vacancies;
create policy job_vacancies_delete_company_owner on public.job_vacancies
  for delete to authenticated
  using (
    public.is_active_account()
    and (public.is_admin() or public.is_company_owner(company_id))
  );

-- -----------------------------------------------------------------------------
-- Table / column privileges
-- -----------------------------------------------------------------------------
revoke all on public.job_vacancies from anon, authenticated;
grant select on public.job_vacancies to authenticated;
grant insert (company_id, recruiter_id, title, description, required_skills, employment_type, location, is_active)
  on public.job_vacancies to authenticated;
grant update (title, description, required_skills, employment_type, location, is_active)
  on public.job_vacancies to authenticated;
grant delete on public.job_vacancies to authenticated;
