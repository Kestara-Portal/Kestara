# Kestara — Team Structure and Collaboration

> **Status:** Draft  
> **Known context:** Team has 8+ members, Jira board already exists, role allocation is assigned, and the current user is not the PM. Individual names and assignments are intentionally not guessed.

## 1. Working Roles

Use the existing Jira assignments as the authoritative record of who performs each role. This document describes responsibilities, not named assignments.

| Responsibility | Expected duties |
|---|---|
| Project Manager (PM) | Maintains project plan, coordinates members, manages sprint/backlog, resolves scheduling and delivery coordination. |
| Product Owner / requirement authority | Clarifies product value, prioritizes scope, accepts or rejects product behavior. This may be the PM or another assigned person. |
| Technical Lead / Architect | Reviews architecture, data model, integration contracts, and technical consistency. |
| Frontend Developer(s) | Implements Next.js pages, components, forms, and client interactions. |
| Backend / Database Developer(s) | Implements server-side use cases, Supabase schema, migrations, RLS, and Storage policies. |
| UI/UX Designer(s) | Produces user flows, wireframes, visual system, and interaction specifications. |
| QA / Tester(s) | Defines test cases, verifies acceptance criteria, records defects, and performs regression testing. |
| Documentation / Repository Maintainer | Maintains docs, GitHub hygiene, templates, and traceability. |

One member may hold multiple responsibilities if the team's assignment requires it. Do not infer a person's responsibility from their GitHub username.

## 2. Decision Rights

- Lecturer / academic requirement: controls academic constraints and grading interpretation.
- PM: coordinates project execution and team workflow.
- Product Owner / authorized requirement owner: approves product behavior and scope.
- Technical Lead: recommends technical design and identifies risks.
- Repository Admin: controls GitHub settings and merge permissions.
- Individual developer: implements assigned Jira work within approved scope.
- AI agents: assist with analysis and implementation; they do not approve scope or merge their own work.

If the team has not formally named a Product Owner or Technical Lead, ask the PM to clarify who holds those decision rights.

## 3. Communication and Traceability

- Jira records work status, assignee, sprint, priority, and acceptance criteria.
- GitHub records source code, commits, branches, and Pull Requests.
- `docs/` records reviewed requirements and technical decisions.
- Team chat is for coordination; decisions that affect scope or architecture must be copied into Jira or the decision log.

## 4. Current Repository Maintenance Rule

The Project Owner instructed members not to push while the repository is being cleaned up. This freeze remains active until the Project Owner explicitly lifts it.

During the freeze:
- Do not push, force-push, merge, or rewrite remote history.
- Do not change GitHub branch protection or repository settings without approval.
- Local documentation work and local review are permitted.
- Coordinate any urgent shared-repository change with the Project Owner.
