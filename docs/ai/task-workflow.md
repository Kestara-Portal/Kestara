# Kestara — AI Task Workflow

> **Status:** Draft

## 1. Task Intake

Input must include or link:
- Actual Jira issue key.
- PBI/user story and Epic.
- Acceptance criteria.
- Assignee/owner.
- Relevant design or API references.
- Dependencies and known constraints.

If any critical information is missing, report it rather than inventing it.

## 2. Context Loading

The agent reads:
- `AGENTS.md`
- `docs/README.md`
- Project overview
- Relevant functional requirement
- Relevant acceptance criteria
- Relevant architecture/database/security/design docs
- Existing implementation files

## 3. Analysis Output

Before coding, report:
- Understanding of expected behavior.
- Current implementation findings.
- Proposed file changes.
- Data/API impact.
- Authorization and privacy impact.
- Tests required.
- Open questions and assumptions.

Approval is required for schema changes, RLS changes, destructive operations, new dependencies with architectural impact, and scope changes.

## 4. Implementation

- Work on the assigned PBI only.
- Follow existing code conventions.
- Keep changes small and reviewable.
- Do not change shared configuration without approval.
- Do not commit secrets or generated artifacts.
- Do not push or merge during the current freeze.

## 5. Verification

Run applicable lint, type-check, build, unit, integration, RLS, Storage, and end-to-end checks that are configured and available. Record exactly what ran and what did not.

## 6. Handoff

Provide the completion report defined in `agent-guide.md`. Link the Jira issue and local diff/PR when available. The human owner/reviewer decides acceptance and Git operations.

## 7. Documentation Sync

If an approved implementation changes schema, API, authorization, UI tokens, or business behavior:
- Update the relevant document.
- State whether the change is implemented or only proposed.
- Keep Draft/Approved status accurate.
- Record important decisions in `decisions/decision-log.md`.
