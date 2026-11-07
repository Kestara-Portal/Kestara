# Kestara — AI Project Context

> **Status:** Draft quick context. Read the linked detailed docs before implementation.

## Product

Kestara is a career development and recruitment platform with competency-oriented recruitment, learning, mentorship, community, and a Blind Profile concept.

## Roles

- `jobseeker`
- `mentor`
- `recruiter`
- `admin`

Public registration: Jobseeker, Mentor, Recruiter. Admin provisioning is controlled.

Skills Matrix and Portfolio apply to Jobseeker, Mentor, and Recruiter.

## Modules

1. Account and User Profile.
2. Job Vacancy.
3. Micro-Learning.
4. Company Partner Data.
5. Job Application and Blind Profile.
6. Skill Assessment.
7. Mentorship Schedule and Sessions.
8. Community Discussion Forum.

## Jira Rule

One module = one Epic. Each CRUD operation (Create, Read, Update, Delete) is a separate PBI/User Story. Eight modules therefore map to 32 CRUD PBI references. Actual Jira keys must be retrieved from the existing board.

## Architecture and Technology

- Architecture style: Three-Tier Architecture.
- Current previously audited stack: Next.js, React, TypeScript, Tailwind CSS, NextAuth, Prisma, MySQL. Verify current repository state.
- Target backend: Supabase PostgreSQL, Auth, Storage, RLS.
- Supabase status: `not_created` at the last owner update.
- Migration strategy: full migration.
- Do not remove legacy stack until replacement and regression tests pass.

## Design

- Green Teal direction.
- Primary color used in drafts: `#176B62`.
- Reference products: Glints, Duolingo, Jobstreet, LinkedIn, Jobseeker.
- Learn interaction patterns; do not copy branding/assets/layouts.

## Collaboration

- Jira: work status and assignment.
- GitHub: code and PR history.
- `docs/`: requirements and reviewed technical context.
- DeepSeek: coding agent.
- ChatGPT: context/review support.
- Repository push freeze has been lifted by the Project Owner. Normal branch-based collaboration is permitted.

## Important Unknowns

- Blind Profile field allowlist and identity reveal.
- Matching formula and weights.
- Affirmative-action implementation.
- Company/recruiter authorization.
- Learning progress semantics.
- Assessment scoring/certificates.
- Mentorship message model.
- Data deletion and retention.
- Final schema versus original proposal ERD.

See `docs/README.md` for the complete documentation index.
