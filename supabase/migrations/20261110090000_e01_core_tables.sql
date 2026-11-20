-- =============================================================================
-- Kestara — E01 Core Tables (Account & Profile)
-- Migration: 20261110090000_e01_core_tables
--
-- Implements the reviewed E01 data model:
--   public.users            (1:1 with auth.users)
--   public.user_skills      (shared skills matrix, 3 public roles)
--   public.portfolio_items  (shared portfolio, 3 public roles)
--
-- Design decisions are recorded in docs/decisions/decision-log.md.
-- No credentials are stored here; passwords and email live in auth.users.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Shared updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

-- -----------------------------------------------------------------------------
-- public.users
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text not null check (length(btrim(full_name)) > 0),
  role           text not null check (role in ('jobseeker', 'mentor', 'recruiter', 'admin')),
  account_status text not null default 'active'
                   check (account_status in ('active', 'suspended', 'deactivated')),
  avatar_path    text,
  phone_number   text,
  bio            text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.users is
  'Application profile and role record, 1:1 with auth.users. No password/email stored here.';
comment on column public.users.role is
  'Canonical role: jobseeker | mentor | recruiter | admin. Never user-editable.';

create index if not exists users_role_idx on public.users (role);
create index if not exists users_created_at_idx on public.users (created_at);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- public.user_skills
-- -----------------------------------------------------------------------------
create table if not exists public.user_skills (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users (id) on delete cascade,
  skill_name        text not null check (length(btrim(skill_name)) > 0),
  category          text,
  proficiency_level text,
  description       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.user_skills is
  'Shared skills matrix for jobseeker, mentor, and recruiter. Admin does not maintain skills.';

create index if not exists user_skills_user_id_idx on public.user_skills (user_id);

drop trigger if exists user_skills_set_updated_at on public.user_skills;
create trigger user_skills_set_updated_at
before update on public.user_skills
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- public.portfolio_items
-- -----------------------------------------------------------------------------
create table if not exists public.portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  title        text not null check (length(btrim(title)) > 0),
  description  text,
  project_url  text,
  media_path   text,
  start_date   date,
  end_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint portfolio_items_date_order
    check (end_date is null or start_date is null or end_date >= start_date)
);

comment on table public.portfolio_items is
  'Shared portfolio for jobseeker, mentor, and recruiter. Admin does not maintain a portfolio.';

create index if not exists portfolio_items_user_id_idx on public.portfolio_items (user_id);
create index if not exists portfolio_items_user_start_idx on public.portfolio_items (user_id, start_date);

drop trigger if exists portfolio_items_set_updated_at on public.portfolio_items;
create trigger portfolio_items_set_updated_at
before update on public.portfolio_items
for each row execute function public.set_updated_at();
