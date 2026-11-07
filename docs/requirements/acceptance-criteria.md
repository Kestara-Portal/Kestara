# Kestara — Acceptance Criteria Baseline

> **Status:** Draft. Criteria below make the supplied PBI testable but do not settle unresolved business rules. PM/Product Owner must approve before treating them as final.

## 1. General Acceptance Rules

For every PBI:
- The actor is authenticated where the operation is protected.
- The actor is authorized for the requested resource.
- Invalid input is rejected with understandable feedback.
- Successful changes persist and are reflected on subsequent reads.
- Failure does not silently corrupt or partially update data.
- Protected data is not exposed to unauthorized roles.
- Relevant automated/manual tests are recorded.
- UI has loading, empty, success, and error states where applicable.

## 2. PBI-Specific Criteria


### E01-C

1. Given a visitor chooses one of the allowed public roles (Jobseeker, Mentor, Recruiter), when valid registration data is submitted, then the system creates an authentication identity and an associated application profile according to the approved verification flow.
2. Given a visitor attempts to register as Admin, when the request is submitted, then public registration rejects the role and does not grant administrative access.
3. Given required fields are missing or invalid, when registration is submitted, then validation errors are shown and no incomplete account is treated as successfully registered.
4. Given registration succeeds, when the user reaches the profile/dashboard flow, then the system guides the user to complete the required profile fields.

### E01-R

1. Given an authenticated user opens their dashboard profile, when the profile exists, then the system displays that user's own profile details.
2. Given a user attempts to read another user's private profile through an identifier or direct request, then access is denied unless a separately approved public projection permits it.
3. Given the profile has no optional data, then the UI displays an appropriate empty state rather than fabricated values.

### E01-U

1. Given a Jobseeker, Mentor, or Recruiter edits their own profile, skills, or portfolio, when valid changes are saved, then only the authenticated user's records are updated.
2. Given a user submits invalid data, then the system rejects the update and explains the validation issue.
3. Given a user attempts to change their role or administrative account status through profile editing, then the change is rejected.
4. Given a user changes their password, then the operation uses the approved authentication provider's secure password flow; the application does not store a plaintext password.

### E01-D

1. Given an authorized Admin selects an account for action, when the Admin confirms the approved deactivation/deletion operation, then the account state changes according to the approved lifecycle policy.
2. Given a non-Admin attempts the administrative operation, then access is denied.
3. Given the account has related applications, learning records, or mentorship history, then the system preserves or removes related data according to the approved retention policy rather than silently cascading.

### E02-C

1. Given an authorized Recruiter/company member creates a vacancy with valid required fields and skill criteria, when the vacancy is saved as draft or published, then the system persists the selected state.
2. Given a Recruiter is not authorized for the target company, then vacancy creation for that company is denied.
3. Given required vacancy fields are invalid or missing, then the system rejects publication and identifies the validation errors.

### E02-R

1. Given a Jobseeker opens the job portal, when published and active vacancies exist, then the system displays available vacancies with their approved public details.
2. Given a vacancy is draft, closed, or otherwise not public, then it is not shown as an available public vacancy.
3. Given filters or pagination are used, then results reflect the selected criteria without exposing private recruiter/company data.

### E02-U

1. Given a Recruiter has authorization for the vacancy's company, when valid vacancy details are updated, then the changes are persisted.
2. Given a Recruiter attempts to update a vacancy outside their company scope, then access is denied.
3. Given a vacancy is closed or otherwise restricted, then edits follow the approved lifecycle rules.

### E02-D

1. Given an authorized Recruiter or Admin selects an inactive vacancy, when the approved close/delete action is confirmed, then the vacancy is no longer presented as an active opportunity.
2. Given a user without the required role or company scope attempts the action, then it is denied.
3. Given applications already reference the vacancy, then history and applicant records follow the approved retention policy.

### E03-C

1. Given an Admin submits valid learning content metadata and its content/link, when saved, then the module is stored in the configured initial publication state.
2. Given a non-Admin attempts to create learning content, then access is denied.
3. Given the content link or required fields are invalid, then the system rejects the submission.

### E03-R

1. Given a Jobseeker opens the learning area, when published content is available to that audience, then the user can access the approved text, media, or link.
2. Given content is draft, archived, or unavailable to the user's audience, then it is not exposed as published learning material.
3. Given content cannot be loaded, then the UI reports the failure without marking the module as completed.

### E03-U

1. Given an Admin edits learning content, when valid changes are saved, then the updated text/link/approved module status is persisted.
2. Given a non-Admin attempts to edit learning content, then access is denied.
3. Before implementing progress changes, the team approves whether this PBI concerns module publication metadata or an individual learner's progress.

### E03-D

1. Given an Admin selects expired or irrelevant learning content, when deletion/archive is confirmed, then it is removed from the active learning catalogue according to the approved retention rule.
2. Given a non-Admin attempts the operation, then access is denied.
3. Existing learner progress is retained or handled according to the approved archival policy.

### E04-C

1. Given an Admin or authorized Recruiter submits valid company details, when the record is saved, then the company is created with the approved initial status.
2. Given a Recruiter is not authorized to register a company under the approved process, then the operation is denied.
3. Given a duplicate company is detected according to the approved duplicate rule, then the system prevents or flags duplicate creation.

### E04-R

1. Given a Jobseeker views a vacancy, when the vacancy has an associated company, then approved company details are displayed.
2. Given a company is not approved for public display, then private or unverified fields are not exposed.
3. Given company information is unavailable, then the vacancy page displays a safe fallback state.

### E04-U

1. Given a Recruiter has active authorization for a company, when valid company information is updated, then the changes are persisted.
2. Given a Recruiter is not a member/authorized manager of that company, then the update is denied.
3. Given an invalid website URL or required field is submitted, then validation prevents the update.

### E04-D

1. Given an Admin selects a duplicate or no-longer-partner company, when the approved removal action is confirmed, then the company is removed from active use according to retention rules.
2. Given a non-Admin attempts company deletion, then access is denied.
3. Given jobs or applications reference the company, then referential integrity and historical records are preserved according to approved policy.

### E05-C

1. Given an authenticated Jobseeker selects an eligible vacancy and submits the required application data, when submission succeeds, then one application record is created and associated with that Jobseeker and vacancy.
2. Given the vacancy is not accepting applications or the user is not eligible, then submission is rejected with an understandable message.
3. Given the same user submits a duplicate application, then behavior follows the approved duplicate/reapplication rule.

### E05-R

1. Given a Recruiter is authorized for the vacancy, when they view its applicants, then the system returns only the approved Blind Profile fields and matching score.
2. Given a Recruiter is not authorized for the vacancy/company, then access is denied.
3. Given the blind screening response is inspected, then prohibited identity fields, private file URLs, and identifying metadata are absent.
4. Matching score calculation and field allowlist must be approved before this criterion can be finalized.

### E05-U

1. Given a Recruiter is authorized for the vacancy, when they select a permitted next application status, then the status is updated and recorded.
2. Given a status transition is invalid or the Recruiter lacks scope, then the operation is rejected.
3. Given a status changes, then the Jobseeker sees the appropriate status according to the approved visibility rules.

### E05-D

1. Given a Jobseeker owns an application, when they request cancellation/deletion in an allowed state, then the application follows the approved cancellation lifecycle.
2. Given a user attempts to cancel another user's application, then access is denied.
3. Given the application has uploaded documents or status history, then file and history retention follow approved policy.

### E06-C

1. Given an Admin creates an assessment/category with valid required fields, when saved, then the assessment is stored in its approved initial state.
2. Given a non-Admin attempts to create an assessment, then access is denied.
3. Given invalid question-bank data is submitted, then validation prevents publication.

### E06-R

1. Given a Jobseeker starts an eligible assessment, when the attempt is authorized, then only the question and option data needed for that attempt is delivered.
2. Given a candidate queries the client-facing data source, then correct answers, scoring keys, and restricted question-bank metadata are not exposed.
3. Given the assessment is inactive or not available to the user, then access is denied.

### E06-U

1. Given an Admin updates an assessment description, when valid changes are saved, then the description is persisted.
2. Given an assessment attempt is completed, then score/certificate processing follows the approved scoring and issuance rules.
3. Given a non-Admin attempts to change assessment configuration or results, then access is denied unless a separately approved workflow grants it.
4. Scoring, retake, and certificate rules must be defined before automated result acceptance is finalized.

### E06-D

1. Given an Admin selects an obsolete assessment, when removal/archive is confirmed, then it is removed from active use according to retention rules.
2. Given a non-Admin attempts removal, then access is denied.
3. Existing attempts and certificates are retained or handled according to approved historical-record policy.

### E07-C

1. Given a Jobseeker selects an available Mentor slot and submits a request, when the request is valid, then a mentorship request is created with a pending/approved initial state as defined by the product owner.
2. Given the selected slot is unavailable or conflicts with another booking, then the request is rejected.
3. Given a user other than a Jobseeker attempts to create a request, then behavior follows the approved role rule.

### E07-R

1. Given a Jobseeker or Mentor is a participant in a session, when they open mentorship schedules, then they can see the sessions they are authorized to access.
2. Given a non-participant attempts to read a private session or its messages, then access is denied.
3. Clarify whether the referenced messages belong to mentorship sessions or the separate community forum before finalizing this PBI.

### E07-U

1. Given a Mentor owns or is assigned to a session, when they update availability or an allowed session status/note, then the change is persisted.
2. Given a Mentor attempts to update another Mentor's availability or unrelated session, then access is denied.
3. Given a requested status transition is invalid, then the system rejects it.

### E07-D

1. Given a Jobseeker requester or assigned Mentor cancels an eligible session, when the action is confirmed, then the session changes to the approved cancelled state.
2. Given an unrelated user attempts to cancel the session, then access is denied.
3. Cancellation timing, notifications, and historical retention follow approved rules.

### E08-C

1. Given an authenticated user submits a valid topic or post, when saved, then the post is associated with the author and appropriate topic.
2. Given required content is empty or violates approved validation/moderation rules, then submission is rejected or flagged according to policy.
3. Given an unauthenticated visitor attempts to create content, then access is denied unless anonymous posting is explicitly approved.

### E08-R

1. Given a user has access to the community, when they open a topic, then they can read visible topics, posts, and replies.
2. Given content is hidden or removed by moderation, then it is not exposed to ordinary readers.
3. Given pagination or sorting is used, then conversation order remains consistent with the selected rule.

### E08-U

1. Given a user edits their own post, when valid content is saved, then the post is updated and author ownership remains unchanged.
2. Given a user attempts to edit another user's post, then access is denied.
3. Given the post is locked or moderated, then editing follows the approved moderation rule.

### E08-D

1. Given the author or an authorized Admin removes a post, when the action is confirmed, then the post is hidden/removed according to the approved moderation and retention policy.
2. Given an unrelated user attempts deletion, then access is denied.
3. Replies, audit history, and references follow the approved deletion policy.

## 3. Definition of Done (DoD)

A PBI is considered ready for acceptance only when:
- Its approved acceptance criteria pass.
- Authorization is enforced on the server/database, not only in the UI.
- Relevant validation and error states are implemented.
- Relevant tests are run and evidence is attached to the Jira issue or PR.
- No secret or private user data is exposed.
- Documentation is updated if behavior, schema, or architecture changed.
- Code is reviewed according to the team's approved workflow.
- The authorized reviewer/PM/Product Owner accepts the result.

DoD does not replace the lecturer's grading criteria or the team's Jira workflow.
