# Kestara — Decision Log

> **Status:** Draft record of decisions explicitly supplied in the project conversation. Add Jira/meeting reference and approver when available.

| ID | Decision | Current record | Status / notes |
|---|---|---|---|
| DEC-001 | Product name | Kestara | Recorded |
| DEC-002 | Architecture style | Three-Tier Architecture: Presentation, Application, Data | Based on project report context described by owner; verify exact report wording |
| DEC-003 | Backend platform | Supabase | Selected by team |
| DEC-004 | Supabase project status | `not_created` | Historical at time of record; superseded by DEC-017 |
| DEC-005 | Migration strategy | Full migration | Selected by owner |
| DEC-006 | Roles | Jobseeker, Mentor, Recruiter, Admin | Recorded |
| DEC-007 | Public registration | Jobseeker, Mentor, Recruiter; Admin controlled provisioning | Recorded design decision |
| DEC-008 | Skills Matrix applicability | Jobseeker, Mentor, Recruiter (`all` among public roles) | Explicitly confirmed by owner |
| DEC-009 | Portfolio applicability | Jobseeker, Mentor, Recruiter (`all` among public roles) | Explicitly confirmed by owner |
| DEC-010 | Primary visual direction | Green Teal | Explicitly requested |
| DEC-011 | Primary color draft | `#176B62` | Used in documentation; confirm with approved UI design |
| DEC-012 | Jira decomposition | One module = one Epic; Create/Read/Update/Delete each separate PBI/User Story | Based on lecturer clarification supplied by owner |
| DEC-013 | Jira board | Existing board; 8+ members; roles assigned | Exact member names/assignments remain in Jira |
| DEC-014 | GitHub push freeze | Temporary push freeze during repository cleanup | Lifted by Project Owner on 2026-11-07; normal branch-based workflow is permitted |
| DEC-015 | AI workflow | ChatGPT as context/review support; DeepSeek as coder | Working arrangement supplied by owner |
| DEC-016 | Repository connection | Owner does not want to connect GitHub account to ChatGPT | Manual ZIP/command workflow |
| DEC-017 | Supabase project provisioning | Project created and confirmed by Project Owner; ref `yzactdxbzzuskdfituzx` (ref only, no credentials recorded) | Ownership confirmed; **no remote migration executed** during foundation |
| DEC-018 | Prisma config consolidation | Legacy `prisma/schema.prisma` (Prisma 5) is the single Prisma source; `prisma7.config.ts` removed | Technical decision; legacy stack retained |
| DEC-019 | Profile provisioning | `auth.users` trigger `handle_new_user()` provisions `public.users`; role whitelist (jobseeker/mentor/recruiter), admin never via trigger | Technical decision; idempotent |
| DEC-020 | Privilege protection | Column-level UPDATE grants on `public.users` exclude `role`/`account_status` | Defense in depth with RLS |
| DEC-021 | E01 storage buckets | `profile-avatars`, `portfolio-files` private; owner-only via first path segment = auth.uid() | Technical decision |
| DEC-022 | E01 FK delete behavior | ON DELETE CASCADE for user-owned professional data and profile↔auth link; audit/history tables would not cascade | Technical decision; revisit for retention policy |
| DEC-023 | Testing tooling | Vitest adopted for unit tests; Node script for RLS integration checks | Foundation decision |
| DEC-024 | Active-account enforcement | `is_active_account()` guard required by mutation/storage policies; suspended/deactivated users cannot mutate or upload | Added after security review; verified locally |
| DEC-025 | Function EXECUTE hardening | Revoke helper/trigger function EXECUTE from `anon`; grant RLS helpers to `authenticated` only | Supabase default privileges hardening |

## Open Decisions

| ID | Question | Required authority |
|---|---|---|
| OPEN-001 | Exact Blind Profile field allowlist and identity reveal stage | Product Owner/PM/lecturer as applicable |
| OPEN-002 | Matching-score formula and weights | Product Owner/academic requirement authority |
| OPEN-003 | Affirmative-action rules and calculation | Product Owner/academic requirement authority |
| OPEN-004 | Recruiter-company membership/verification | PM/Product Owner |
| OPEN-005 | Learning progress interpretation in E03 Update | PM/Product Owner |
| OPEN-006 | Assessment scoring, retakes, certificates | PM/Product Owner |
| OPEN-007 | Mentorship message/forum wording in E07 Read | PM/Product Owner |
| OPEN-008 | Deletion, deactivation, retention, and anonymization | PM/Product Owner |
| OPEN-009 | Branch model (`main` only, `develop`, or trunk-based) | PM/Repository Admin |
| OPEN-010 | Exact schema compared with original proposal ERD | Technical Lead/PM |
| OPEN-011 | Supabase project/environment provisioning | Project Owner/Repository Admin |
| OPEN-012 | Legacy bcrypt password migration strategy (reset vs controlled hash import) | Project Owner/Technical Lead |
| OPEN-013 | `user_skills.proficiency_level` domain values and duplicate-skill uniqueness rule | PM/Product Owner |
| OPEN-014 | Whether remote migrations may be applied now (preflight + backup + approval) | Project Owner |
| OPEN-015 | Admin controlled read scope over user skills/portfolio (currently no blanket access) | PM/Product Owner |

Do not mark an open decision as resolved until the decision and approver are recorded.
