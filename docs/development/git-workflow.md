# Kestara — Git and GitHub Workflow

> **Status:** Draft proposal  
> **Current known state from audit:** only `main` was visible locally/remotely; no `develop` branch was confirmed.  
> **Maintenance rule:** The temporary push freeze has been lifted by the Project Owner. Use dedicated branches and Pull Requests for collaboration.

## 1. Repository Principles

- `main` should represent the stable integration/release line once branch protections are agreed.
- Do not assume a `develop` branch exists.
- Do not create or rename shared branches without PM/Project Owner approval.
- Work should be traceable to Jira PBI.
- Use Pull Requests for review once the team adopts that workflow.
- Never commit secrets, `.env` files, generated build output, or personal data.

## 2. Proposed Branch Model

Subject to PM approval:

```text
main
  └── develop (optional integration branch, only if approved)
        ├── feat/<jira-key>-short-description
        ├── fix/<jira-key>-short-description
        └── docs/<jira-key>-short-description
```

If the PM chooses a trunk-based workflow, use short-lived feature branches from `main` and PRs back to `main`. Do not impose both models at once.

## 3. Branch Naming

Examples using placeholders:

- `feat/KST-123-user-registration`
- `fix/KST-124-profile-validation`
- `docs/KST-125-project-overview`

Replace `KST-123` with the actual Jira issue key. Do not invent issue keys.

## 4. Commit Convention

Recommended format:

```text
<type>(<scope>): <imperative summary> (<JIRA-KEY>)
```

Types:
- `feat`: new functionality
- `fix`: bug fix
- `docs`: documentation
- `style`: formatting/UI styling without behavior change
- `refactor`: code restructuring
- `test`: tests
- `chore`: maintenance/configuration

Examples:

```bash
git commit -m "feat(auth): add registration form (KST-123)"
git commit -m "docs(architecture): document Supabase target (KST-124)"
```

Use actual Jira keys. Keep commits focused and explain meaningful changes.

## 5. Pull Request Checklist

Every PR should state:
- Jira issue key and link.
- What changed and why.
- Scope included and excluded.
- Screenshots for UI changes.
- Test commands and results.
- Database migration/RLS/Storage impact.
- Environment variable changes (names only, never values).
- Security/privacy impact.
- Documentation updated.
- Known limitations.

## 6. Review Rules

- Author should not be the sole approver of a sensitive change.
- Review authorization, RLS, data exposure, migrations, and file access carefully.
- Do not merge with failing required checks.
- Resolve review comments or document why a comment is not applied.
- Protect `main` after PM/Admin approval of branch protection settings.

## 7. Repository Collaboration Rules

The temporary repository maintenance freeze has been lifted.

Normal branch-based collaboration is permitted.

- Push work to dedicated feature, fix, or documentation branches.
- Do not push directly to main.
- Use Pull Requests for integration.
- Review changes before merging.
- Coordinate shared changes with the relevant team members.
- Never force-push or rewrite shared history without explicit authorization.
- Follow the PM-approved branch strategy.

## 8. Safe Local Checks

```bash
git status --short --branch
git diff --check
git diff
```

Before pushing a branch:

```bash
git fetch origin
git status --short --branch
```

Follow the PM-approved branch and synchronization procedure. Do not run destructive Git commands to "make it clean".
