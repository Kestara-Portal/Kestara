-- =============================================================================
-- Fix schema & column-grant gaps caused by merging parallel feature migrations:
--   1. Ensure public.applications has created_at (KP-54 created submitted_at;
--      E05/KP-63 query created_at).
--   2. Ensure authenticated can select jobs.company_id for PostgREST joins
--      such as jobs ( id, title, companies ( name ) ).
-- =============================================================================

alter table public.applications
  add column if not exists created_at timestamptz not null default now();

update public.applications
set created_at = submitted_at
where created_at is null and submitted_at is not null;

grant select (company_id) on public.jobs to authenticated;
