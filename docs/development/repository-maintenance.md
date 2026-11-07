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

## Cleanup Checklist

- [ ] Review `audit.txt`; decide whether it is local-only or approved documentation.
- [ ] Review `.gitignore` and explicitly allow safe `.env.example` if that filename is adopted.
- [ ] Rename `env.example` to `.env.example` only after updating references and reviewing migration timing.
- [ ] Replace starter README with project README.
- [ ] Add/verify `AGENTS.md`.
- [ ] Add documentation index and approved docs.
- [ ] Decide branch strategy with PM.
- [ ] Add PR and issue templates after PM approval.
- [ ] Add CI workflow after scripts and test tools are verified.
- [ ] Perform a secret scan using an approved tool; rotate any exposed credential.
- [ ] Review unused dependencies and Prisma/NextAuth references before removal.
- [x] Push freeze lifted by Project Owner on 2026-11-07.

## Safety

Do not rewrite remote history or force-push as a cleanup shortcut. If a credential was committed, rotate/revoke it first; history cleanup is a separate coordinated operation.
