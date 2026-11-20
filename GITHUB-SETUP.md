# GitHub repository setup checklist

These settings must be applied manually by a repository administrator. Adding files to Git does not change GitHub repository settings.

## Protect `main`

Open the repository on GitHub:

`Settings` -> `Rules` -> `Rulesets` -> `New ruleset` -> `New branch ruleset`

If the repository offers classic branch protection instead:

`Settings` -> `Branches` -> `Add branch protection rule`

Recommended target and rules:

- Branch pattern: `main`
- Require a pull request before merging.
- Require at least 1 approval from someone other than the PR author.
- Require conversation resolution before merging.
- Block force pushes.
- Block branch deletion.
- Do not require status checks until reliable CI checks exist.
- Do not enable a bypass for ordinary contributors.

Available settings depend on repository permissions and GitHub plan. The repository owner/admin must confirm and save the ruleset.

## Branch strategy for the team

- `main`: integrated, review-approved code.
- `feat/<JIRA-KEY>-short-description`: new functionality.
- `fix/<JIRA-KEY>-short-description`: bug fixes.
- `docs/<JIRA-KEY>-short-description`: documentation.
- `chore/<JIRA-KEY>-short-description`: maintenance.

Do not create `develop` unless the PM and team explicitly agree to a long-lived integration branch. Start each task branch from the latest `main` and integrate through a Pull Request.

## Review responsibilities for 8+ members

- Every PR has an author and at least one reviewer.
- The author must not approve their own PR.
- Cross-module work should be reviewed by someone familiar with the affected module.
- The PM coordinates priority and assignment in Jira.
- The repository owner/admin maintains repository settings.
- Do not make one person the mandatory reviewer for every module.

## Jira and GitHub

Start with manual linking:

- Put the real Jira issue key in branch names.
- Put the Jira issue key in commit messages.
- Include the Jira issue link in PR descriptions.
- Update Jira status according to the team's workflow.

Automatic development-panel links can be configured using an authorized Jira/GitHub integration. Confirm the team's Jira site and administrator permissions before installing or authorizing an integration.

## CI checks

The current `package.json` declares `lint` and `build`, but no `test` or `typecheck` script.

Before making status checks mandatory:

1. Add a GitHub Actions workflow.
2. Verify it runs successfully on pull requests.
3. Agree which checks are required.
4. Only then make those checks mandatory in the `main` ruleset.

Do not require a status check before it exists, or GitHub may block merges.
