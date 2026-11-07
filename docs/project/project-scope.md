# Kestara — Project Scope

> **Status:** Draft  
> **Basis:** Product Backlog descriptions supplied by the Project Owner in this conversation. Validate against the approved academic proposal and lecturer instructions.

## 1. In Scope

The current product scope consists of eight modules:

1. Kelola Akun & Profil Pengguna.
2. Kelola Lowongan Pekerjaan.
3. Kelola Materi Micro-Learning.
4. Kelola Data Mitra Perusahaan.
5. Kelola Lamaran Pekerjaan & Blind Profile.
6. Kelola Tes Keterampilan (Skill Assessment).
7. Kelola Jadwal & Sesi Mentorship.
8. Kelola Forum Diskusi Komunitas.

The system supports four application roles: Jobseeker, Mentor, Recruiter, and Admin. Public registration is intended for Jobseeker, Mentor, and Recruiter. Admin provisioning must be controlled.

Skills Matrix and Portfolio apply to Jobseeker, Mentor, and Recruiter.

The selected target backend platform is Supabase (PostgreSQL, Auth, Storage, and RLS). The migration strategy is full migration from the previous MySQL/Prisma/NextAuth implementation. Supabase has not yet been created according to the latest status provided by the owner.

## 2. Out of Scope Until Approved

The following must not be added as committed scope without approval:

- Payments, subscriptions, or billing.
- Automated job matching formula or AI ranking.
- Automated identity reveal rules for Blind Recruitment.
- External job-board integrations.
- Video conferencing infrastructure for mentorship.
- Chatbot or generative AI features inside the product.
- Mobile native applications.
- Additional roles beyond the four agreed roles.

These may be considered later, but an AI agent must not implement them based on assumption.

## 3. Scope Boundaries and Open Questions

- Exact job matching formula and score weights: TBD.
- Affirmative-action policy and calculation: TBD.
- Blind Profile fields and identity reveal stage: TBD.
- Company verification and recruiter-company membership: TBD.
- Learning content structure and progress definition: TBD.
- Assessment question types, scoring, retakes, and certificate rules: TBD.
- Mentorship scheduling, timezone, rescheduling, and messaging details: TBD.
- Forum moderation and deletion/retention behavior: TBD.
- Account retention and permanent deletion policy: TBD.

## 4. Change Control

A scope change must:
1. Be recorded in Jira or the team's approved decision channel.
2. Identify the affected Epic/PBI and acceptance criteria.
3. Identify database, API, UI, security, and testing impacts.
4. Be approved by the authorized PM/Project Owner.
5. Be reflected in the relevant documentation.

Do not treat a suggestion in a Draft document as approved scope.
