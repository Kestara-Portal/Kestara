-- =============================================================================
-- Kestara — Development Seed (safe, idempotent, synthetic only)
-- =============================================================================
-- This seed intentionally does NOT insert authentication identities directly.
-- Supabase Auth users must be created through Auth (admin API / sign-up) so that
-- password hashing, identities, and the on_auth_user_created provisioning trigger
-- all run correctly.
--
-- Synthetic test users are created with:
--   npm run seed:users
-- which uses the server-only SUPABASE_SECRET_KEY (never commit it).
--
-- Do not place real candidate data, CVs, phone numbers, or other PII here.
-- =============================================================================

select 1;
