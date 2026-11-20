# Kestara — Repository Maintenance Checklist

> **Status:** Draft checklist for the current local cleanup.

## Current Known Findings from the Previously Shared Audit

- Local branch and remote branch observed: `main` and `origin/main`.
- No `develop` branch was observed in that snapshot.
- Last observed local status included untracked `audit.txt`.
- `.gitignore` ignores `.env*`; a whitelist may be needed for `.env.example`.
- `env.example` contained a legacy MySQL connection string and Prisma-oriented comments.
- `README.md` was still the default Next.js starter text.
- A commit message `.env` was investigated; `git show --stat` showed the changed file was `env.example`, and Git history/path checks returned no tracked `.env` or `.env.local` at the checked refs.
- This is not a full secret scan of every historical blob. Do not claim that the entire repository history is proven free of secrets.

### Cleanup Checklist

### Completed
- [x] Review `audit.txt`; retain as local-only audit evidence.
- [x] Replace starter README with project documentation (pending final verification of the latest revision).
- [x] Add and verify `AGENTS.md`.
- [x] Add documentation index and project documentation.
- [x] Lift repository push freeze by Project Owner on 2026-11-07.
- [x] Review `.gitignore` and explicitly allow `.env.example`.
- [x] Standardize `env.example` to `.env.example`.
- [x] Preserve MySQL configuration until Supabase migration begins.

### In Progress
- [ ] Review and finalize repository README.
- [ ] Review GitHub Issue and Pull Request templates.

### Pending Team Approval
- [ ] Confirm branch strategy with PM.
- [ ] Obtain PM approval for repository contribution templates.
- [ ] Configure branch protection for `main`.

### Pending Technical Audit
- [ ] Add CI workflow after scripts and test tools are verified.
- [ ] Perform secret scanning using an approved tool.
- [ ] Rotate any exposed credentials if discovered.
- [ ] Review unused dependencies and Prisma/NextAuth references before removal.
- [ ] Review Supabase migration readiness before implementation.

## Safety

Do not rewrite remote history or force-push as a cleanup shortcut. If a credential was committed, rotate/revoke it first; history cleanup is a separate coordinated operation.
