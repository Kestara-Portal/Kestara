-- KP-35 follow-up: make the validated RPC the only authenticated write path.

revoke insert on public.jobs from anon, authenticated;
revoke insert on public.job_skill_requirements from anon, authenticated;

revoke select on public.jobs from anon, authenticated;
grant select (
  id,
  title,
  description,
  location,
  employment_type,
  status,
  published_at,
  created_at,
  updated_at
) on public.jobs to authenticated;

create or replace view public.published_jobs
with (security_invoker = true)
as
select
  id,
  title,
  description,
  location,
  employment_type,
  status,
  published_at,
  created_at,
  updated_at
from public.jobs
where status = 'published';

revoke all on public.published_jobs from public, anon, authenticated;
grant select on public.published_jobs to authenticated;

create or replace function public.create_job_with_skills(
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

  insert into public.jobs (
    created_by,
    title,
    description,
    location,
    employment_type,
    status,
    published_at
  )
  values (
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

comment on function public.create_job_with_skills(text, text, text, text, text[]) is
  'Atomically creates a published job and skills. SECURITY DEFINER with explicit active-recruiter checks; direct table inserts are revoked.';

revoke all on function public.create_job_with_skills(text, text, text, text, text[]) from public, anon;
grant execute on function public.create_job_with_skills(text, text, text, text, text[]) to authenticated;
