# Kestara — Local Development Setup

> Status: reflects the current repository (Supabase foundation added; legacy MySQL/Prisma/NextAuth still present until migration is verified).

## 1. Prerequisites

- Git
- Node.js compatible with Next.js 16 (Node 24 used by the team environment)
- npm (matching `package-lock.json`)
- Docker Desktop (required for local Supabase)
- Supabase CLI (available via the project devDependency `supabase`)

## 2. Clone and install

```bash
git clone https://github.com/Kestara-Portal/Kestara.git
cd Kestara
npm install
```

## 3. Environment configuration

```powershell
Copy-Item .env.example .env.local
```

```bash
cp .env.example .env.local
```

Fill values securely (see `docs/development/environment.md`). Never commit `.env.local`, `.env`, or real keys.

File split (important):

- `.env.local` — Supabase credentials + Next.js overrides (higher priority for Next.js).
- `.env` — legacy `DATABASE_URL` (Prisma 5 CLI reads **only** `.env`) and optional `NEXTAUTH_*`.
- Node scripts load `.env` then `.env.local` (`.env.local` wins).

## 4. Run the app

```bash
npm run dev      # http://localhost:3000
```

The Supabase auth routes are available at `/auth/login` and `/auth/register`. The legacy `/login` and `/register` pages still work with NextAuth/Prisma.

## 5. Local Supabase

See `docs/development/supabase-local.md`. Summary:

```bash
npm run db:start
npx supabase status
npm run db:reset      # LOCAL ONLY
npm run seed:users
```

## 6. Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:start` / `db:stop` | Start/stop local Supabase |
| `npm run db:reset` | Reset LOCAL database (migrations + seed) |
| `npm run db:test` | pgTAP database tests |
| `npm run test:rls` | E01 RLS integration checks |
| `npm run seed:users` | Create synthetic dev users |
| `npm run provision:admin` | Controlled admin provisioning |
| `npm run db:push` / `db:diff` | Remote push / diff (remote: preflight + approval only) |

## 7. Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## 8. Troubleshooting

- Docker errors → ensure Docker Desktop is running before `db:start`.
- Supabase env errors → verify `.env.local` names; never paste secrets into chat.
- Database errors → confirm whether the branch uses legacy MySQL/Prisma or local Supabase.
- Build errors → read the first relevant error before changing configuration.

## 9. Legacy migration note

MySQL + Prisma + NextAuth are retained until the Supabase replacement passes regression testing. Do not remove them during migration work.
