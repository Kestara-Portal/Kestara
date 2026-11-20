# Kestara

**Inclusive Career Development and Recruitment Platform**

Kestara is a career-development and recruitment platform intended to connect job seekers, mentors, recruiters, and companies through professional profiles, job opportunities, micro-learning, skill assessments, mentorship, and community features.

> **Project status:** The Supabase project has been created and confirmed by the Project Owner. The E01 development foundation (PostgreSQL schema, RLS, auth provisioning, storage policies, SSR clients, testing) is implemented locally; remote migrations have not yet been applied. The legacy Next.js/NextAuth/Prisma/MySQL stack is retained until the migration passes regression testing.

## Planned modules

1. Account and user profile management
2. Job vacancy management
3. Micro-learning content management
4. Company partner management
5. Job applications and blind profiles
6. Skill assessments
7. Mentorship schedules and sessions
8. Community discussion forum

## User roles

- **Jobseeker:** professional profile, skills, portfolio, job discovery, applications, learning, assessments, mentorship, and community participation.
- **Mentor:** professional profile, skills, portfolio, mentorship availability, and mentoring sessions.
- **Recruiter:** professional profile, skills, portfolio, company and vacancy management, and candidate/application review according to authorization rules.
- **Admin:** controlled administrative management of users and platform content.

Public registration is intended for Jobseeker, Mentor, and Recruiter. Admin accounts must be provisioned through a controlled administrative process.

## Technology stack

### Current repository implementation

| Area | Current technology |
|---|---|
| Web framework | Next.js 16.4.5 |
| UI library | React 19.3.0 |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 4.x |
| Authentication | NextAuth 4.24.15 |
| ORM | Prisma 5.22.0 |
| Database configuration | MySQL |
| Password utility | bcryptjs |
| Linting | ESLint 9 |

These versions are taken from the repository's `package.json`. Check source code and configuration before describing an integration as complete.

### Approved target direction

The planned full migration targets Supabase Auth, Supabase PostgreSQL, Supabase Storage, and PostgreSQL Row Level Security (RLS). The target architecture follows the Three-Tier Architecture documented in `docs/architecture/`.

The Supabase foundation is implemented in local migration and code files. The remote project has **not** had migrations applied, and buckets/policies exist only as local migrations until the preflight procedure is completed.

## Documentation

Start with [`docs/README.md`](docs/README.md) and [`AGENTS.md`](AGENTS.md).

| Directory | Contents |
|---|---|
| `docs/project/` | Project overview, scope, team structure |
| `docs/requirements/` | Requirements, backlog, acceptance criteria |
| `docs/architecture/` | System, frontend, and Supabase architecture |
| `docs/database/` | Schema, ERD, RLS, storage policies |
| `docs/design/` | Green Teal design system and UI/UX references |
| `docs/development/` | Installation, coding, Git, testing, maintenance |
| `docs/decisions/` | Project decision log |
| `docs/ai/` | AI coding-agent instructions and workflows |

## Getting started

### Prerequisites

- Node.js compatible with the installed Next.js release
- npm
- Local MySQL configured to match `prisma/schema.prisma`

### Installation

```bash
git clone https://github.com/Kestara-Portal/Kestara.git
cd Kestara
npm install
```

Create a local environment file:

**PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux**
```bash
cp .env.example .env
```

Update `DATABASE_URL` in `.env` to match your local MySQL database and `prisma/schema.prisma`.

Generate the Prisma client and start the development server:

```bash
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Database migration and seeding commands are intentionally not prescribed here. Inspect the current Prisma schema and migration history, then follow the approved team procedure. Do not run destructive database commands against shared data.

## Available scripts

These scripts are currently defined in `package.json`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build application |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:start` / `db:stop` | Start/stop local Supabase |
| `npm run db:reset` | Reset LOCAL database (migrations + seed) |
| `npm run db:test` | pgTAP database tests |
| `npm run test:rls` | E01 RLS integration checks |
| `npm run seed:users` | Create synthetic dev users |
| `npm run provision:admin` | Controlled admin provisioning |

See `docs/development/` for the full guides. Do not report a check as passing unless it was actually run.

## Environment and security

- Never commit `.env`, `.env.local`, production environment files, credentials, tokens, or private keys.
- `.env.example` is a placeholder and must contain no real secrets.
- Keep privileged Supabase keys server-side if and when Supabase is implemented.
- Enforce authorization in server-side logic and database policies; hiding UI controls is not authorization.
- Do not place private candidate documents or sensitive uploads in publicly readable storage.

## Team workflow

Jira is used to manage assignments and work status. GitHub stores source code and code review history.

- Work on a dedicated branch; do not develop directly on `main`.
- Include the real Jira issue key in branch names, commits, and pull requests where applicable.
- Push work to your own remote branch.
- Open a Pull Request targeting `main`.
- Request review from another team member before merging.
- Do not force-push, rewrite shared history, or change repository settings without authorization.
- Do not create a `develop` branch unless the PM/team explicitly agrees.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and `docs/development/git-workflow.md`.

## Project identity

The approved visual direction is **Green Teal**, with primary brand color `#176B62`. See `docs/design/ui-ux-references.md`. Use reference products for UX inspiration, not for copying their identity or exact layouts.
