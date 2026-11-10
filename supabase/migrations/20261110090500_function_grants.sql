-- =============================================================================
-- Kestara — Restrict EXECUTE on helper/trigger functions
-- Migration: 20261110090500_function_grants
--
-- Supabase default privileges may grant EXECUTE on new functions to `anon` and
-- `authenticated` directly (not via PUBLIC). Explicitly revoke unnecessary
-- access so only the roles that need each function can execute it.
-- =============================================================================

-- RLS helpers: authenticated only (anon has no business calling them).
revoke all on function public.current_app_role() from anon;
revoke all on function public.is_admin() from anon;
revoke all on function public.can_manage_professional_data() from anon;
revoke all on function public.is_active_account() from anon;

-- Administrative RPC: authenticated callers are additionally checked inside the
-- function (is_admin()), but anon must not even reach it.
revoke all on function public.admin_set_account_status(uuid, text) from anon;

-- Trigger-only helpers: not callable by ordinary API roles.
revoke all on function public.handle_new_user() from anon, authenticated;
revoke all on function public.set_updated_at() from anon, authenticated;

-- Keep explicit grants required by RLS for authenticated users.
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_manage_professional_data() to authenticated;
grant execute on function public.is_active_account() to authenticated;
grant execute on function public.admin_set_account_status(uuid, text) to authenticated;
