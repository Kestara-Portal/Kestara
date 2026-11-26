-- =============================================================================
-- Kestara — E05-D: Job Application Withdrawal (KP-63)
-- Migration: 20261122120000_kp63_application_withdrawal.sql
--
-- Menambahkan kapabilitas pembatalan/penarikan lamaran oleh pelamar (KP-63)
-- ke tabel public.applications yang selaras dengan modul E05 (KP-54, KP-60).
--
-- Ringkasan:
--   * Menggunakan tabel public.applications (job_id, applicant_id).
--   * Penarikan lamaran adalah transisi status ke 'withdrawn' (bukan delete baris)
--     agar histori dan jejak audit rekrutmen tetap terjaga.
--   * Menambahkan kolom opsional withdrawal_reason (maks. 500 karakter).
--   * RLS: Pelamar hanya dapat menarik lamarannya sendiri (applicant_id = auth.uid())
--     dengan WITH CHECK memaksa status menjadi 'withdrawn'.
-- =============================================================================

-- Pastikan tabel public.applications ada
create table if not exists public.applications (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.jobs (id) on delete cascade,
  applicant_id uuid not null references public.users (id) on delete cascade,
  status       text not null default 'submitted',
  cover_letter text,
  resume_path  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Tambahkan kolom withdrawal_reason jika belum ada
alter table public.applications
  add column if not exists withdrawal_reason text;

-- Tambahkan constraint panjang withdrawal_reason jika belum ada
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applications_withdrawal_reason_length'
  ) then
    alter table public.applications
      add constraint applications_withdrawal_reason_length
      check (withdrawal_reason is null or length(withdrawal_reason) <= 500);
  end if;
end;
$$;

comment on table public.applications is
  'Lamaran pekerjaan pelamar untuk suatu lowongan.';
comment on column public.applications.withdrawal_reason is
  'Alasan opsional saat pelamar menarik lamaran (maks. 500 karakter).';

create index if not exists applications_job_id_idx on public.applications (job_id);
create index if not exists applications_applicant_id_idx on public.applications (applicant_id);
create index if not exists applications_status_idx on public.applications (status);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.applications enable row level security;

-- Pelamar: membaca lamaran miliknya sendiri
drop policy if exists applications_select_own on public.applications;
create policy applications_select_own on public.applications
  for select to authenticated
  using (applicant_id = auth.uid());

-- Pelamar: menarik lamaran miliknya sendiri (status beralih ke 'withdrawn')
drop policy if exists applications_withdraw_own on public.applications;
create policy applications_withdraw_own on public.applications
  for update to authenticated
  using (applicant_id = auth.uid() and public.is_active_account())
  with check (
    applicant_id = auth.uid()
    and public.is_active_account()
    and status in ('withdrawn', 'cancelled')
  );

-- Grants
grant select on public.applications to authenticated;
grant update (status, withdrawal_reason) on public.applications to authenticated;
