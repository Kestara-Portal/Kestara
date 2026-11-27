-- =============================================================================
-- Kestara — E05 Core Tables (Applications, Events & Notifications)
-- Migration: 20261122110000_e05_applications_and_notifications
--
-- Mendukung modul E05 (Kelola Lamaran Pekerjaan) & subtask KP-60, KP-61, KP-62:
--   1. public.applications (Lamaran pelamar ke lowongan pekerjaan)
--   2. public.application_events (Riwayat perubahan status lamaran)
--   3. public.notifications (Sistem trigger notifikasi ke akun Pencari Kerja)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- public.applications
-- -----------------------------------------------------------------------------
create table if not exists public.applications (
  id             uuid primary key default gen_random_uuid(),
  job_id         uuid not null references public.jobs (id) on delete cascade,
  applicant_id   uuid not null references public.users (id) on delete cascade,
  status         text not null default 'submitted'
                   check (status in ('submitted', 'screening', 'interview', 'assessment', 'accepted', 'rejected', 'cancelled')),
  cover_letter   text,
  resume_path    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint applications_job_applicant_unique unique (job_id, applicant_id)
);

alter table public.applications
  add column if not exists cover_letter text,
  add column if not exists resume_path text;

comment on table public.applications is
  'Lamaran pekerjaan pelamar untuk suatu lowongan.';
comment on column public.applications.status is
  'submitted (Pendaftaran Masuk) | screening (Seleksi Berkas) | interview (Wawancara) | assessment (Tes Keahlian) | accepted (Diterima) | rejected (Ditolak) | cancelled (Dibatalkan)';

create index if not exists applications_job_id_idx on public.applications (job_id);
create index if not exists applications_applicant_id_idx on public.applications (applicant_id);
create index if not exists applications_status_idx on public.applications (status);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- public.application_events (Riwayat Audit Perubahan Status - KP-61)
-- -----------------------------------------------------------------------------
create table if not exists public.application_events (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  actor_id        uuid references public.users (id) on delete set null,
  previous_status text,
  new_status      text not null,
  note            text,
  created_at      timestamptz not null default now()
);

comment on table public.application_events is
  'Audit trail log perubahan status lamaran oleh rekruter / sistem.';

create index if not exists application_events_app_id_idx on public.application_events (application_id);

-- -----------------------------------------------------------------------------
-- public.notifications (Sistem Trigger Notifikasi - KP-62)
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  title         text not null check (length(btrim(title)) > 0),
  message       text not null check (length(btrim(message)) > 0),
  type          text not null default 'application_status',
  is_read       boolean not null default false,
  reference_id  uuid,
  created_at    timestamptz not null default now()
);

comment on table public.notifications is
  'Notifikasi otomatis untuk pencari kerja saat status lamaran berubah (KP-62).';

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_is_read_idx on public.notifications (is_read);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.notifications enable row level security;

-- Admin: Full access
drop policy if exists applications_admin_all on public.applications;
create policy applications_admin_all on public.applications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Recruiter & Jobseeker: Scoped SELECT
drop policy if exists applications_select_scoped on public.applications;
create policy applications_select_scoped on public.applications
  for select to authenticated
  using (
    applicant_id = auth.uid() or
    public.current_app_role() in ('recruiter', 'admin')
  );

-- Recruiter: UPDATE status (KP-61)
drop policy if exists applications_update_recruiter on public.applications;
create policy applications_update_recruiter on public.applications
  for update to authenticated
  using (public.current_app_role() in ('recruiter', 'admin'))
  with check (public.current_app_role() in ('recruiter', 'admin'));

-- Notifications: User reads their own notifications
drop policy if exists notifications_user_own on public.notifications;
create policy notifications_user_own on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_user_update on public.notifications;
create policy notifications_user_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Grants
grant select on public.applications to authenticated;
grant insert, update on public.applications to authenticated;

grant select on public.application_events to authenticated;
grant insert on public.application_events to authenticated;

grant select, update on public.notifications to authenticated;
grant insert on public.notifications to authenticated;

