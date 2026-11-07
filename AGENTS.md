<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Kestara — Instructions for AI Coding Agents

## 1. Read before acting

Before starting any task:
1. Read this `AGENTS.md` completely.
2. Read `docs/README.md` to find the relevant project documentation.
3. Read the specific requirement, architecture, database, design, and development documents related to the assigned Jira issue. If a referenced document does not exist yet, do not invent its contents; ask the Project Owner or report the gap.
4. Inspect the current source code and Git status before proposing or making changes.
5. Follow the Next.js version-specific instruction in the generated block above. Do not rely on remembered APIs when local Next.js documentation is available.

## 2. Project identity and purpose

Kestara is an inclusive career-development and recruitment platform. Its intended capabilities include career and skill development, job discovery, professional profiles, mentorship, community participation, and competency-based recruitment with blind-profile screening and affirmative-action support.

The four application roles are:
- `jobseeker`
- `mentor`
- `recruiter`
- `admin`

Public registration is intended for Jobseeker, Mentor, and Recruiter. Admin accounts must be provisioned through a controlled administrative process, never through a public role selector.

Use these canonical role identifiers in code and database design. Indonesian labels may be used in the user interface.

## 3. Project decisions already agreed

Treat the following as approved project direction unless the Project Owner explicitly changes it:

- The system architecture follows the Three-Tier Architecture described in the project report: Presentation Layer, Application Layer, and Data Layer.
- The selected target backend platform is Supabase, using PostgreSQL, Supabase Auth, Supabase Storage, and Row Level Security (RLS).
- The project is planned for a full migration from the existing MySQL, Prisma, and NextAuth implementation to Supabase.
- The Supabase project has not yet been created. Do not assume that credentials, remote database, buckets, policies, or migrations already exist.
- Green Teal is the approved visual direction. Primary brand color: `#176B62`.
- Skills Matrix and Portfolio management apply to all three public roles: Jobseeker, Mentor, and Recruiter. Admin is not required to maintain a professional skills matrix or portfolio.
- The lecturer's Jira decomposition rule is: one module is represented as one Epic; each CRUD operation (Create, Read, Update, Delete) is a separate PBI/User Story under that module. Do not combine all four CRUD operations into one PBI.
- Jira is used to manage work status and assignments; GitHub is the source of code; approved project documentation records requirements and technical decisions.

Important clarification: the project report establishes the Three-Tier Architecture and allows a relational database direction. Supabase is the team's selected implementation decision; do not claim that the report explicitly names Supabase unless the report itself says so.

## 4. Current repository state versus target state

The repository snapshot inspected during documentation setup contains the legacy implementation:
- Next.js `16.4.5`
- React `19.3.0`
- TypeScript `5.x`
- Tailwind CSS `4.x`
- NextAuth `4.24.15`
- Prisma `5.22.0`
- MySQL datasource in `prisma/schema.prisma`
- A minimal Prisma `User` model

The target is Supabase, but the migration is not complete. Until an approved implementation task has migrated and tested a component:
- Do not describe Supabase Auth as already integrated.
- Do not assume PostgreSQL is already connected.
- Do not remove Prisma, NextAuth, bcryptjs, MySQL configuration, or legacy code merely because migration is planned.
- First map every usage, implement the replacement, test it, and obtain approval before removing legacy dependencies or files.
- Keep current-state facts separate from target-state plans in documentation and reports.

## 5. Architecture and implementation boundaries

Respect the Three-Tier separation:

### Presentation Layer

Next.js App Router pages, layouts, React components, forms, and user-facing interactions. Keep presentation components focused on UI and interaction. Do not place privileged secrets or unrestricted database operations in browser code.

### Application Layer

Server-side use cases, validation, authorization, business rules, route handlers, and server actions where appropriate. Enforce permissions here as well as at the database boundary. Keep business logic out of purely presentational components.

### Data Layer

Supabase PostgreSQL, Auth, Storage, SQL migrations, RLS policies, and database-level constraints. SQL migrations in the repository must be the reviewed source of truth for schema changes once Supabase implementation begins.

Do not introduce a second database or a second authentication system without explicit approval.

## 6. Security rules — mandatory

- Never commit `.env`, `.env.local`, database passwords, access tokens, private keys, Supabase secret keys, or service-role keys.
- Never expose a Supabase secret/service-role key through `NEXT_PUBLIC_*`, client components, browser bundles, screenshots, logs, or documentation.
- Use only the public/publishable Supabase key in browser contexts where appropriate; keep privileged keys server-side and only use them for narrowly scoped administrative operations.
- Do not store passwords in application profile tables. Supabase Auth is the target credential manager.
- Never allow a user to set or promote their own role through public registration, editable profile fields, or user-controlled metadata.
- Enforce ownership and role access on the server and with database RLS. Hiding a button or field in the UI is not authorization.
- Private files (including affirmation documents, CVs, and other sensitive uploads) must not be placed in publicly readable buckets.
- Blind recruitment must anonymize data at the server/database response boundary. Do not rely on CSS or client-side filtering to hide identity fields.
- Do not log passwords, tokens, private documents, or unnecessary personal data.
- For account deactivation, prefer a reversible status change unless an approved requirement explicitly calls for permanent deletion and its retention implications are defined.

## 7. Coding and change-management rules

For every assigned task:
1. Confirm the Jira issue key, expected behavior, acceptance criteria, and files/modules in scope.
2. Check `git status` and the current branch before editing. Never overwrite unrelated local changes.
3. Provide a short implementation plan before broad or cross-cutting changes.
4. Make the smallest coherent change that satisfies the accepted scope.
5. Reuse established project conventions and components where practical.
6. Validate input on the server; use appropriate schema validation where the project has adopted it.
7. Handle loading, empty, success, and error states for user-facing flows.
8. Add or update tests for behavior and authorization where test infrastructure exists. If tests cannot be run, state that clearly.
9. Run relevant lint, type-check, test, and build commands that are actually available in `package.json`. Do not claim a command passed if it was not run.
10. Report changed files, behavior, commands run, results, known limitations, and any follow-up work.

Do not:
- Refactor unrelated modules while implementing a Jira issue.
- Invent business rules, scoring weights, matching formulas, or privacy exceptions.
- Change database schema without a reviewed migration and approval.
- Apply destructive database operations or remote migrations without explicit approval.
- Upgrade major dependencies without a specific reason and approval.
- Create fake/dummy functionality and present it as complete.
- Do not merge, force-push, rewrite Git history, or change repository settings without the required authorization.
- Normal commits and pushes to dedicated branches are permitted after local verification and in accordance with the approved Git workflow.

## 8. Jira and PBI conventions

Follow the team's lecturer-approved decomposition:
- Epic: one functional module.
- PBI/User Story: one CRUD operation for that module.
- Task: an implementation activity supporting a PBI.
- Sub-task: a smaller unit of a Task, when needed.
- Bug: a defect in existing behavior.

Every implementation task must reference its Jira issue key in the branch name, commit message, and Pull Request title/description where applicable. Do not create or renumber Jira issues unless authorized by the responsible team member/PM.

A PBI is not Done merely because code has been written. Verify its acceptance criteria, relevant tests, review requirements, and integration state.


## 9. Git collaboration rules

The temporary repository maintenance pause has been explicitly lifted by the Project Owner.

Normal development and documentation work may now proceed through the team's approved Git workflow.

Rules:
- Use dedicated feature, fix, or documentation branches.
- Do not develop directly on `main`.
- Every implementation branch must reference its Jira issue key where applicable.
- Push completed local commits to the appropriate remote branch.
- Use Pull Requests for integration into `main`.
- Review changes before merging.
- Coordinate shared or cross-module changes with the responsible team members.
- Do not force-push, rewrite shared history, or delete shared branches without explicit authorization.
- Do not assume `develop` exists until it has been created and agreed by the team/PM.
- Keep `main` stable and protected according to the team's approved repository settings.

The Project Owner retains authority to authorize repository-level maintenance and exceptional Git operations.


## 10. UI and accessibility rules

- Use Green Teal as the primary visual direction, with `#176B62` as the primary brand color.
- Keep the interface clean, responsive, and consistent across the four roles.
- Use semantic HTML, keyboard-accessible controls, visible focus states, labels for form fields, and sufficient color contrast.
- Do not copy the visual identity or page layouts of reference websites. Use them only as product/UX inspiration:
  - Glints: job discovery and job recommendations.
  - Duolingo: guided learning and progress motivation.
  - Jobstreet: job search and company information.
  - LinkedIn: professional community and networking.
  - Jobseeker: CV and career-preparation tools.

## 11. Handling ambiguity and reporting

If requirements conflict, are incomplete, or affect security, privacy, database design, user roles, or cross-module behavior:
- Stop before making an irreversible assumption.
- Quote the conflicting requirement or identify the missing decision.
- Explain the impact and offer a recommendation clearly labeled as a recommendation.
- Wait for approval from the Project Owner or authorized PM/lecturer where required.

At the end of each task, provide:
- Jira issue key and scope completed.
- Files created/modified/deleted.
- Important implementation decisions.
- Tests/checks run and their actual outcomes.
- Security and migration notes.
- Remaining risks, blockers, and decisions needed.
- Confirmation that no push/merge occurred unless explicitly authorized.
