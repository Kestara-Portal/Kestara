# Kestara — Local Development Setup

> **Status:** Draft. Confirm exact scripts and versions from the current `package.json` before publishing this as final setup instructions.

## 1. Prerequisites

- Git.
- Node.js version compatible with the repository's Next.js version.
- The package manager indicated by the committed lockfile (npm, pnpm, or yarn).
- A code editor.
- Local environment configuration supplied securely by the project maintainer.

Supabase setup is not yet available according to the last project status. Do not invent project URL or keys.

## 2. Clone the Repository

```bash
git clone https://github.com/Kestara-Portal/Kestara.git
cd Kestara
```

## 3. Install Dependencies

Use only the package manager matching the committed lockfile.

```bash
npm install
```

If the repository uses `pnpm-lock.yaml` or `yarn.lock`, use the corresponding package manager and its frozen/immutable install mode instead. Do not create multiple lockfiles.

## 4. Environment Configuration

- Copy the approved example environment file to the local environment filename required by the app.
- Obtain values through the project maintainer's secure channel.
- Never commit `.env`, `.env.local`, real keys, or database passwords.
- Do not put Supabase secret/service-role keys in `NEXT_PUBLIC_*` variables.
- The current legacy MySQL/Prisma setup and future Supabase setup must be documented separately during migration.

## 5. Run the Application

Check `package.json` scripts first. If a `dev` script exists:

```bash
npm run dev
```

Open `http://localhost:3000`.

## 6. Verification Commands

Run only scripts that exist in the current `package.json`:

```bash
npm run lint
npm run build
```

Type-check and test commands may differ. Check the scripts section before running or documenting them.

## 7. Troubleshooting

- Dependency errors: confirm Node.js and package-manager versions.
- Environment errors: verify local variable names and do not paste secrets into chat.
- Database errors: confirm whether the branch still uses legacy MySQL/Prisma or has migrated to Supabase.
- Build errors: inspect the first relevant error and reproduce before changing configuration.

## 8. Contribution Safety

The temporary repository push freeze has been lifted by the Project Owner.

Developers may push completed work to their dedicated branches and use Pull Requests for integration.

Never push directly to main, force-push shared branches, or rewrite shared history without explicit authorization.
