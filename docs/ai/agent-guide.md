# Kestara — AI Agent Guide

> **Status:** Draft  
> **Audience:** DeepSeek and other AI coding agents.

## 1. Required Reading Order

Before starting a task:

1. Read root `AGENTS.md`.
2. Read `docs/README.md`.
3. Read `docs/project/project-overview.md`.
4. Read the relevant requirement/PBI and acceptance criteria.
5. Read relevant architecture, database, RLS, Storage, and design documents.
6. Inspect the actual source code and `package.json`.
7. Inspect the relevant Jira issue if access is available through the user; do not invent its status or key.

## 2. Source-of-Truth Rules

- Lecturer instructions and approved academic proposal govern academic requirements.
- Latest approved PM/Product Owner decisions govern implementation choices.
- Jira governs current issue status, assignee, sprint, and priority.
- Approved docs govern technical contracts.
- Source code and tests describe actual implementation state.
- Draft docs are proposals, not final instructions.

If sources conflict, stop and report the conflict. Do not silently choose whichever source is easiest.

## 3. Required Task Procedure

For every assigned Jira issue:

1. Restate the issue and acceptance criteria.
2. Identify relevant files and existing patterns.
3. Identify dependencies and security implications.
4. Prepare a concise implementation plan.
5. List files expected to change.
6. Identify assumptions and questions.
7. Wait for approval when the task changes schema, architecture, authorization, scope, or shared configuration.
8. Implement only the approved scope.
9. Run relevant tests/checks.
10. Report files changed, behavior changed, tests, limitations, and follow-up work.

## 4. Hard Rules

- Do not invent Jira issue keys, acceptance criteria, database fields, scoring formulas, or role permissions.
- Do not implement an unapproved Draft as a final contract.
- Do not change unrelated modules.
- Do not expose secrets or real user data.
- Do not place Supabase secret/service-role keys in browser code.
- Do not rely on frontend hiding for authorization.
- Do not bypass RLS to make a test pass.
- Do not delete Prisma/NextAuth/MySQL code until migration and regression checks are complete.
- Do not create production SQL migrations from the conceptual ERD without approval.
- Do not push, force-push, merge, or rewrite Git history during the repository maintenance freeze.
- Do not claim tests passed unless they were actually run.

## 5. Required Completion Report

```text
Jira issue:
Summary:
Implementation:
Files changed:
Database/API impact:
Security/RLS impact:
Tests executed:
Test results:
Documentation updated:
Known limitations:
Assumptions:
Git actions performed: none unless explicitly authorized
```

## 6. When to Stop and Ask

Stop before implementation if:
- Requirement conflicts with lecturer/proposal.
- Acceptance criteria are incomplete for a destructive or sensitive operation.
- Role/ownership behavior is unclear.
- Blind Profile or matching-score behavior is unspecified.
- Database migration may destroy or transform existing data.
- A secret, credential, or personal-data exposure is suspected.
- The task requires push/merge while the freeze is active.
