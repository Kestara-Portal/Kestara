-- =============================================================================
-- Kestara — KP-54: tabel lamaran (applications)
-- Migration: 20261121100000_kp54_applications
--
-- Kebijakan PM:
--   * Satu pelamar BOLEH melamar lowongan yang sama lebih dari sekali, jadi
--     sengaja TIDAK ada constraint unik (job_id, applicant_id).
--   * Belum ada pembatalan atau lamar ulang (pelamar hanya bisa kirim dan baca).
--   * Hanya lowongan berstatus 'published' yang bisa dilamar.
-- =============================================================================

create table if not exists public.applications (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.jobs (id) on delete restrict,
  applicant_id uuid not null references public.users (id) on delete cascade,
  status       text not null default 'submitted',
  submitted_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.applications is
  'Lamaran pekerjaan. Pelamar hanya membuat dan membaca lamarannya sendiri.';
comment on column public.applications.job_id is
  'on delete restrict: lowongan yang sudah punya lamaran tidak bisa dihapus permanen (gunakan arsip).';

create index if not exists applications_job_id_idx
  on public.applications (job_id);
create index if not exists applications_applicant_idx
  on public.applications (applicant_id, submitted_at desc);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.applications enable row level security;

drop policy if exists applications_select_own on public.applications;
create policy applications_select_own on public.applications
  for select to authenticated
  using (applicant_id = auth.uid());

drop policy if exists applications_insert_own on public.applications;
create policy applications_insert_own on public.applications
  for insert to authenticated
  with check (
    applicant_id = auth.uid()
    and public.current_app_role() = 'jobseeker'
    and public.is_active_account()
    and exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and j.status = 'published'
    )
  );

-- Tidak ada policy update/delete: pelamar tidak bisa mengubah atau menarik
-- lamaran (belum ada kebijakan pembatalan).

revoke all on public.applications from anon, authenticated;
grant select, insert on public.applications to authenticated;