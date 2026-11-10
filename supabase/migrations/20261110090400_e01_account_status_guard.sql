-- =============================================================================
-- Kestara — Active-account guard for protected mutations
-- Migration: 20261110090400_e01_account_status_guard
--
-- The RLS blueprint requires that deactivated/suspended accounts cannot perform
-- protected mutations or uploads. This adds an `is_active_account()` helper and
-- tightens the relevant policies. SELECT of a user's own row remains allowed so
-- the app can render a deactivated notice.
-- =============================================================================

create or replace function public.is_active_account()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.account_status = 'active' from public.users u where u.id = auth.uid()),
    false
  );
$$;

comment on function public.is_active_account() is
  'True when the caller exists and account_status is active. Used to block mutations for deactivated/suspended accounts.';

revoke all on function public.is_active_account() from public;
grant execute on function public.is_active_account() to authenticated;

-- -----------------------------------------------------------------------------
-- public.users: only active users may update their own row
-- -----------------------------------------------------------------------------
drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated
  using (id = auth.uid() and public.is_active_account())
  with check (id = auth.uid() and public.is_active_account());

-- -----------------------------------------------------------------------------
-- public.user_skills: active owner only
-- -----------------------------------------------------------------------------
drop policy if exists user_skills_insert_own on public.user_skills;
create policy user_skills_insert_own on public.user_skills
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_manage_professional_data() and public.is_active_account());

drop policy if exists user_skills_update_own on public.user_skills;
create policy user_skills_update_own on public.user_skills
  for update to authenticated
  using (user_id = auth.uid() and public.is_active_account())
  with check (user_id = auth.uid() and public.can_manage_professional_data() and public.is_active_account());

drop policy if exists user_skills_delete_own on public.user_skills;
create policy user_skills_delete_own on public.user_skills
  for delete to authenticated
  using (user_id = auth.uid() and public.is_active_account());

-- -----------------------------------------------------------------------------
-- public.portfolio_items: active owner only
-- -----------------------------------------------------------------------------
drop policy if exists portfolio_insert_own on public.portfolio_items;
create policy portfolio_insert_own on public.portfolio_items
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_manage_professional_data() and public.is_active_account());

drop policy if exists portfolio_update_own on public.portfolio_items;
create policy portfolio_update_own on public.portfolio_items
  for update to authenticated
  using (user_id = auth.uid() and public.is_active_account())
  with check (user_id = auth.uid() and public.can_manage_professional_data() and public.is_active_account());

drop policy if exists portfolio_delete_own on public.portfolio_items;
create policy portfolio_delete_own on public.portfolio_items
  for delete to authenticated
  using (user_id = auth.uid() and public.is_active_account());

-- -----------------------------------------------------------------------------
-- Storage: active owner only for writes (upload/replace/delete)
-- -----------------------------------------------------------------------------
drop policy if exists profile_avatars_insert_own on storage.objects;
create policy profile_avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_active_account());

drop policy if exists profile_avatars_update_own on storage.objects;
create policy profile_avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_account())
  with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_account());

drop policy if exists profile_avatars_delete_own on storage.objects;
create policy profile_avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_account());

drop policy if exists portfolio_files_insert_own on storage.objects;
create policy portfolio_files_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-files'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_active_account());

drop policy if exists portfolio_files_update_own on storage.objects;
create policy portfolio_files_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-files' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_account())
  with check (bucket_id = 'portfolio-files' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_account());

drop policy if exists portfolio_files_delete_own on storage.objects;
create policy portfolio_files_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-files' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_account());
