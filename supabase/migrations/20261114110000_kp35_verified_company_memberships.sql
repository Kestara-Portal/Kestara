-- KP-35: recruiter job creation requires a verified company membership.
-- Existing jobs retain NULL company_id until an approved legacy-assignment
-- process is defined; no membership or company is inferred for historical rows.

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null
    constraint companies_name_valid check (char_length(btrim(name)) between 2 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

create table public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null
    references public.companies (id) on delete restrict,
  user_id uuid not null
    references public.users (id) on delete restrict,
  membership_status text not null default 'pending'
    constraint company_memberships_status_valid
      check (membership_status in ('pending', 'verified', 'revoked')),
  verified_by uuid references public.users (id) on delete restrict,
  verified_at timestamptz,
  revoked_by uuid references public.users (id) on delete restrict,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_memberships_company_user_unique unique (company_id, user_id),
  constraint company_memberships_not_self_verified
    check (verified_by is distinct from user_id),
  constraint company_memberships_audit_consistent check (
    (
      membership_status = 'pending'
      and verified_by is null
      and verified_at is null
      and revoked_by is null
      and revoked_at is null
    )
    or (
      membership_status = 'verified'
      and verified_by is not null
      and verified_at is not null
      and revoked_by is null
      and revoked_at is null
    )
    or (
      membership_status = 'revoked'
      and revoked_by is not null
      and revoked_at is not null
      and ((verified_by is null and verified_at is null)
        or (verified_by is not null and verified_at is not null))
    )
  )
);

create index company_memberships_user_status_idx
  on public.company_memberships (user_id, membership_status);
create index company_memberships_company_status_idx
  on public.company_memberships (company_id, membership_status);

create trigger company_memberships_set_updated_at
before update on public.company_memberships
for each row execute function public.set_updated_at();

alter table public.jobs
  add column company_id uuid
    references public.companies (id) on delete restrict;

create index jobs_company_id_idx on public.jobs (company_id);

comment on column public.jobs.company_id is
  'Company for jobs created after KP-35 membership enforcement. NULL is retained only for legacy jobs pending an approved assignment policy.';

create function public.enforce_job_company_on_new_rows()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.company_id is null then
    raise exception 'company_id is required for new jobs' using errcode = '23502';
  end if;

  if tg_op = 'UPDATE' and old.company_id is not null and new.company_id is null then
    raise exception 'company_id cannot be removed from a job' using errcode = '23502';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_job_company_on_new_rows() from public, anon, authenticated;

create trigger jobs_require_company
before insert or update of company_id on public.jobs
for each row execute function public.enforce_job_company_on_new_rows();

alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;

create policy companies_select_verified_member
on public.companies
for select to authenticated
using (
  public.current_app_role() = 'recruiter'
  and public.is_active_account()
  and exists (
    select 1
    from public.company_memberships m
    where m.company_id = companies.id
      and m.user_id = auth.uid()
      and m.membership_status = 'verified'
  )
);

create policy company_memberships_select_own
on public.company_memberships
for select to authenticated
using (
  user_id = auth.uid()
  and public.current_app_role() = 'recruiter'
  and public.is_active_account()
);

revoke all on public.companies from public, anon, authenticated;
grant select (id, name) on public.companies to authenticated;

revoke all on public.company_memberships from public, anon, authenticated;
grant select (
  id,
  company_id,
  user_id,
  membership_status,
  created_at,
  updated_at,
  verified_at,
  revoked_at
) on public.company_memberships to authenticated;

create function public.admin_verify_company_membership(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = on
as $$
declare
  v_membership public.company_memberships%rowtype;
begin
  if auth.uid() is null
    or not public.is_active_account()
    or not public.is_admin()
  then
    raise exception 'only active admins may verify company memberships'
      using errcode = '42501';
  end if;

  select *
  into v_membership
  from public.company_memberships
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'company membership not found' using errcode = 'P0002';
  end if;
  if v_membership.user_id = auth.uid() then
    raise exception 'an admin cannot verify their own membership'
      using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.users u
    where u.id = v_membership.user_id
      and u.role = 'recruiter'
  ) then
    raise exception 'membership owner must be a recruiter'
      using errcode = '22023';
  end if;
  if v_membership.membership_status = 'verified' then
    raise exception 'company membership is already verified'
      using errcode = '22023';
  end if;

  update public.company_memberships
  set membership_status = 'verified',
      verified_by = auth.uid(),
      verified_at = now(),
      revoked_by = null,
      revoked_at = null,
      updated_at = now()
  where id = p_membership_id;
end;
$$;

create function public.admin_revoke_company_membership(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = on
as $$
declare
  v_membership public.company_memberships%rowtype;
begin
  if auth.uid() is null
    or not public.is_active_account()
    or not public.is_admin()
  then
    raise exception 'only active admins may revoke company memberships'
      using errcode = '42501';
  end if;

  select *
  into v_membership
  from public.company_memberships
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'company membership not found' using errcode = 'P0002';
  end if;
  if v_membership.user_id = auth.uid() then
    raise exception 'an admin cannot revoke their own membership'
      using errcode = '42501';
  end if;
  if v_membership.membership_status = 'revoked' then
    raise exception 'company membership is already revoked'
      using errcode = '22023';
  end if;

  update public.company_memberships
  set membership_status = 'revoked',
      revoked_by = auth.uid(),
      revoked_at = now(),
      updated_at = now()
  where id = p_membership_id;
end;
$$;

revoke all on function public.admin_verify_company_membership(uuid) from public, anon;
revoke all on function public.admin_revoke_company_membership(uuid) from public, anon;
grant execute on function public.admin_verify_company_membership(uuid) to authenticated;
grant execute on function public.admin_revoke_company_membership(uuid) to authenticated;

revoke all on function public.create_job_with_skills(text, text, text, text, text[])
  from public, anon, authenticated;
drop function public.create_job_with_skills(text, text, text, text, text[]);

create function public.create_job_with_skills(
  p_company_id uuid,
  p_title text,
  p_description text,
  p_location text,
  p_employment_type text,
  p_skills text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
set row_security = on
as $$
declare
  v_job_id uuid;
  v_skill text;
  v_normalized_skill text;
  v_seen_skills text[] := array[]::text[];
  v_membership_id uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;
  if not public.is_active_account() then
    raise exception 'inactive account' using errcode = '42501';
  end if;
  if public.current_app_role() is distinct from 'recruiter' then
    raise exception 'only recruiters can create jobs' using errcode = '42501';
  end if;
  if p_company_id is null then
    raise exception 'company is required' using errcode = '22023';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 3 and 150 then
    raise exception 'invalid job title' using errcode = '22023';
  end if;
  if p_description is null or char_length(btrim(p_description)) not between 20 and 5000 then
    raise exception 'invalid job description' using errcode = '22023';
  end if;
  if p_location is null or char_length(btrim(p_location)) not between 2 and 120 then
    raise exception 'invalid job location' using errcode = '22023';
  end if;
  if p_employment_type is not null and char_length(btrim(p_employment_type)) > 60 then
    raise exception 'invalid employment type' using errcode = '22023';
  end if;
  if p_skills is null or cardinality(p_skills) not between 1 and 30 then
    raise exception 'one to thirty skills are required' using errcode = '22023';
  end if;

  select m.id
  into v_membership_id
  from public.company_memberships m
  where m.company_id = p_company_id
    and m.user_id = auth.uid()
    and m.membership_status = 'verified'
  for share;

  if v_membership_id is null then
    raise exception 'verified company membership required'
      using errcode = '42501';
  end if;

  insert into public.jobs (
    company_id,
    created_by,
    title,
    description,
    location,
    employment_type,
    status,
    published_at
  )
  values (
    p_company_id,
    auth.uid(),
    btrim(p_title),
    btrim(p_description),
    btrim(p_location),
    nullif(btrim(coalesce(p_employment_type, '')), ''),
    'published',
    now()
  )
  returning id into v_job_id;

  foreach v_skill in array p_skills loop
    v_skill := btrim(coalesce(v_skill, ''));
    if v_skill = '' or char_length(v_skill) > 100 then
      raise exception 'invalid skill name' using errcode = '22023';
    end if;

    v_normalized_skill := lower(v_skill);
    if v_normalized_skill = any(v_seen_skills) then
      continue;
    end if;

    v_seen_skills := array_append(v_seen_skills, v_normalized_skill);
    insert into public.job_skill_requirements (job_id, skill_name)
    values (v_job_id, v_skill);
  end loop;

  return v_job_id;
end;
$$;

comment on function public.create_job_with_skills(uuid, text, text, text, text, text[]) is
  'Atomically creates a published job and skills for an active recruiter with a verified membership in the selected company.';

revoke all on function public.create_job_with_skills(uuid, text, text, text, text, text[])
  from public, anon;
grant execute on function public.create_job_with_skills(uuid, text, text, text, text, text[])
  to authenticated;
