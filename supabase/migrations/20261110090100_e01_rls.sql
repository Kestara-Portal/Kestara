-- =============================================================================
-- Kestara — E01 Row Level Security & Privileges
-- Migration: 20261110090100_e01_rls
--
-- Least-privilege access control for the E01 tables.
--
-- Summary:
--   * public.users: a user reads/updates only their own row (safe columns only).
--     Admin gets controlled, read-only listing through RLS + a controlled RPC.
--     No direct INSERT/DELETE for normal users; profiles are provisioned by trigger.
--   * public.user_skills / public.portfolio_items: owner-only CRUD, restricted to
--     the three public roles (jobseeker, mentor, recruiter). Admin gets no blanket access.
--   * Column-level UPDATE privileges prevent users from changing role/account_status.
--
-- SECURITY DEFINER helpers use a fixed empty search_path, fully-qualified names,
-- and restricted EXECUTE grants to avoid privilege escalation and RLS recursion.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions
-- -----------------------------------------------------------------------------
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.role
  from public.users u
  where u.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

create or replace function public.can_manage_professional_data()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('jobseeker', 'mentor', 'recruiter'), false);
$$;

comment on function public.current_app_role() is
  'Returns the caller role from public.users. SECURITY DEFINER to avoid RLS recursion.';
comment on function public.is_admin() is
  'True when the caller has the admin role.';
comment on function public.can_manage_professional_data() is
  'True for jobseeker/mentor/recruiter. Admin is excluded by product decision.';

revoke all on function public.current_app_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.can_manage_professional_data() from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_manage_professional_data() to authenticated;

-- Controlled administrative account-status update (server/RPC path).
-- Admin may change account_status only; role is never changed here.
create or replace function public.admin_set_account_status(target_user_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if new_status not in ('active', 'suspended', 'deactivated') then
    raise exception 'invalid account status' using errcode = '22023';
  end if;

  update public.users
  set account_status = new_status
  where id = target_user_id;

  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_account_status(uuid, text) from public;
grant execute on function public.admin_set_account_status(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.user_skills enable row level security;
alter table public.portfolio_items enable row level security;

-- -----------------------------------------------------------------------------
-- public.users policies
-- -----------------------------------------------------------------------------
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select to authenticated
  using (id = auth.uid());

drop policy if exists users_select_admin on public.users;
create policy users_select_admin on public.users
  for select to authenticated
  using (public.is_admin());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No INSERT policy: profile rows are created by the auth provisioning trigger.
-- No DELETE policy: account removal is a controlled server/admin operation.

-- -----------------------------------------------------------------------------
-- public.user_skills policies
-- -----------------------------------------------------------------------------
drop policy if exists user_skills_select_own on public.user_skills;
create policy user_skills_select_own on public.user_skills
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_skills_insert_own on public.user_skills;
create policy user_skills_insert_own on public.user_skills
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_manage_professional_data());

drop policy if exists user_skills_update_own on public.user_skills;
create policy user_skills_update_own on public.user_skills
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_manage_professional_data());

drop policy if exists user_skills_delete_own on public.user_skills;
create policy user_skills_delete_own on public.user_skills
  for delete to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- public.portfolio_items policies
-- -----------------------------------------------------------------------------
drop policy if exists portfolio_select_own on public.portfolio_items;
create policy portfolio_select_own on public.portfolio_items
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists portfolio_insert_own on public.portfolio_items;
create policy portfolio_insert_own on public.portfolio_items
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_manage_professional_data());

drop policy if exists portfolio_update_own on public.portfolio_items;
create policy portfolio_update_own on public.portfolio_items
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_manage_professional_data());

drop policy if exists portfolio_delete_own on public.portfolio_items;
create policy portfolio_delete_own on public.portfolio_items
  for delete to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Table / column privileges (defense in depth on top of RLS)
-- -----------------------------------------------------------------------------
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;
-- Only safe, user-editable profile columns. role & account_status are excluded.
grant update (full_name, bio, phone_number, avatar_path) on public.users to authenticated;

revoke all on public.user_skills from anon, authenticated;
grant select, insert, update, delete on public.user_skills to authenticated;

revoke all on public.portfolio_items from anon, authenticated;
grant select, insert, update, delete on public.portfolio_items to authenticated;
