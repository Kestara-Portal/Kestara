# Kestara — Testing Strategy

> **Status:** Draft  
> **Purpose:** Define a layered test approach. Exact tools depend on the current repository dependencies and PM/technical approval.

## 1. Test Levels

### Static checks
- Lint.
- Type checking.
- Build.
- Formatting check if configured.

### Unit tests
- Validation schemas.
- Pure business rules.
- Status transition logic.
- Matching/scoring functions only after their formula is approved.

### Component tests
- Form validation and feedback.
- Loading, empty, error, and success states.
- Role-aware UI behavior.
- Accessibility basics.

### Integration tests
- Server use cases with database interactions.
- Auth/profile provisioning.
- CRUD persistence.
- Company/job/application authorization.
- Storage upload and download flows.

### Database and RLS tests
- Test each role with separate authenticated identities.
- Verify both allowed and denied operations.
- Test ownership, company membership, and role boundaries.
- Test private Storage object access.
- Test migrations against a disposable/local database before remote application.

### End-to-end tests
- Registration and profile completion.
- Job discovery and application.
- Recruiter vacancy management and candidate screening.
- Learning and assessment flow.
- Mentorship request and response.
- Forum topic and reply lifecycle.
- Admin moderation and account management.

## 2. Minimum Security Test Matrix

| Scenario | Expected |
|---|---|
| Unauthenticated user reads protected data | Denied |
| User reads/updates own profile | Allowed for approved fields |
| User reads/updates another user's private data | Denied |
| User changes own role to Admin | Denied |
| Recruiter accesses unrelated company's vacancy/applications | Denied |
| Recruiter reads approved Blind Profile | Allowed, redacted fields only |
| Candidate reads answer key | Denied |
| User downloads another user's private file | Denied |
| Non-Admin changes learning/assessment content | Denied |
| Unrelated user cancels mentorship session | Denied |
| Unrelated user edits/deletes forum post | Denied |
| Ordinary user reads admin audit logs | Denied |

## 3. PBI Test Evidence

For each PBI:
- Link test cases to the Jira issue.
- Record test data setup using synthetic data.
- Record expected and actual result.
- Attach screenshot/log only when it contains no secrets or real personal data.
- Record environment and commit/PR reference.
- Record failed tests and their resolution.

## 4. Test Data

- Use synthetic users for all four roles.
- Never use real candidate CVs, phone numbers, or personal data in test fixtures.
- Use fake company names and sample vacancies.
- Ensure test accounts do not have production privileges.
- Clean up test data safely.

## 5. Definition of Test Completion

Testing for a PBI is complete when:
- Relevant acceptance criteria have test coverage.
- Positive and negative authorization cases pass.
- Regression checks for affected features pass.
- Static checks/build pass where configured.
- Known limitations are recorded.
- Evidence is linked to Jira/PR.

## 6. Current Tooling (Foundation)

The development foundation adopted the following tools. Extend them rather than adding parallel stacks.

| Layer | Tool / command | Notes |
|---|---|---|
| Static | `npm run typecheck` | `tsc --noEmit` |
| Static | `npm run lint` | ESLint 9 + eslint-config-next |
| Static | `npm run build` | Next.js production build |
| Unit | `npm run test` | Vitest (`tests/unit/`) |
| Database / RLS | `npm run test:rls` | Creates/deletes synthetic Auth users and uploads; requires an isolated local Supabase and `PBI_TEST_DATABASE_ISOLATED=true` |
| PBI integration | `npm run test:pbi` | KP-7/KP-35 checks; creates/deletes synthetic users and rows; requires an isolated local Supabase and `PBI_TEST_DATABASE_ISOLATED=true` |
| Database | `npm run db:test` | pgTAP via `supabase test db` |

Do not run data-mutating integration commands against a shared or valuable local database. The test scripts reject non-local URLs and require an explicit isolation flag, but cannot determine whether a local database contains data that must be retained. Do not use `db reset` to prepare an integration test unless the target is a disposable database.

Playwright/Cypress E2E is not adopted yet. Add it only with team approval and a documented scope.

### Current verification status (foundation)

- `typecheck`, `lint`, `test` (16 unit tests), `build`: **PASS**.
- Runtime smoke test (`next start`): `/`, `/auth/login`, `/auth/register` return HTTP 200.
- Local Supabase: `db reset` applied all 6 migrations cleanly and ran the seed.
- Database / RLS / Auth / Storage integration (`npm run test:rls`): **PASS — 28/28 checks** (anon denial, own-read, cross-user denial, role/status protection, provisioning, admin escalation blocked, login/logout/session, storage isolation, suspended-account mutation/upload denial).

### Current verification status (E04-C company registration / E02-U vacancy update)

- `npm run typecheck`, `npm run lint`, `npm run test` (60 unit tests, 44 of them new), `npm run build`: **PASS**.
- Unit coverage added: `tests/unit/validations/company.test.ts`, `tests/unit/validations/vacancy.test.ts`, `tests/unit/services/companies.test.ts`, `tests/unit/services/vacancies.test.ts`.
- **Migration not applied to a Supabase stack.** Docker is unavailable in the authoring environment, so `npm run db:reset` and `npm run test:rls` could not be executed. Instead the full migration chain (E01 + `20261113000000_e02_e04_companies_vacancies.sql`) was applied to a disposable in-process PostgreSQL (PGlite, PG 17) with `auth`/`storage` stubs, and 33/33 policy checks passed: anon denial, jobseeker/mentor company-insert denial, recruiter owner-membership bootstrap, duplicate name/domain rejection, cross-company company and vacancy update denial, `company_id`/`recruiter_id` reassignment denial, `created_by` attribution denial, admin access, and closed-vacancy visibility.
- Re-run on a real stack before the PBI is marked Done: `npm run db:reset`, then `npm run test:rls` extended with company/vacancy cases.

### KP-7 / KP-35 verification snapshot (2026-11-14)

- `npm run typecheck`: **PASS**.
- `npm run lint`: **PASS with 2 existing warnings** in the legacy `app/register/page.tsx`.
- `npm run test`: **PASS — 48 tests**.
- `npm run build`: **PASS** after the verified-company membership migration.
- `npm run test:pbi`: **PASS — 79/79 checks** on a separate disposable local Supabase project.
- `npm run test:rls`: **PASS — 55/55 checks** on the same isolated local project.
- `node --check scripts/profile-jobs-check.mjs` and `node --check scripts/db-rls-check.mjs`: **PASS**.
- The migration upgrade path preserved legacy jobs without assigning companies or memberships. OPEN-008 remains unresolved for legacy-job assignment and existing-job behavior after membership revocation. Jira acceptance criteria and visual viewport QA were not verified.
