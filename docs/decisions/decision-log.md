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
| DEC-026 | Interactive control border token | `#7A8884` as `--color-control-border`; 3.70:1 against white, meets WCAG 2.2 1.4.11 | Supplied by Project Owner for Implementation Task 01 |
| DEC-027 | Display mode | Light Mode is the official mode; the incomplete `prefers-color-scheme` dark override was removed. Dark mode is not claimed | Supplied by Project Owner for Implementation Task 01 |
| DEC-028 | Official typeface | Geist, loaded through `next/font`, mapped to `--font-sans`; the `body` rule no longer falls back to Arial | Supplied by Project Owner for Implementation Task 01 |
| DEC-029 | Accessibility target | WCAG 2.2 AA for contrast, focus, and keyboard operation | Supplied by Project Owner; aligns `design.md` with the other design docs |
| DEC-030 | Brand scale 50 to 900 | Remains a proposal. Only the core tokens already in `app/globals.css` are in use | Supplied by Project Owner for Implementation Task 01 |
| DEC-031 | KP-7 validation | Zod used for profile/skill/portfolio/password payloads; validated on client and re-validated on the server | PBI KP-7 |
| DEC-032 | KP-7 password change | Re-verify current password, then `supabase.auth.updateUser`; no password stored in `public.users` | PBI KP-7 |
| DEC-033 | KP-7 proficiency level | Not implemented; domain remains OPEN-013, so no new business rule introduced | PBI KP-7 |
| DEC-034 | KP-35 job ownership | `created_by` is always the authenticated recruiter; every new job must reference a company with that recruiter's verified membership | PBI KP-35; company-scoped rule resolved by DEC-037 |
| DEC-035 | KP-35 employment type | Accepted as optional free text; value domain not yet defined | PBI KP-35 |
| DEC-036 | KP-35 atomic creation | Direct table writes are revoked; one `SECURITY DEFINER` RPC validates active recruiter, selected company membership, and skills atomically. Job UPDATE/DELETE remain out of scope | PBI KP-35 |
| DEC-037 | OPEN-004 recruiter-company authorization | A Recruiter may publish a vacancy only for a company where that Recruiter has a `verified` membership. Only an active Admin may verify or revoke memberships; Recruiters cannot self-verify | Resolved by Project Owner on 2026-11-14; Jira criteria were not supplied or changed |

## Open Decisions

| ID | Question | Required authority |
|---|---|---|
| OPEN-001 | Exact Blind Profile field allowlist and identity reveal stage | Product Owner/PM/lecturer as applicable |
| OPEN-002 | Matching-score formula and weights | Product Owner/academic requirement authority |
| OPEN-003 | Affirmative-action rules and calculation | Product Owner/academic requirement authority |
| OPEN-004 | Recruiter-company membership/verification | **Resolved by DEC-037**; membership onboarding remains out of scope for KP-35 |
| OPEN-005 | Learning progress interpretation in E03 Update | PM/Product Owner |
| OPEN-006 | Assessment scoring, retakes, certificates | PM/Product Owner |
| OPEN-007 | Mentorship message/forum wording in E07 Read | PM/Product Owner |
| OPEN-008 | Deletion, deactivation, retention, and anonymization | PM/Product Owner; also decide legacy-job company assignment and how existing jobs are treated after a membership is revoked. Current implementation preserves rows and blocks only future job creation for that membership |
| OPEN-009 | Branch model (`main` only, `develop`, or trunk-based) | PM/Repository Admin |
| OPEN-010 | Exact schema compared with original proposal ERD | Technical Lead/PM |
| OPEN-011 | Supabase project/environment provisioning | Project Owner/Repository Admin |
| OPEN-012 | Legacy bcrypt password migration strategy (reset vs controlled hash import) | Project Owner/Technical Lead |
| OPEN-013 | `user_skills.proficiency_level` domain values and duplicate-skill uniqueness rule | PM/Product Owner |
| OPEN-014 | Whether remote migrations may be applied now (preflight + backup + approval) | Project Owner |
| OPEN-015 | Admin controlled read scope over user skills/portfolio (currently no blanket access) | PM/Product Owner |

Do not mark an open decision as resolved until the decision and approver are recorded.
