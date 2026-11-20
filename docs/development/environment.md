# Environment Configuration Guide

Copy `.env.example` and split values across two Git-ignored files (never commit real values).

```bash
# PowerShell
Copy-Item .env.example .env.local
# macOS / Linux
cp .env.example .env.local
```

## Load order and file strategy

| File | Loaded by | Use for |
|---|---|---|
| `.env` | Next.js, Prisma 5 CLI, Node scripts | Legacy `DATABASE_URL` (Prisma 5 reads **only** `.env`), shared defaults |
| `.env.local` | Next.js (higher priority), Node scripts | Supabase credentials + local overrides |

- **Next.js 16:** `.env.local` overrides `.env`.
- **Prisma 5 CLI:** reads `.env` only, so keep `DATABASE_URL` in `.env`.
- **Node scripts** (`seed:users`, `provision:admin`, `test:rls`): load `.env` first, then `.env.local`, so `.env.local` wins — consistent with Next.js.
- Legacy `DATABASE_URL` and `NEXTAUTH_*` remain required while the legacy stack is active.

Recommended local split:

- `.env` → `DATABASE_URL` (+ `NEXTAUTH_SECRET`, `NEXTAUTH_URL` if testing legacy login).
- `.env.local` → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (optionally repeat `NEXTAUTH_*`).

## Variables

### Application
| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | public | Optional / reserved | Reserved for absolute links or auth redirects; not read by current code |

### Supabase (target backend)
| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Yes | Current API Keys standard: publishable key (browser-safe, RLS-enforced) |
| `SUPABASE_SECRET_KEY` | **server-only** | Yes* | Current API Keys standard: secret key for narrow admin/system operations |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Legacy fallback | Temporary fallback accepted only if the publishable key is unset |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** | Legacy fallback | Temporary fallback accepted only if the secret key is unset |

\* The secret key is only required for server-side admin operations (admin provisioning, seed, RLS tests), never for the browser.

Precedence implemented in code:

- Publishable key: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → fallback `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Secret key: `SUPABASE_SECRET_KEY` → fallback `SUPABASE_SERVICE_ROLE_KEY`.

Rules:

- Never expose `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_ROLE_KEY`) through `NEXT_PUBLIC_*`, client components, logs, or docs.
- Only `lib/supabase/admin.ts` and server-side scripts may read the secret key.
- Rotate any key that may have been exposed.
- Remove the legacy fallbacks once all environments and the local CLI output use the new names.

**Where the values come from:**

- **Local development:** `npx supabase status -o env` prints the local API URL and keys. Map `API_URL → NEXT_PUBLIC_SUPABASE_URL`. Use `PUBLISHABLE_KEY → NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SECRET_KEY → SUPABASE_SECRET_KEY`. If your CLI version only prints the legacy names, `ANON_KEY`/`SERVICE_ROLE_KEY` act as fallbacks (or copy them into the new names). Do not print or commit the output.
- **Remote/production:** Supabase Dashboard → Project Settings → API Keys. Use the publishable key for the public variable and the secret key only server-side.

### Development scripts (optional, local only)
| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `DEV_SEED_PASSWORD` | server/dev | Optional | Password for synthetic seed users (`npm run seed:users`); scripts use a documented dev default if unset |

### Legacy stack (kept until migration is verified)
| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `DATABASE_URL` | server-only | Yes (legacy) | Legacy MySQL + Prisma. Must be in `.env` for Prisma 5 CLI |
| `NEXTAUTH_SECRET` | server-only | Yes (legacy login) | Legacy NextAuth secret |
| `NEXTAUTH_URL` | server-only | Yes (legacy login) | Legacy NextAuth base URL |

Do not delete the legacy variables until the Supabase replacement passes regression testing.

## Security

- `.env*` is gitignored except `.env.example`.
- `.env.example` contains placeholders only.
- Never paste connection strings or keys into commits, Jira, chat, or screenshots.
