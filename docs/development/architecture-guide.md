# Architecture Guide (Development Foundation)

Kestara follows the Three-Tier Architecture. Keep responsibilities separated.

## Layers

### Presentation Layer — `app/`, `components/`
- Next.js App Router pages/layouts, React components, forms, UI states.
- Client-side validation for UX only; not a security boundary.
- No secrets, no service-role key, no privileged queries.

### Application Layer — `lib/`, `app/**/route.ts`, server actions
- `lib/supabase/*`: Supabase clients (browser/server/admin/proxy).
- `lib/auth/*`: roles, session, server actions, admin provisioning.
- `lib/validations/*`: input validation.
- `lib/services/*`: future use-case modules (business rules).
- `lib/http/*`: standard API response envelope.
- Route handlers / server actions validate input and enforce authorization.

### Data Layer — `supabase/`
- `supabase/migrations/*.sql`: versioned schema, RLS, functions, storage policies.
- `supabase/seed.sql`: safe synthetic seed.
- Database enforces constraints + RLS as the final boundary.

## Directory structure

```
app/                  Next.js App Router (routes)
  auth/               Supabase auth routes (new, coexists with legacy)
  api/                legacy NextAuth route (kept during migration)
components/           shared React components (ui/, layout/, features/)
lib/
  auth/               roles, session, actions, admin provisioning
  http/               API response helpers
  storage/            storage path builders
  supabase/           clients + proxy helper
  utils/              shared utilities/errors
  validations/        validation schemas/functions
types/                shared TypeScript types
tests/unit/           Vitest unit tests
scripts/              provisioning, seeding, RLS checks
supabase/             migrations, seed, config, (tests)
docs/                 project + developer documentation
```

## Conventions

- **Files:** kebab-case for modules; `page.tsx`/`route.ts` per Next.js.
- **Components:** PascalCase, one primary export per file.
- **Functions:** camelCase; server actions end with `Action`.
- **Errors:** expected errors → `AppError` (`lib/utils/errors.ts`); never leak DB errors.
- **API responses:** `jsonOk` / `jsonError` (`lib/http/responses.ts`).
- **Validation:** server-side validation in `lib/validations/*` before any DB write.
- **Authorization:** `requireUser` / `requireRole` in the application layer, plus RLS in the database.
- **Types:** shared row/domain types in `types/`.
- **Env:** public vars `NEXT_PUBLIC_*`; secrets server-only.

## Legacy coexistence

MySQL + Prisma + NextAuth remain until the Supabase replacement is verified. Do not delete legacy code or dependencies during foundation work.
