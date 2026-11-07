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

## 6. Tool Selection

Do not add Playwright, Vitest, Jest, Cypress, or other tooling until the existing repository has been audited and the team approves the test stack. Prefer the project's existing tools if they are suitable.
