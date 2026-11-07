# Kestara — Functional Requirements

> **Status:** Draft  
> **Source:** Eight CRUD-oriented module descriptions supplied by the Project Owner.  
> **Note:** Preserve the lecturer's rule: one module is one Epic; Create, Read, Update, and Delete are separate PBI/User Stories.

## 1. Roles

- **Jobseeker (Pencari Kerja):** manages professional profile, explores vacancies, applies for jobs, accesses learning and assessments, requests mentorship, and participates in the community.
- **Mentor:** manages professional profile, skills and portfolio, availability, and mentorship sessions.
- **Recruiter (Rekruter):** manages professional profile, skills and portfolio, company/job data within authorization, and candidate application screening.
- **Admin (Administrator):** performs authorized account, content, assessment, company, and moderation management.

Public registration is for Jobseeker, Mentor, and Recruiter. Admin is provisioned through a controlled process.

## 2. Module Requirements

### FR-01 — Kelola Akun & Profil Pengguna

- **Create:** Jobseeker, Mentor, and Recruiter can create an account and complete a new profile.
- **Read:** Users can view their own profile details on the dashboard.
- **Update:** Users can update profile information, Skills Matrix, Portfolio, and password.
- **Delete:** Admin can delete or deactivate accounts that violate system rules.
- **Shared data decision:** Skills Matrix and Portfolio apply to Jobseeker, Mentor, and Recruiter.

### FR-02 — Kelola Lowongan Pekerjaan

- **Create:** Company partners or Recruiters can create and publish vacancies with skill criteria.
- **Read:** Jobseekers can view available vacancies.
- **Update:** Recruiters can update vacancy details, qualifications, and descriptions.
- **Delete:** Recruiters or Admin can delete or close inactive vacancies.

### FR-03 — Kelola Materi Micro-Learning

- **Create:** Admin can add training material or new micro-learning content.
- **Read:** Jobseekers can read, watch, or access available training material.
- **Update:** Admin can update text, material links, or learning-module progress status.
- **Delete:** Admin can delete expired or irrelevant modules.
- **Clarification required:** The supplied Update statement combines content maintenance and progress status. Confirm whether Admin updates module publication/progress metadata or an individual learner's progress. Do not implement an assumed interpretation.

### FR-04 — Kelola Data Mitra Perusahaan

- **Create:** Admin or Recruiter can register a new company profile.
- **Read:** The system displays company details when a Jobseeker reviews a vacancy.
- **Update:** Recruiters can update company information, description, and website.
- **Delete:** Admin can delete duplicate companies or companies that are no longer partners.
- **Clarification required:** Define how a Recruiter becomes authorized to create or manage a company.

### FR-05 — Kelola Lamaran Pekerjaan & Blind Profile

- **Create:** Jobseekers can submit applications to selected vacancies.
- **Read:** Recruiters can view applicants through a masked Blind Profile and see the matching score.
- **Update:** Recruiters can update application status, for example from screening to interview.
- **Delete:** Jobseekers can cancel or delete submitted application records/documents.
- **Clarification required:** Define masked fields, matching-score formula, identity reveal stage, and cancellation/reapplication behavior.

### FR-06 — Kelola Tes Keterampilan (Skill Assessment)

- **Create:** Admin can create question banks or new competency-test categories.
- **Read:** Jobseekers can view/read competency-assessment questions being tested.
- **Update:** Admin can update assessment descriptions; the system updates the candidate's assessment score or certificate.
- **Delete:** Admin can remove competency tests that are no longer required.
- **Clarification required:** Define question types, answer-key protection, scoring, retakes, and certificate issuance. Candidate-facing question access must not expose correct answers.

### FR-07 — Kelola Jadwal & Sesi Mentorship

- **Create:** Jobseekers can request a career-guidance/mentorship schedule from a Mentor.
- **Read:** Mentor and Jobseeker can view consultation schedules and read messages in the forum/session.
- **Update:** Mentor can update availability, session approval status, or notes.
- **Delete:** Mentor or Jobseeker can cancel or delete a planned mentorship session.
- **Clarification required:** Confirm whether "pesan di forum" means mentorship-session messages or the separate community forum.

### FR-08 — Kelola Forum Diskusi Komunitas

- **Create:** Users can create a discussion topic or post.
- **Read:** Users can read conversations, discussion topics, and replies.
- **Update:** Users can edit posts they created.
- **Delete:** Admin or the post author can delete inappropriate posts.

## 3. Cross-Module Requirements

- Every protected operation must verify authenticated identity and authorization.
- A user's editable profile data must be separated from role and administrative account controls.
- Recruiter access to company, vacancy, and application data must be scoped to authorized company/job relationships.
- Blind Profile data must be filtered before it reaches the Recruiter UI.
- Private files must be protected by Storage policies and authorized access.
- All CRUD operations must provide clear success, validation, and error feedback.
- Status transitions must be validated; a user must not set arbitrary status values.
- Changes must be traceable to Jira PBI and tests.

## 4. Requirement Traceability

Use the Epic/PBI mapping in `product-backlog.md`. Jira remains the source of truth for issue keys, assignees, status, sprint, and priority.
