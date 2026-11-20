-- =============================================================================
-- Kestara — Auth Profile Provisioning
-- Migration: 20261110090200_auth_profile_provisioning
--
-- Creates exactly one public.users row for every new auth.users identity.
--
-- Security notes:
--   * SECURITY DEFINER with a fixed empty search_path and fully-qualified names.
--   * The role is taken from raw_user_meta_data ONLY when it is one of the three
--     public roles. "admin" can never be granted through public registration.
--   * Idempotent: ON CONFLICT (id) DO NOTHING prevents duplicate profiles and
--     supports re-running/backfill safely.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  safe_role text;
  safe_full_name text;
begin
  requested_role := new.raw_user_meta_data ->> 'role';

  if requested_role in ('jobseeker', 'mentor', 'recruiter') then
    safe_role := requested_role;
  else
    -- Default for unrecognized or privileged roles (e.g. admin). Never escalate.
    safe_role := 'jobseeker';
  end if;

  safe_full_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  if safe_full_name is null then
    safe_full_name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;
  if safe_full_name is null then
    safe_full_name := 'Pengguna Kestara';
  end if;

  insert into public.users (id, full_name, role)
  values (new.id, safe_full_name, safe_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Provisions public.users from auth.users. Only public roles accepted; admin is never granted here.';

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
