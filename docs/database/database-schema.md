# Kestara — Database Schema Blueprint

> **Status:** Draft / Proposed (E01 partially implemented locally)
> **Target:** Supabase PostgreSQL
> **Scope:** Initial entity inventory and schema conventions for all eight modules
> **Implementation status:** Supabase project confirmed by Project Owner. E01 tables (`users`, `user_skills`, `portfolio_items`), RLS, auth provisioning, and E01 storage policies are implemented as local SQL migrations in `supabase/migrations/`. Remote migrations have **not** been applied. Modules E02–E08 remain proposed.

## 1. How to Read This Blueprint

This document is a design proposal, not a record of existing database tables.

- **Confirmed project requirement** means the need was explicitly described in the Kestara PBI supplied by the owner.
- **Design proposal** means a suggested table, field, relationship, or constraint to support that requirement.
- **TBD** means the product owner/PM or original proposal must decide before implementation.

The original proposal ERD was not available in the current documentation review. Therefore, this blueprint must be reconciled against that ERD before it becomes final.

## 2. General PostgreSQL Conventions

| Concern | Proposed convention |
|---|---|
| Primary identifiers | UUID |
| Timestamps | `TIMESTAMPTZ`, stored in UTC |
| Primary key | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` except identity-linked profile ID |
| Identity profile ID | `public.users.id` references `auth.users.id` |
| Ownership | Explicit `user_id`, `created_by`, or role-specific FK |
| Text statuses | `TEXT` with CHECK constraints initially; use enum types only after status lifecycle is stable |
| Money | `NUMERIC`, never floating-point, if payment is later required |
| JSON | Use `JSONB` only for genuinely flexible attributes, not to avoid relational modeling |
| Indexes | Add indexes for FK columns and frequent filter/sort paths |
| Updates | Use a consistent `updated_at` trigger or application mechanism |
| Deletion | Prefer status/deactivation where history or references must remain |
| Migrations | Version-controlled SQL in `supabase/migrations/` |

Do not store passwords in application tables. Do not store service keys or other secrets in the database as ordinary profile attributes.

## 3. Identity and Profile Tables

### 3.1 `auth.users` — Supabase managed

Authentication identity and credential storage. Do not create this table manually or use application migrations to redefine Supabase-managed columns.

### 3.2 `public.users` — proposed

| Column | Proposed type | Notes |
|---|---|---|
| `id` | UUID PK/FK | References `auth.users.id` |
| `full_name` | TEXT | Required display name |
| `role` | TEXT | `jobseeker`, `mentor`, `recruiter`, `admin` |
| `account_status` | TEXT | Proposed: `active`, `suspended`, `deactivated` |
| `avatar_path` | TEXT | Storage path, optional |
| `phone_number` | TEXT | Optional; private |
| `bio` | TEXT | Optional |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

Email should be read from Auth unless a separately approved synchronization requirement exists. Do not accept role or account status from a user-editable profile update.

### 3.3 Role extension tables — proposed / TBD

- `public.jobseekers`
- `public.mentors`
- `public.recruiters`

Use one-to-one extension tables only if role-specific attributes need relational structure. Their exact fields must come from approved requirements. Do not create empty extension tables solely because they appeared in an early sketch.

### 3.4 Shared professional profile data

`public.user_skills` and `public.portfolio_items` are shared across Jobseeker, Mentor, and Recruiter.

#### `public.user_skills`

| Column | Proposed type | Required |
|---|---|---|
| `id` | UUID PK | Yes |
| `user_id` | UUID FK → `public.users.id` | Yes |
| `skill_name` | TEXT | Yes |
| `category` | TEXT | No |
| `proficiency_level` | TEXT | TBD |
| `description` | TEXT | No |
| `created_at` | TIMESTAMPTZ | Yes |
| `updated_at` | TIMESTAMPTZ | Yes |

Proposed business rule: the owner must have role `jobseeker`, `mentor`, or `recruiter`.

#### `public.portfolio_items`

| Column | Proposed type | Required |
|---|---|---|
| `id` | UUID PK | Yes |
| `user_id` | UUID FK → `public.users.id` | Yes |
| `title` | TEXT | Yes |
| `description` | TEXT | No |
| `project_url` | TEXT | No |
| `media_path` | TEXT | No |
| `start_date` | DATE | No |
| `end_date` | DATE | No |
| `created_at` | TIMESTAMPTZ | Yes |
| `updated_at` | TIMESTAMPTZ | Yes |

Validate URL formats and date rules at the application boundary and, where appropriate, with database constraints.

## 4. Company and Vacancy Tables

These are proposed entities supporting PBI-02 and PBI-04.

### `public.companies`

Proposed attributes: `id`, company name, description, website URL, address/location fields, logo Storage path, status, creator, timestamps. Exact columns and verification fields are TBD.

### `public.company_memberships`

Proposed relationship between `public.users` with Recruiter role and `public.companies`. Suggested attributes: `id`, `company_id`, `user_id`, membership role/status, created timestamp. Membership invitation and approval lifecycle are TBD.

This relationship is important: authorization must not assume every Recruiter can edit every company.

### `public.jobs`

Proposed attributes: `id`, `company_id`, `created_by`, title, description, qualification, location, employment type, publication status, publication/closing timestamps, created/updated timestamps. Exact fields and status lifecycle are TBD.

### `public.job_skill_requirements`

Proposed attributes: `id`, `job_id`, skill name or skill reference, required level, and optional importance. Matching weights are not defined and must not be invented.

## 5. Application and Blind Profile Tables

Support PBI-05.

### `public.applications`

Proposed attributes:
- `id`
- `job_id`
- `applicant_id`
- application status
- submitted timestamp
- updated timestamp

A uniqueness rule for `(job_id, applicant_id)` is recommended if duplicate applications are not allowed; confirm cancellation and reapplication policy first.

### `public.application_events`

Proposed history of status changes:
- `id`
- `application_id`
- actor ID
- previous status
- new status
- note, subject to privacy policy
- created timestamp

Blind Profile is not necessarily a separate base table. Prefer a controlled view/RPC/server use case that returns only an approved allowlist of candidate fields to an authorized recruiter. Do not expose identity fields and then hide them in frontend code.

The blind-profile allowlist, matching score, and identity reveal conditions are TBD.

## 6. Micro-Learning Tables

Support PBI-03.

### `public.learning_modules`

Proposed attributes: `id`, title, description, content type, content reference/URL, publication status, creator, timestamps.

### `public.learning_progress`

Proposed attributes: `id`, `user_id`, `learning_module_id`, progress state/percentage, started timestamp, completed timestamp, updated timestamp.

Confirm whether the learning module contains one item or multiple lessons before adding a separate lessons table.

## 7. Skill Assessment Tables

Support PBI-06.

| Proposed table | Purpose |
|---|---|
| `public.assessments` | Test definition/category |
| `public.assessment_questions` | Question bank |
| `public.assessment_options` | Multiple-choice options, if that question type is approved |
| `public.assessment_attempts` | User attempt and result |
| `public.assessment_answers` | Answers submitted during an attempt |
| `public.assessment_certificates` | Optional certificate/result record if required |

Important security rule: correct answers, scoring keys, and privileged question-bank fields must not be exposed to candidate clients. Return only question data required for the active attempt. Score calculation should happen in a trusted server/database path.

Question types, scoring rules, attempt limits, retakes, certificate issuance, and result visibility are TBD.

## 8. Mentorship Tables

Support PBI-07.

| Proposed table | Purpose |
|---|---|
| `public.mentor_availability` | Mentor's available time slots |
| `public.mentorship_sessions` | Request, approval, schedule, and session state |
| `public.mentorship_messages` | Optional messages tied to a session, if confirmed by requirements |

A session should reference the Jobseeker requester and Mentor. Define timezone handling, slot conflict prevention, cancellation, rescheduling, and message retention before implementation.

## 9. Community Forum Tables

Support PBI-08.

| Proposed table | Purpose |
|---|---|
| `public.forum_topics` | Discussion topic/thread |
| `public.forum_posts` | Topic content and replies; may use nullable `parent_post_id` for nested replies |

Define edit windows, moderation states, deletion behavior, and whether soft deletion is required.

## 10. Administrative Audit

### `public.admin_audit_logs` — proposed

Suggested fields:
- `id`
- `actor_user_id`
- action name
- target entity type and ID
- safe metadata
- created timestamp

Do not store passwords, tokens, private file contents, or unnecessary PII in audit metadata. Audit log insertions should be server-controlled. Ordinary users must not update or delete audit records.

## 11. Status Lifecycle — Provisional

Potential values are examples only and must be approved per module:

| Entity | Possible states |
|---|---|
| User account | `active`, `suspended`, `deactivated` |
| Job | `draft`, `published`, `closed` |
| Application | `submitted`, `screening`, `interview`, `accepted`, `rejected`, `cancelled` |
| Learning module | `draft`, `published`, `archived` |
| Mentorship session | `requested`, `approved`, `rejected`, `cancelled`, `completed` |
| Forum content | `published`, `hidden`, `removed` |

Do not reuse one generic status field or lifecycle across unrelated entities.

## 12. Constraints and Indexes to Consider

Final indexes must be based on query patterns, but review these candidates:

- `public.user_skills(user_id)`
- `public.portfolio_items(user_id)`
- `public.company_memberships(user_id, company_id)`
- `public.jobs(company_id, status)`
- `public.applications(job_id, status)`
- `public.applications(applicant_id, created_at)`
- `public.learning_progress(user_id, learning_module_id)` with a uniqueness rule if one progress row per user/module is intended
- `public.assessment_attempts(user_id, assessment_id)`
- `public.mentorship_sessions(mentor_id, scheduled_start)`
- `public.mentorship_sessions(jobseeker_id, scheduled_start)`
- `public.forum_posts(topic_id, created_at)`

Use unique constraints only after business rules are confirmed. Indexes do not replace RLS.

## 13. Hard Deletion and Referential Integrity

Default account action is deactivation, not immediate physical deletion.

Before hard deletion:
- Determine academic, legal, and product retention requirements.
- Identify dependent applications, assessment results, mentorship history, and forum content.
- Decide anonymization versus deletion.
- Preserve required audit history without retaining unnecessary personal data.
- Implement a reviewed server-side purge workflow.
- Test foreign-key behavior.

Do not add broad `ON DELETE CASCADE` rules that could silently erase important history.

## 14. Approval Checklist

- [ ] Compare entities with the original proposal ERD.
- [ ] Confirm role-specific profile fields.
- [ ] Approve `public.users` and Auth identity relationship.
- [ ] Approve shared `user_skills` and `portfolio_items`.
- [ ] Approve company membership and recruiter ownership model.
- [ ] Approve job and application lifecycles.
- [ ] Approve Blind Profile field allowlist.
- [ ] Approve learning progress model.
- [ ] Approve assessment question/answer security.
- [ ] Approve mentorship booking and messaging model.
- [ ] Approve forum moderation and deletion model.
- [ ] Approve audit and account retention policy.
- [ ] Approve naming, constraints, indexes, and migration order.

---

**Status:** Draft. This document is a proposed data dictionary. It must be reconciled with the original Kestara proposal/ERD and approved before SQL migrations are generated.
