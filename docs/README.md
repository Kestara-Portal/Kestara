# Kestara Documentation Hub

Dokumentasi ini menjadi knowledge base produk dan teknis untuk tim Kestara serta AI coding agents.

## Cara membaca

1. Mulai dari root [`../AGENTS.md`](../AGENTS.md).
2. Baca [`project/project-overview.md`](project/project-overview.md).
3. Baca requirement/PBI dan acceptance criteria yang sesuai.
4. Baca arsitektur, database, security, design, dan development docs yang relevan.
5. Periksa status dokumen. Draft bukan keputusan final.

## Status

- **Approved:** disetujui pihak berwenang.
- **Draft:** usulan/rancangan yang perlu ditinjau.
- **Planned:** belum dibuat.
- **Archived:** tidak lagi berlaku.

## Project

| Dokumen | Status |
|---|---|
| [`project/project-overview.md`](project/project-overview.md) | Draft |
| [`project/project-scope.md`](project/project-scope.md) | Draft |
| [`project/team-structure.md`](project/team-structure.md) | Draft |

## Requirements

| Dokumen | Status |
|---|---|
| [`requirements/functional-requirements.md`](requirements/functional-requirements.md) | Draft |
| [`requirements/non-functional-requirements.md`](requirements/non-functional-requirements.md) | Draft |
| [`requirements/product-backlog.md`](requirements/product-backlog.md) | Draft |
| [`requirements/acceptance-criteria.md`](requirements/acceptance-criteria.md) | Draft |

## Architecture and Database

| Dokumen | Status |
|---|---|
| [`architecture/system-architecture.md`](architecture/system-architecture.md) | Draft |
| [`architecture/frontend-architecture.md`](architecture/frontend-architecture.md) | Draft |
| [`architecture/supabase-architecture.md`](architecture/supabase-architecture.md) | Draft |
| [`database/erd.md`](database/erd.md) | Draft |
| [`database/database-schema.md`](database/database-schema.md) | Draft |
| [`database/rls-policies.md`](database/rls-policies.md) | Draft |
| [`database/storage-policies.md`](database/storage-policies.md) | Draft |

## Design

| Dokumen | Status |
|---|---|
| [`design/design-system.md`](design/design-system.md) | Draft |
| [`design/color-palette.md`](design/color-palette.md) | Draft; Green Teal direction confirmed |
| [`design/ui-ux-references.md`](design/ui-ux-references.md) | Draft |

## Development and Operations

| Dokumen | Status |
|---|---|
| [`development/installation.md`](development/installation.md) | Updated for foundation |
| [`development/environment.md`](development/environment.md) | Foundation |
| [`development/architecture-guide.md`](development/architecture-guide.md) | Foundation |
| [`development/supabase-local.md`](development/supabase-local.md) | Foundation |
| [`development/authentication.md`](development/authentication.md) | Foundation |
| [`development/security-rls.md`](development/security-rls.md) | Foundation |
| [`development/storage.md`](development/storage.md) | Foundation |
| [`development/pbi-implementation-guide.md`](development/pbi-implementation-guide.md) | Foundation |
| [`development/git-workflow.md`](development/git-workflow.md) | Draft |
| [`development/coding-standards.md`](development/coding-standards.md) | Draft |
| [`development/testing-guide.md`](development/testing-guide.md) | Updated for foundation |
| [`development/repository-maintenance.md`](development/repository-maintenance.md) | Draft |

## Decisions and AI

| Dokumen | Status |
|---|---|
| [`decisions/decision-log.md`](decisions/decision-log.md) | Draft record |
| [`ai/agent-guide.md`](ai/agent-guide.md) | Draft |
| [`ai/project-context.md`](ai/project-context.md) | Draft |
| [`ai/task-workflow.md`](ai/task-workflow.md) | Draft |

## Recorded Project Decisions

1. Product name: Kestara.
2. Architecture style: Three-Tier Architecture (Presentation, Application, Data).
3. Target backend: Supabase PostgreSQL, Auth, Storage, and RLS.
4. Supabase project created and confirmed by the Project Owner (ref `yzactdxbzzuskdfituzx`); E01 foundation implemented locally, remote migrations not yet applied.
5. Migration strategy: full migration from legacy MySQL/Prisma/NextAuth.
6. Roles: Jobseeker, Mentor, Recruiter, Admin. Public registration excludes Admin.
7. Skills Matrix and Portfolio apply to Jobseeker, Mentor, and Recruiter.
8. Visual direction: Green Teal; primary color used in drafts is `#176B62`.
9. Jira decomposition: one module = one Epic; each CRUD operation = separate PBI/User Story.
10. Eight modules therefore map to 32 CRUD PBI references. Actual issue keys must come from the existing Jira board.
11. Jira is the work-status source of truth; GitHub is the code source of truth; docs contain reviewed requirements and technical context.
12. The temporary repository push freeze has been lifted by the Project Owner. Normal branch-based development may proceed under the approved Git workflow.

## Source of Truth

- Lecturer instructions and approved project report/proposal: academic constraints and scope.
- Latest approved PM/Product Owner decisions: product and implementation choices.
- Jira: current issue status, assignee, sprint, priority.
- Approved docs: technical contracts.
- Source code and tests: actual implementation state.

If sources conflict, record the conflict and ask the authorized decision-maker. Do not silently reconcile.

## Documentation Rules

- Separate confirmed facts, approved decisions, proposals, and open questions.
- Never store secrets, passwords, tokens, or real personal data.
- Never claim an uncreated Supabase project, unapplied RLS policy, or untested feature is implemented.
- Update this index when adding or changing docs.
