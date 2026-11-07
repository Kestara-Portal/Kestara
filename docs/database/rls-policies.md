# Kestara — Row Level Security (RLS) Blueprint

> **Status:** Draft — policy matrix only; no production policies have been applied  
> **Target:** Supabase PostgreSQL  
> **Purpose:** Define row-level access expectations before writing SQL policies.

## 1. Security Principles

1. Enable RLS on every exposed application table unless a documented exception is approved.
2. Define `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies separately where needed.
3. Apply least privilege.
4. Verify identity using the authenticated Supabase user, not a user ID supplied by the browser.
5. Verify role and ownership in trusted database/server logic.
6. Restrict database grants as well as row policies.
7. Do not expose service-role/secret keys to browsers.
8. Do not assume an Admin role means unrestricted access to all sensitive user content.
9. Test both allowed and denied paths for every role.
10. Treat Storage object policies separately from table policies.

## 2. Role Definitions

- `jobseeker`
- `mentor`
- `recruiter`
- `admin`

Public registration is permitted only for the first three. Admin provisioning is controlled.

The authoritative role source and helper-function implementation must be finalized before policies are written. Do not trust user-editable metadata.

## 3. Proposed Access Matrix

Legend:
- **Own**: only rows owned by the authenticated user.
- **Scoped**: only records connected to an authorized company, job, session, or topic.
- **Published**: records intentionally published for the relevant audience.
- **Controlled**: server-side or narrowly scoped administrative operation.
- **Deny**: no direct access.
- **TBD**: product requirement must decide.

| Data area | Jobseeker | Mentor | Recruiter | Admin |
|---|---|---|---|---|
| Own `users` profile | Read/update allowed fields | Own | Own | Controlled account-management fields |
| Other users' private profile fields | Deny by default | Deny | Deny | Controlled, minimum necessary |
| `user_skills` | Own CRUD | Own CRUD | Own CRUD | No blanket content access |
| `portfolio_items` | Own CRUD | Own CRUD | Own CRUD | No blanket content access |
| Role extension profile | Own | Own | Own | Controlled |
| Company records | Published/read scope TBD | Deny unless approved | Scoped membership | Controlled |
| Company membership | Deny | Deny | Own membership/read scoped | Controlled |
| Jobs | Read published | Read published if product allows | Scoped company CRUD | Controlled |
| Job skill requirements | Read with published job | Read with published job if allowed | Scoped company CRUD | Controlled |
| Applications | Create/read/cancel own | Deny unless explicitly required | Scoped read and status update | Controlled |
| Blind Profile projection | Deny | Deny | Scoped authorized read | No blanket identity bypass |
| Learning modules | Read published | Read published if included in audience | Read published if included in audience | CRUD |
| Learning progress | Own | Own if learning is enabled for Mentor | Own if enabled for Recruiter | Controlled support access |
| Assessment question bank | Attempt-safe projection only | TBD | TBD | CRUD |
| Assessment answer keys | Deny | Deny | Deny | Controlled |
| Assessment attempts/results | Own | Own if eligible | Own if eligible | Controlled |
| Mentor availability | Read according to booking UX | Own CRUD | Deny unless approved | Controlled |
| Mentorship sessions | Own as requester | Own as mentor | Deny | Controlled |
| Mentorship messages | Own session participants | Own session participants | Deny | Controlled moderation only if approved |
| Forum topics/posts | Authenticated read/create; own edit/delete | Same | Same | Moderation |
| Admin audit logs | Deny | Deny | Deny | Controlled read; server-controlled insert |

This matrix is a starting proposal. Final permissions must match approved PBI acceptance criteria and privacy requirements.

## 4. Table-Specific Policy Requirements

### `public.users`

- A user can read their own profile.
- A user can update only approved profile fields on their own row.
- A user cannot update `role`, `account_status`, or other privileged fields.
- Admin account listing and status changes must use a controlled administrative path.
- Do not expose all private profile fields to every authenticated user.

### `public.user_skills` and `public.portfolio_items`

- SELECT/INSERT/UPDATE/DELETE must enforce `owner_id = auth.uid()` (using the actual column `user_id`).
- INSERT must reject a supplied `user_id` that differs from the authenticated user.
- UPDATE must validate both existing-row ownership and new-row ownership.
- Only Jobseeker, Mentor, and Recruiter may create/manage these records.
- Other users must not directly query private records.
- Any public or recruiter-facing presentation must use a separately approved projection.

### Company and vacancy data

- A Recruiter may act only for a company where the user has an approved active membership/ownership relationship.
- A Recruiter cannot edit another company's data.
- Published job visibility must be explicit.
- Draft/closed job visibility must be restricted according to approved business rules.
- Admin operations must be controlled and audited.

### Applications and Blind Profile

- A Jobseeker may create an application for an eligible job and access their own application.
- A Jobseeker may cancel only their own application and only in allowed lifecycle states.
- A Recruiter may access applications only for jobs belonging to a company they are authorized to manage.
- Recruiter status updates must follow the approved status transition rules.
- Blind profile data must be exposed through a field allowlist in a controlled view/RPC/server operation.
- Do not grant recruiters direct unrestricted SELECT on candidate identity tables as a shortcut.
- Do not reveal identity fields through joins, object names, file URLs, or error messages.

### Micro-learning

- Users may read published content available to their role.
- Admin manages content.
- Users may read/update only their own progress.
- Prevent users from assigning progress to another user.

### Skill assessment

- Admin manages assessment definitions and question bank.
- Candidates receive only the question and option data needed for an active attempt.
- Correct answers and scoring keys must not be available through client queries.
- Candidates access only their own attempts, answers, and results.
- Score calculation must occur in a trusted path.

### Mentorship

- Mentor manages their own availability.
- Jobseeker creates and reads their own session requests.
- Mentor reads/updates sessions assigned to them.
- Both parties may cancel only under approved cancellation rules.
- Messaging, if implemented, is limited to authorized session participants.

### Forum

- Authenticated users may read content according to forum visibility.
- Authors may edit/delete their own content according to moderation rules.
- Admin moderation must be controlled.
- A deleted post's replies and audit trail require an explicit retention rule.

### Audit logs

- Ordinary users cannot read, update, or delete administrative audit logs.
- Insertions must be server-controlled.
- Only authorized administrative/audit roles may read the minimum required fields.

## 5. Helper Functions and Recursion

Policy implementation may need helper functions such as:
- current application role
- is active account
- is active member of company
- can access application/job
- is participant in mentorship session

If a helper function reads a table protected by RLS, avoid accidental recursive policy evaluation. A carefully reviewed `SECURITY DEFINER` function may be appropriate, but it must:
- Use a fixed safe `search_path`.
- Fully qualify referenced objects.
- Avoid dynamic SQL unless necessary.
- Perform explicit authorization checks.
- Expose only the minimum result.
- Be granted only to required database roles.
- Be tested for privilege escalation.

Do not create a broad `is_admin()` bypass that grants unrestricted access to all sensitive records.

## 6. RLS Test Matrix

Test with separate authenticated identities for all four roles, plus an unauthenticated client.

| Test | Expected result |
|---|---|
| Unauthenticated user reads protected profile | Denied |
| Jobseeker reads own profile | Allowed |
| Jobseeker updates own bio | Allowed |
| Jobseeker changes own role to Admin | Denied |
| Jobseeker changes own account status | Denied |
| Jobseeker reads another user's private skill | Denied |
| Mentor updates own skill | Allowed |
| Mentor updates Jobseeker's skill | Denied |
| Recruiter deletes another Recruiter's portfolio | Denied |
| Recruiter edits company without membership | Denied |
| Recruiter reads application for unrelated company | Denied |
| Recruiter reads approved blind profile for authorized job | Allowed, redacted fields only |
| Candidate reads assessment correct answer | Denied |
| Candidate reads own assessment result | Allowed |
| User reads another user's private Storage file | Denied |
| Deactivated user performs protected mutation | Denied |
| Ordinary user reads admin audit log | Denied |

## 7. Implementation Gate

Do not write production RLS SQL until:
- Final table names and ownership columns are approved.
- Role source and helper functions are approved.
- Company membership rules are approved.
- Blind profile field allowlist is approved.
- Status transition rules are approved.
- Storage policies are designed.
- Automated allow/deny tests are prepared.

---

**Status:** Draft access-control blueprint. It is not a claim that RLS is currently enabled or correctly configured in a live Supabase project.
