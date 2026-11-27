-- =============================================================================
-- Kestara — E02 Job Vacancy (Create + Publish)
-- Migration: 20261110100000_e02_jobs
--
-- Minimal scope for KP-35: create and publish a vacancy with skill criteria.
-- Company/membership relations are intentionally omitted because the
-- recruiter-company authorization model is not yet approved (OPEN-004).
-- The creator is linked to the authenticated recruiter via created_by.
--
-- Security:
--   * RLS enabled; only recruiters may INSERT; created_by must equal auth.uid().
--   * No UPDATE/DELETE policies here (later E02 PBIs will add them).
--   * Atomic creation via SECURITY INVOKER function so RLS still applies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- public.jobs
-- -----------------------------------------------------------------------------
create table if not exists public.jobs (
  id              uuid primary key default gen_random_uuid(),
  created_by      uuid not null references public.users (id) on delete cascade,
  title           text not null check (length(btrim(title)) > 0),
  description     text not null check (length(btrim(description)) > 0),
  location        text,
  employment_type text,
  status          text not null default 'draft'
                    check (status in ('draft', 'published', 'closed')),
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.jobs is
  'Job vacancy created by a recruiter. created_by links to the authenticated recruiter.';

create index if not exists jobs_created_by_idx on public.jobs (created_by);
create index if not exists jobs_status_published_idx on public.jobs (status, published_at desc);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- public.job_skill_requirements
-- -----------------------------------------------------------------------------
create table if not exists public.job_skill_requirements (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.jobs (id) on delete cascade,
  skill_name text not null check (length(btrim(skill_name)) > 0),
  created_at timestamptz not null default now(),
  constraint job_skill_requirements_unique unique (job_id, skill_name)
);

comment on table public.job_skill_requirements is
  'Skill criteria required by a vacancy. required level domain is not defined yet (OPEN-013).';

create index if not exists job_skill_requirements_job_id_idx
  on public.job_skill_requirements (job_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.jobs enable row level security;
alter table public.job_skill_requirements enable row level security;

-- Published vacancies are readable by authenticated users (jobseekers, etc.).
drop policy if exists jobs_select_published on public.jobs;
create policy jobs_select_published on public.jobs
  for select to authenticated
  using (status = 'published');

-- Recruiters can read their own vacancies in any status.
drop policy if exists jobs_select_owner on public.jobs;
create policy jobs_select_owner on public.jobs
  for select to authenticated
  using (created_by = auth.uid());

-- Admin controlled read.
drop policy if exists jobs_select_admin on public.jobs;
create policy jobs_select_admin on public.jobs
  for select to authenticated
  using (public.is_admin());

-- Only active recruiters may insert; created_by must be the caller.
drop policy if exists jobs_insert_recruiter on public.jobs;
create policy jobs_insert_recruiter on public.jobs
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.current_app_role() = 'recruiter'
    and public.is_active_account()
  );

-- Skill criteria: readable when the parent job is visible to the caller.
drop policy if exists job_skill_requirements_select on public.job_skill_requirements;
create policy job_skill_requirements_select on public.job_skill_requirements
  for select to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_skill_requirements.job_id
        and (j.status = 'published' or j.created_by = auth.uid() or public.is_admin())
    )
  );

-- Skill criteria: only the recruiter who owns the job may insert.
drop policy if exists job_skill_requirements_insert on public.job_skill_requirements;
create policy job_skill_requirements_insert on public.job_skill_requirements
  for insert to authenticated
  with check (
    exists (
      select 1 from public.jobs j
      where j.id = job_skill_requirements.job_id
        and j.created_by = auth.uid()
    )
    and public.is_active_account()
  );

-- -----------------------------------------------------------------------------
-- Grants (defense in depth on top of RLS)
-- -----------------------------------------------------------------------------
revoke all on public.jobs from anon, authenticated;
grant select, insert on public.jobs to authenticated;

revoke all on public.job_skill_requirements from anon, authenticated;
grant select, insert on public.job_skill_requirements to authenticated;

-- -----------------------------------------------------------------------------
-- Atomic create + publish
-- SECURITY INVOKER: runs with the caller's privileges, so RLS applies.
-- -----------------------------------------------------------------------------
create or replace function public.create_job_with_skills(
  p_title text,
  p_description text,
  p_location text,
  p_employment_type text,
  p_skills text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job_id uuid;
  v_skill text;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;
  if not public.is_active_account() then
    raise exception 'inactive account' using errcode = '42501';
  end if;
  if public.current_app_role() <> 'recruiter' then
    raise exception 'only recruiters can create jobs' using errcode = '42501';
  end if;
  if p_skills is null or array_length(p_skills, 1) is null then
    raise exception 'at least one skill is required' using errcode = '22023';
  end if;

  insert into public.jobs (
    created_by, title, description, location, employment_type, status, published_at
  )
  values (
    auth.uid(),
    p_title,
    p_description,
    nullif(btrim(coalesce(p_location, '')), ''),
    nullif(btrim(coalesce(p_employment_type, '')), ''),
    'published',
    now()
  )
  returning id into v_job_id;

  foreach v_skill in array p_skills loop
    if btrim(coalesce(v_skill, '')) <> '' then
      insert into public.job_skill_requirements (job_id, skill_name)
      values (v_job_id, btrim(v_skill))
      on conflict (job_id, skill_name) do nothing;
    end if;
  end loop;

  return v_job_id;
end;
$$;

comment on function public.create_job_with_skills(text, text, text, text, text[]) is
  'Atomically create and publish a job with skill criteria for the authenticated recruiter. SECURITY INVOKER (RLS applies).';

revoke all on function public.create_job_with_skills(text, text, text, text, text[]) from public;
revoke all on function public.create_job_with_skills(text, text, text, text, text[]) from anon;
grant execute on function public.create_job_with_skills(text, text, text, text, text[]) to authenticated;
