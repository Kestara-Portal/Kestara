# Kestara — Coding Standards

> **Status:** Draft. Align with current lint and formatting configuration before enforcing.

## 1. General

- Use TypeScript for application code.
- Prefer explicit, meaningful names.
- Keep functions and components focused.
- Avoid duplicated business rules.
- Do not add dependencies without checking existing packages and obtaining approval where needed.
- Do not change unrelated files in a PBI.

## 2. React and Next.js

- Follow App Router conventions used by the installed Next.js version.
- Prefer Server Components unless client-side interactivity is required.
- Add `"use client"` only when needed.
- Keep server-only code out of client bundles.
- Use semantic HTML.
- Avoid deeply nested conditional rendering when smaller components improve clarity.

## 3. TypeScript

- Avoid `any`; use proper types or `unknown` with narrowing.
- Model API responses and domain states explicitly.
- Avoid unsafe type assertions unless justified.
- Keep shared types in a predictable location.
- Validate external input at runtime; TypeScript alone does not validate requests.

## 4. Data and Business Logic

- Separate UI, use cases, and data access.
- Validate input on the server.
- Enforce ownership and role permissions in trusted server/database layers.
- Use database constraints for invariants.
- Do not expose raw database errors or secrets to users.
- Do not trust client-provided role, owner ID, score, or status.

## 5. Supabase

- Use browser-safe publishable credentials only in client code.
- Keep secret/service-role keys server-only.
- Use request-aware SSR clients for user-scoped server requests.
- Treat RLS as mandatory for exposed tables.
- Version schema, grants, RLS, functions, and Storage policies in migrations.
- Do not bypass RLS to work around a policy defect without explicit security review.

## 6. Security and Privacy

- Never commit secrets or real user data.
- Avoid logging tokens, passwords, signed URLs, or sensitive profile fields.
- Redact Blind Profile data before it reaches Recruiter clients.
- Validate upload type, size, ownership, and related resource authorization.
- Use least privilege.

## 7. UI and Accessibility

- Follow `docs/design/design-system.md`.
- Reuse existing components and tokens.
- Provide loading, empty, error, and success states.
- Support keyboard navigation, labels, and focus visibility.
- Do not use color as the only status signal.

## 8. Errors and Tests

- Handle expected errors explicitly.
- Do not swallow exceptions silently.
- Test business rules and authorization boundaries.
- Add regression tests for fixed defects.
- Document any behavior that cannot be tested automatically.
