# Kestara — Non-Functional Requirements

> **Status:** Draft / proposed quality baseline. Numeric service targets require team and lecturer approval.

## 1. Security and Privacy

- Enforce server-side authorization and database RLS for protected data.
- Keep Supabase secret/service-role credentials server-only.
- Do not store passwords in application profile tables.
- Use private Storage buckets for CVs, application documents, and private portfolio files unless a visibility rule is explicitly approved.
- Prevent cross-user and cross-company data access.
- Blind Profile must redact identifying fields before delivery to Recruiter clients.
- Validate all untrusted input on the server.
- Do not log passwords, access tokens, signed URLs, or unnecessary personal data.
- Account deactivation and permanent deletion must follow an approved lifecycle policy.

## 2. Usability and Accessibility

- Use consistent navigation and interaction patterns across roles.
- Provide visible labels and meaningful validation messages.
- Support keyboard navigation and semantic HTML.
- Maintain readable contrast, focus indicators, and responsive layouts.
- Avoid relying on color alone to communicate status.
- Provide loading, empty, error, and success states.
- Use plain Indonesian UI language unless the product owner approves bilingual UI.

## 3. Reliability and Data Integrity

- Use PostgreSQL constraints and foreign keys for relational integrity.
- Use transactions or safe server-side orchestration for multi-step operations.
- Prevent duplicate or invalid state transitions where business rules require it.
- Keep schema changes in reviewed SQL migrations.
- Provide recoverable error handling and avoid silent data loss.
- Define backup and recovery expectations before production deployment.

## 4. Performance

- Paginate or limit potentially large lists such as jobs, applications, forum posts, and audit logs.
- Add indexes based on real query/filter patterns.
- Avoid N+1 query patterns.
- Optimize images and uploaded media.
- Set performance budgets only after deployment context and measurement method are agreed.

## 5. Maintainability

- Use TypeScript types and shared validation schemas where appropriate.
- Separate UI components from business logic and data-access modules.
- Keep migrations, policies, tests, and documentation version-controlled.
- Use consistent naming and error-handling patterns.
- Keep dependencies aligned with the installed framework versions.

## 6. Compatibility and Responsiveness

- Support current stable desktop and mobile browsers selected by the team.
- Design layouts for mobile, tablet, and desktop widths.
- Avoid assuming a fixed viewport size.
- Define a formal browser support matrix before release.

## 7. Observability

- Log operational errors without leaking secrets or unnecessary PII.
- Record privileged administrative actions where required.
- Provide enough context to trace failures to a feature/PBI.
- Define monitoring, alerting, and retention policies before production.

## 8. Acceptance of NFRs

These are quality requirements, not claims of current compliance. Each release should verify relevant security, accessibility, performance, and reliability criteria. Numeric thresholds must be approved rather than invented.
