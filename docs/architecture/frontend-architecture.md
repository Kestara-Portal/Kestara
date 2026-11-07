# Kestara — Frontend Architecture

> **Status:** Draft  
> **Target:** Next.js App Router, React, TypeScript, Tailwind CSS  
> **Note:** Verify actual folders, installed package versions, and framework conventions before implementation.

## 1. Responsibilities

The frontend is the Presentation Layer. It renders pages and collects user input. It must not be the only enforcement point for security or business rules.

## 2. Suggested Organization

This is a target organization, not an instruction to move existing files without audit.

```text
app/
  (public)/
  (auth)/
  (dashboard)/
  api/
components/
  ui/
  forms/
  layout/
  features/
lib/
  supabase/
  validations/
  services/
  utils/
types/
```

Use the existing repository structure if it already follows a coherent convention. Avoid large folder migrations without an approved task.

## 3. Server and Client Components

- Prefer Server Components for data loading and non-interactive page composition.
- Use Client Components only where browser state, event handlers, or client-only APIs are needed.
- Keep server-only modules isolated from client imports.
- Never import service-role credentials into client code.
- Do not pass secrets or unnecessary PII into serialized props.

## 4. Data Access

- Use a request-aware Supabase server client for authenticated server operations.
- Use a browser client only for operations approved for direct browser access and protected by RLS.
- Keep data access and business logic out of visual components.
- Validate input on the server.
- Do not assume a hidden button is a security control.

## 5. Forms

- Define a schema for each meaningful form.
- Show field-level validation and submission errors.
- Disable duplicate submission while a request is pending.
- Do not show success until the server confirms persistence.
- Avoid leaking internal database errors to users.

## 6. Routing and Role Experience

- Group routes by public/authenticated/dashboard context as appropriate.
- Role-based navigation is a UX feature; server/database authorization is still mandatory.
- Redirect unauthorized users safely without exposing whether sensitive records exist.
- Do not create routes for unapproved features.

## 7. UI States

Every page that depends on remote data should implement loading, empty, error, and success states. Long lists should support pagination or bounded loading.

## 8. Performance and Accessibility

- Optimize images and media.
- Avoid unnecessary client-side JavaScript.
- Use semantic markup, keyboard navigation, labels, and visible focus.
- Respect reduced-motion preferences.
- Test responsive behavior across mobile, tablet, and desktop.

## 9. Dependency and Version Discipline

- Inspect `package.json` and lockfile before installing packages.
- Use documentation matching installed versions.
- Do not blindly upgrade Next.js, React, Tailwind, or Supabase packages.
- Check locally installed Next.js docs if available, following `AGENTS.md`.
