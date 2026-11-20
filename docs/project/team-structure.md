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

## 4. Repository Collaboration Rules

The temporary repository push freeze was explicitly lifted by the Project Owner on 2026-11-07.

Team members may now:
- Push work to their dedicated branches.
- Create feature, fix, and documentation branches.
- Submit Pull Requests for review.
- Continue local and remote development.

Team members must:
- Avoid direct pushes to main.
- Coordinate cross-module changes with relevant members.
- Follow the agreed Jira assignments.
- Avoid force-pushing or rewriting shared history without authorization.

The PM remains responsible for coordinating the team's development workflow.