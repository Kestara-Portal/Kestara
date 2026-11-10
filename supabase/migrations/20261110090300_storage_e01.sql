-- =============================================================================
-- Kestara — E01 Storage Foundation
-- Migration: 20261110090300_storage_e01
--
-- Private-by-default buckets for E01 (avatar + portfolio media).
-- Object ownership is derived from auth.uid() via the first path segment:
--   profile-avatars/{user_id}/{file_id}.{ext}
--   portfolio-files/{user_id}/{file_id}.{ext}
--
-- Application documents / CV buckets are intentionally NOT created here; they
-- belong to the E05 (application + blind profile) module and require separate
-- privacy review before use.
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('profile-avatars', 'profile-avatars', false),
  ('portfolio-files', 'portfolio-files', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- profile-avatars policies (owner-only)
-- -----------------------------------------------------------------------------
drop policy if exists profile_avatars_select_own on storage.objects;
create policy profile_avatars_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists profile_avatars_insert_own on storage.objects;
create policy profile_avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists profile_avatars_update_own on storage.objects;
create policy profile_avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists profile_avatars_delete_own on storage.objects;
create policy profile_avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- -----------------------------------------------------------------------------
-- portfolio-files policies (owner-only)
-- -----------------------------------------------------------------------------
drop policy if exists portfolio_files_select_own on storage.objects;
create policy portfolio_files_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'portfolio-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists portfolio_files_insert_own on storage.objects;
create policy portfolio_files_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists portfolio_files_update_own on storage.objects;
create policy portfolio_files_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'portfolio-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists portfolio_files_delete_own on storage.objects;
create policy portfolio_files_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-files' and (storage.foldername(name))[1] = auth.uid()::text);
