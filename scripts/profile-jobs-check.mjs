#!/usr/bin/env node
// KP-7 (profile/skills/portfolio/password) and KP-35 (job create+publish)
// integration checks against an isolated, running LOCAL Supabase.
// Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
//           (fallback NEXT_PUBLIC_SUPABASE_ANON_KEY), SUPABASE_SECRET_KEY
//           (fallback SUPABASE_SERVICE_ROLE_KEY)
//           PBI_TEST_DATABASE_ISOLATED=true
// Usage: npm run test:pbi
// Never prints credentials or tokens.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const password = process.env.DEV_SEED_PASSWORD ?? "KestaraDev123!";

if (!url || !publicKey || !secretKey) {
  console.error("Missing Supabase env vars.");
  process.exit(1);
}

let isLocalUrl = false;
try {
  isLocalUrl = ["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname);
} catch {
  isLocalUrl = false;
}

if (!isLocalUrl || process.env.PBI_TEST_DATABASE_ISOLATED !== "true") {
  console.error(
    "Refusing integration test: use an isolated local Supabase and set PBI_TEST_DATABASE_ISOLATED=true.",
  );
  process.exit(1);
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function check(name, passed, detail = "") {
  results.push({ name, passed });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function authClient(email, pw = password) {
  const client = createClient(url, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: pw });
  if (error) throw new Error(`signIn failed for ${email}: ${error.message}`);
  return client;
}

async function createUser(email, fullName, role, ids) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: role === "admin" ? "jobseeker" : role },
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  ids.push(data.user.id);
  if (role === "admin") {
    const { error: roleError } = await admin
      .from("users")
      .update({ role: "admin" })
      .eq("id", data.user.id);
    if (roleError) throw new Error(`set admin role failed: ${roleError.message}`);
  }
  return data.user.id;
}

async function createCompany(name, companyIds) {
  const { data, error } = await admin
    .from("companies")
    .insert({ name })
    .select("id")
    .single();
  if (error || !data) throw new Error(`createCompany failed: ${error?.message}`);
  companyIds.push(data.id);
  return data.id;
}

async function createMembership(companyId, userId, status, adminId, membershipIds) {
  const now = new Date().toISOString();
  const row = {
    company_id: companyId,
    user_id: userId,
    membership_status: status,
    verified_by: status === "verified" || status === "revoked" ? adminId : null,
    verified_at: status === "verified" || status === "revoked" ? now : null,
    revoked_by: status === "revoked" ? adminId : null,
    revoked_at: status === "revoked" ? now : null,
  };
  const { data, error } = await admin
    .from("company_memberships")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) throw new Error(`createMembership failed: ${error?.message}`);
  membershipIds.push(data.id);
  return data.id;
}

const runId = Date.now();
const ids = [];
const companyIds = [];
const membershipIds = [];
const jobIds = [];
const emails = {
  a: `pbi.a.${runId}@kestara.test`,
  b: `pbi.b.${runId}@kestara.test`,
  mentor: `pbi.mentor.${runId}@kestara.test`,
  recruiter: `pbi.recruiter.${runId}@kestara.test`,
  recruiterB: `pbi.recruiter-b.${runId}@kestara.test`,
  admin: `pbi.admin.${runId}@kestara.test`,
  password: `pbi.pwd.${runId}@kestara.test`,
};

try {
  const idA = await createUser(emails.a, "PBI A", "jobseeker", ids);
  const idB = await createUser(emails.b, "PBI B", "jobseeker", ids);
  await createUser(emails.mentor, "PBI Mentor", "mentor", ids);
  const idR = await createUser(emails.recruiter, "PBI Recruiter", "recruiter", ids);
  const idRB = await createUser(emails.recruiterB, "PBI Recruiter B", "recruiter", ids);
  const idAdmin = await createUser(emails.admin, "PBI Admin", "admin", ids);
  const idPassword = await createUser(emails.password, "PBI Password", "jobseeker", ids);

  const companyA = await createCompany(`PBI Company A ${runId}`, companyIds);
  const companyPending = await createCompany(`PBI Company Pending ${runId}`, companyIds);
  const companyRevoked = await createCompany(`PBI Company Revoked ${runId}`, companyIds);
  const companyB = await createCompany(`PBI Company B ${runId}`, companyIds);
  const companyNoMembership = await createCompany(`PBI Company None ${runId}`, companyIds);
  const membershipA = await createMembership(companyA, idR, "verified", idAdmin, membershipIds);
  const membershipPending = await createMembership(
    companyPending,
    idR,
    "pending",
    idAdmin,
    membershipIds,
  );
  const membershipRevoked = await createMembership(
    companyRevoked,
    idR,
    "revoked",
    idAdmin,
    membershipIds,
  );
  await createMembership(companyB, idRB, "verified", idAdmin, membershipIds);

  const asA = await authClient(emails.a);
  const asB = await authClient(emails.b);
  const asMentor = await authClient(emails.mentor);
  const asRecruiter = await authClient(emails.recruiter);
  const asRecruiterB = await authClient(emails.recruiterB);
  const asAdmin = await authClient(emails.admin);

  const initialCompanies = await asRecruiter.from("companies").select("id, name");
  check(
    "recruiter sees only companies with their own verified membership",
    !initialCompanies.error &&
      initialCompanies.data?.length === 1 &&
      initialCompanies.data[0]?.id === companyA,
    initialCompanies.error?.message ?? JSON.stringify(initialCompanies.data),
  );

  const privateCompany = await asRecruiter
    .from("companies")
    .select("id")
    .eq("id", companyB);
  check(
    "recruiter cannot read another recruiter's company",
    !privateCompany.error && (privateCompany.data?.length ?? 0) === 0,
    privateCompany.error?.message ?? "",
  );

  const crossMembership = await asRecruiter
    .from("company_memberships")
    .select("id")
    .eq("user_id", idRB);
  check(
    "recruiter cannot read another user's private membership",
    !crossMembership.error && (crossMembership.data?.length ?? 0) === 0,
    crossMembership.error?.message ?? "",
  );

  const verifierColumn = await asRecruiter
    .from("company_memberships")
    .select("verified_by")
    .eq("id", membershipA);
  check(
    "recruiter cannot read private verifier identity",
    Boolean(verifierColumn.error),
    verifierColumn.error?.message ?? "column was readable",
  );

  const membershipInsertByRecruiter = await asRecruiter
    .from("company_memberships")
    .insert({ company_id: companyNoMembership, user_id: idR })
    .select("id");
  check(
    "recruiter cannot create or verify membership directly",
    Boolean(membershipInsertByRecruiter.error),
    membershipInsertByRecruiter.error?.message ?? "inserted unexpectedly",
  );
  const membershipUpdateByAdmin = await asAdmin
    .from("company_memberships")
    .update({ membership_status: "verified" })
    .eq("id", membershipPending)
    .select("id");
  check(
    "admin cannot bypass membership verification RPC with direct UPDATE",
    Boolean(membershipUpdateByAdmin.error),
    membershipUpdateByAdmin.error?.message ?? "updated unexpectedly",
  );

  const membershipDuplicate = await admin
    .from("company_memberships")
    .insert({ company_id: companyA, user_id: idR, membership_status: "pending" })
    .select("id");
  check("company membership pair is unique", Boolean(membershipDuplicate.error), membershipDuplicate.error?.message ?? "duplicate inserted");

  const invalidMembershipStatus = await admin
    .from("company_memberships")
    .insert({
      company_id: companyNoMembership,
      user_id: idR,
      membership_status: "approved",
    })
    .select("id");
  check(
    "membership status constraint rejects unrecognized values",
    Boolean(invalidMembershipStatus.error),
    invalidMembershipStatus.error?.message ?? "invalid status inserted",
  );

  const selfVerifiedRow = await admin
    .from("company_memberships")
    .insert({
      company_id: companyNoMembership,
      user_id: idR,
      membership_status: "verified",
      verified_by: idR,
      verified_at: new Date().toISOString(),
    })
    .select("id");
  check(
    "membership constraint rejects self-verification",
    Boolean(selfVerifiedRow.error),
    selfVerifiedRow.error?.message ?? "self-verification row inserted",
  );

  const companyDeleteWithMembership = await admin
    .from("companies")
    .delete()
    .eq("id", companyA)
    .select("id");
  check(
    "company foreign key preserves companies with memberships",
    Boolean(companyDeleteWithMembership.error),
    companyDeleteWithMembership.error?.message ?? "company with membership was deleted",
  );

  const selfVerify = await asRecruiter.rpc("admin_verify_company_membership", {
    p_membership_id: membershipPending,
  });
  check(
    "recruiter cannot self-verify a pending membership",
    Boolean(selfVerify.error),
    selfVerify.error?.message ?? "no error",
  );

  const pendingCompanyJob = await asRecruiter.rpc("create_job_with_skills", {
    p_company_id: companyPending,
    p_title: "Pending Membership Job",
    p_description: "Lowongan untuk menguji membership yang masih menunggu.",
    p_location: "Jakarta",
    p_employment_type: null,
    p_skills: ["TypeScript"],
  });
  check("pending membership cannot publish a company job", Boolean(pendingCompanyJob.error), pendingCompanyJob.error?.message ?? "no error");

  const revokedCompanyJob = await asRecruiter.rpc("create_job_with_skills", {
    p_company_id: companyRevoked,
    p_title: "Revoked Membership Job",
    p_description: "Lowongan untuk menguji membership yang telah dicabut.",
    p_location: "Jakarta",
    p_employment_type: null,
    p_skills: ["TypeScript"],
  });
  check("revoked membership cannot publish a company job", Boolean(revokedCompanyJob.error), revokedCompanyJob.error?.message ?? "no error");

  const noMembershipJob = await asRecruiter.rpc("create_job_with_skills", {
    p_company_id: companyNoMembership,
    p_title: "No Membership Job",
    p_description: "Lowongan untuk menguji perusahaan tanpa membership.",
    p_location: "Jakarta",
    p_employment_type: null,
    p_skills: ["TypeScript"],
  });
  check("no membership cannot publish a company job", Boolean(noMembershipJob.error), noMembershipJob.error?.message ?? "no error");

  const crossCompanyJob = await asRecruiter.rpc("create_job_with_skills", {
    p_company_id: companyB,
    p_title: "Cross Company Job",
    p_description: "Lowongan lintas perusahaan harus ditolak.",
    p_location: "Jakarta",
    p_employment_type: null,
    p_skills: ["TypeScript"],
  });
  check("verified membership for another recruiter does not authorize this recruiter", Boolean(crossCompanyJob.error), crossCompanyJob.error?.message ?? "no error");

  const verifiedByAdmin = await asAdmin.rpc("admin_verify_company_membership", {
    p_membership_id: membershipPending,
  });
  check("active admin verifies a pending membership", !verifiedByAdmin.error, verifiedByAdmin.error?.message ?? "");

  const verifiedAudit = await admin
    .from("company_memberships")
    .select("membership_status, verified_by, verified_at")
    .eq("id", membershipPending)
    .single();
  check(
    "membership verification records admin and timestamp",
    verifiedAudit.data?.membership_status === "verified" &&
      verifiedAudit.data?.verified_by === idAdmin &&
      Boolean(verifiedAudit.data?.verified_at),
    verifiedAudit.error?.message ?? JSON.stringify(verifiedAudit.data),
  );

  const pendingNowVisible = await asRecruiter
    .from("companies")
    .select("id")
    .eq("id", companyPending);
  check(
    "verified membership makes only its company visible",
    !pendingNowVisible.error && (pendingNowVisible.data?.length ?? 0) === 1,
    pendingNowVisible.error?.message ?? "",
  );

  const jobBeforeRevocation = await asRecruiter.rpc("create_job_with_skills", {
    p_company_id: companyPending,
    p_title: "Retained Job After Revocation",
    p_description: "Job lama tidak dihapus otomatis ketika membership dicabut.",
    p_location: "Jakarta",
    p_employment_type: null,
    p_skills: ["TypeScript"],
  });
  check("recruiter can publish while membership is verified", !jobBeforeRevocation.error && Boolean(jobBeforeRevocation.data), jobBeforeRevocation.error?.message ?? "");
  if (jobBeforeRevocation.data) jobIds.push(jobBeforeRevocation.data);

  const nonAdminRevoke = await asRecruiter.rpc("admin_revoke_company_membership", {
    p_membership_id: membershipPending,
  });
  check("non-admin cannot revoke a membership", Boolean(nonAdminRevoke.error), nonAdminRevoke.error?.message ?? "no error");

  const revokedByAdmin = await asAdmin.rpc("admin_revoke_company_membership", {
    p_membership_id: membershipPending,
  });
  check("active admin revokes a verified membership", !revokedByAdmin.error, revokedByAdmin.error?.message ?? "");

  const revokeAudit = await admin
    .from("company_memberships")
    .select("membership_status, verified_by, verified_at, revoked_by, revoked_at")
    .eq("id", membershipPending)
    .single();
  check(
    "membership revocation records admin and preserves verification audit",
    revokeAudit.data?.membership_status === "revoked" &&
      revokeAudit.data?.verified_by === idAdmin &&
      Boolean(revokeAudit.data?.verified_at) &&
      revokeAudit.data?.revoked_by === idAdmin &&
      Boolean(revokeAudit.data?.revoked_at),
    revokeAudit.error?.message ?? JSON.stringify(revokeAudit.data),
  );

  if (jobBeforeRevocation.data) {
    const jobAfterRevocation = await admin
      .from("jobs")
      .select("id, company_id")
      .eq("id", jobBeforeRevocation.data);
    check(
      "revocation does not destructively delete an existing job",
      !jobAfterRevocation.error &&
        jobAfterRevocation.data?.length === 1 &&
        jobAfterRevocation.data[0]?.company_id === companyPending,
      jobAfterRevocation.error?.message ?? "",
    );
  }

  const revokedCompanyHidden = await asRecruiter
    .from("companies")
    .select("id")
    .eq("id", companyPending);
  check(
    "revoked membership removes the company from the recruiter's verified list",
    !revokedCompanyHidden.error && (revokedCompanyHidden.data?.length ?? 0) === 0,
    revokedCompanyHidden.error?.message ?? "",
  );

  const noAdminVerify = await asRecruiter.rpc("admin_verify_company_membership", {
    p_membership_id: membershipRevoked,
  });
  check("non-admin cannot verify a membership", Boolean(noAdminVerify.error), noAdminVerify.error?.message ?? "no error");

  const membershipRowsForOther = await asRecruiter
    .from("company_memberships")
    .select("id")
    .eq("user_id", idRB);
  check("cross-user membership query returns no private rows", !membershipRowsForOther.error && (membershipRowsForOther.data?.length ?? 0) === 0);
  const jobseekerCompanyRead = await asA.from("companies").select("id");
  check(
    "non-recruiter cannot read recruiter company data",
    !jobseekerCompanyRead.error && (jobseekerCompanyRead.data?.length ?? 0) === 0,
    jobseekerCompanyRead.error?.message ?? "",
  );

  // -------------------------------------------------------------------------
  // KP-7 — profile update + ownership
  // -------------------------------------------------------------------------
  const ownProfile = await asA
    .from("users")
    .update({ full_name: "PBI A Updated", bio: "Bio baru" })
    .eq("id", idA)
    .select("id, full_name, bio");
  check(
    "user updates own profile",
    !ownProfile.error && (ownProfile.data?.length ?? 0) === 1,
    ownProfile.error?.message ?? "",
  );

  const otherProfile = await asA
    .from("users")
    .update({ full_name: "Hacked" })
    .eq("id", idB)
    .select("id");
  check(
    "user cannot update another profile",
    !otherProfile.error && (otherProfile.data?.length ?? 0) === 0,
    otherProfile.error?.message ?? "",
  );

  const roleChange = await asA
    .from("users")
    .update({ role: "admin" })
    .eq("id", idA)
    .select("id");
  check("user cannot change own role", Boolean(roleChange.error), roleChange.error?.message ?? "no error");

  // -------------------------------------------------------------------------
  // KP-7 — skills / portfolio
  // -------------------------------------------------------------------------
  const skillInsert = await asA
    .from("user_skills")
    .insert({ user_id: idA, skill_name: "TypeScript", category: "Engineering" })
    .select("id")
    .maybeSingle();
  check("user creates own skill", !skillInsert.error && Boolean(skillInsert.data?.id), skillInsert.error?.message ?? "");
  const skillId = skillInsert.data?.id;

  const skillUpdate = await asA
    .from("user_skills")
    .update({ skill_name: "TypeScript Lanjutan" })
    .eq("id", skillId)
    .eq("user_id", idA)
    .select("id");
  check("user updates own skill", !skillUpdate.error && (skillUpdate.data?.length ?? 0) === 1, skillUpdate.error?.message ?? "");

  const crossSkillUpdate = await asB
    .from("user_skills")
    .update({ skill_name: "Hacked" })
    .eq("id", skillId)
    .select("id");
  check(
    "user cannot update another user's skill",
    !crossSkillUpdate.error && (crossSkillUpdate.data?.length ?? 0) === 0,
    crossSkillUpdate.error?.message ?? "",
  );

  const portfolioInsert = await asA
    .from("portfolio_items")
    .insert({
      user_id: idA,
      title: "Proyek Analitik",
      project_url: "https://example.com/p",
      start_date: "2023-01-01",
      end_date: "2023-06-30",
    })
    .select("id")
    .maybeSingle();
  check("user creates own portfolio", !portfolioInsert.error && Boolean(portfolioInsert.data?.id), portfolioInsert.error?.message ?? "");
  const portfolioId = portfolioInsert.data?.id;

  const portfolioUpdate = await asA
    .from("portfolio_items")
    .update({ title: "Proyek Analitik v2" })
    .eq("id", portfolioId)
    .eq("user_id", idA)
    .select("id");
  check("user updates own portfolio", !portfolioUpdate.error && (portfolioUpdate.data?.length ?? 0) === 1, portfolioUpdate.error?.message ?? "");

  const crossPortfolioUpdate = await asB
    .from("portfolio_items")
    .update({ title: "Hacked" })
    .eq("id", portfolioId)
    .select("id");
  check(
    "user cannot update another user's portfolio",
    !crossPortfolioUpdate.error && (crossPortfolioUpdate.data?.length ?? 0) === 0,
    crossPortfolioUpdate.error?.message ?? "",
  );

  // -------------------------------------------------------------------------
  // KP-7 — password via Supabase Auth
  // -------------------------------------------------------------------------
  const newPassword = "NewKestaraPass1!";
  const asPassword = await authClient(emails.password);
  const passwordUpdate = await asPassword.auth.updateUser({ password: newPassword });
  check("password updated via Supabase Auth", !passwordUpdate.error, passwordUpdate.error?.message ?? "");

  const reauth = createClient(url, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signInNew = await reauth.auth.signInWithPassword({
    email: emails.password,
    password: newPassword,
  });
  check("login works with new password", !signInNew.error && Boolean(signInNew.data.session), signInNew.error?.message ?? "");

  const plaintextPasswordInProfile = await admin
    .from("users")
    .select("id")
    .eq("id", idPassword);
  check("password is not required in public.users", !plaintextPasswordInProfile.error);

  // -------------------------------------------------------------------------
  // KP-35 — job create + publish
  // -------------------------------------------------------------------------
  const jobseekerRpc = await asA.rpc("create_job_with_skills", {
    p_company_id: companyA,
    p_title: "Illegal Job",
    p_description: "Mencoba membuat lowongan tanpa peran rekruter yang sah.",
    p_location: "Jakarta",
    p_employment_type: null,
    p_skills: ["TypeScript"],
  });
  check("non-recruiter cannot create job (RPC)", Boolean(jobseekerRpc.error), jobseekerRpc.error?.message ?? "no error");

  const mentorRpc = await asMentor.rpc("create_job_with_skills", {
    p_company_id: companyA,
    p_title: "Mentor Job",
    p_description: "Mencoba membuat lowongan dari peran mentor.",
    p_location: "Bandung",
    p_employment_type: null,
    p_skills: ["Mentoring"],
  });
  check("mentor cannot create job (RPC)", Boolean(mentorRpc.error), mentorRpc.error?.message ?? "no error");

  const directInsert = await asRecruiter
    .from("jobs")
    .insert({
      company_id: companyA,
      created_by: idR,
      title: "Direct Insert Bypass",
      description: "Valid values submitted outside the atomic creation RPC.",
      location: "Jakarta",
      status: "published",
    })
    .select("id");
  check("recruiter cannot bypass RPC with direct job INSERT", Boolean(directInsert.error), directInsert.error?.message ?? "no error");

  const nullCompanyInsert = await admin
    .from("jobs")
    .insert({
      created_by: idR,
      title: "Missing Company",
      description: "Lowongan baru wajib memiliki perusahaan.",
      location: "Jakarta",
      status: "published",
    })
    .select("id");
  check("database rejects new jobs without company_id", Boolean(nullCompanyInsert.error), nullCompanyInsert.error?.message ?? "no error");

  const missingCompanyInsert = await admin
    .from("jobs")
    .insert({
      company_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      created_by: idR,
      title: "Unknown Company",
      description: "Lowongan dengan company_id yang tidak terdaftar.",
      location: "Jakarta",
      status: "published",
    })
    .select("id");
  check("job company foreign key rejects unknown company ids", Boolean(missingCompanyInsert.error), missingCompanyInsert.error?.message ?? "invalid company id inserted");

  const rollbackTitle = `Rollback Job ${runId}`;
  const partialSkillRpc = await asRecruiter.rpc("create_job_with_skills", {
    p_company_id: companyA,
    p_title: rollbackTitle,
    p_description: "Menguji rollback ketika skill kosong setelah skill valid.",
    p_location: "Jakarta",
    p_employment_type: null,
    p_skills: ["Skill Valid", "   "],
  });
  check("RPC rejects a whitespace skill after a valid skill", Boolean(partialSkillRpc.error), partialSkillRpc.error?.message ?? "no error");
  const rollbackRows = await asRecruiter
    .from("jobs")
    .select("id")
    .eq("title", rollbackTitle);
  check(
    "failed job-and-skills RPC rolls back the job row",
    !rollbackRows.error && (rollbackRows.data?.length ?? 0) === 0,
    rollbackRows.error?.message ?? `rows=${rollbackRows.data?.length ?? 0}`,
  );

  const blankSkillRpc = await asRecruiter.rpc("create_job_with_skills", {
    p_company_id: companyA,
    p_title: `Blank Skills ${runId}`,
    p_description: "Lowongan tanpa kriteria keahlian harus ditolak.",
    p_location: "Jakarta",
    p_employment_type: null,
    p_skills: [" ", "\t"],
  });
  check("RPC rejects an array containing only blank skills", Boolean(blankSkillRpc.error), blankSkillRpc.error?.message ?? "no error");

  const recruiterRpc = await asRecruiter.rpc("create_job_with_skills", {
    p_company_id: companyA,
    p_title: "Backend Engineer",
    p_description: "Membangun layanan backend untuk platform Kestara.",
    p_location: "Jakarta",
    p_employment_type: "Penuh waktu",
    p_skills: ["TypeScript", "TypeScript", "PostgreSQL"],
  });
  check("recruiter creates and publishes job", !recruiterRpc.error && Boolean(recruiterRpc.data), recruiterRpc.error?.message ?? "");
  const jobId = recruiterRpc.data;
  if (jobId) jobIds.push(jobId);

  if (jobId) {
    const jobRow = await admin
      .from("jobs")
      .select("created_by, status, published_at")
      .eq("id", jobId)
      .maybeSingle();
    check("job linked to recruiter and published", jobRow.data?.created_by === idR && jobRow.data?.status === "published" && Boolean(jobRow.data?.published_at), `status=${jobRow.data?.status}`);

    const skillRows = await admin
      .from("job_skill_requirements")
      .select("skill_name")
      .eq("job_id", jobId);
    const names = (skillRows.data ?? []).map((row) => row.skill_name).sort();
    check("job skills saved and deduplicated", JSON.stringify(names) === JSON.stringify(["PostgreSQL", "TypeScript"]), JSON.stringify(names));

    const directSkillInsert = await asRecruiter
      .from("job_skill_requirements")
      .insert({ job_id: jobId, skill_name: "Direct Skill Bypass" })
      .select("id");
    check(
      "recruiter cannot bypass RPC with direct skill INSERT",
      Boolean(directSkillInsert.error),
      directSkillInsert.error?.message ?? "no error",
    );

    const publicProjection = await asA
      .from("published_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();
    check(
      "published job projection omits recruiter identity",
      !publicProjection.error &&
        Boolean(publicProjection.data?.id) &&
        !Object.hasOwn(publicProjection.data ?? {}, "created_by"),
      publicProjection.error?.message ?? "",
    );

    const creatorColumn = await asA
      .from("jobs")
      .select("created_by")
      .eq("id", jobId);
    check(
      "authenticated clients cannot query created_by",
      Boolean(creatorColumn.error),
      creatorColumn.error?.message ?? "no error",
    );

    const companyColumn = await asA
      .from("jobs")
      .select("company_id")
      .eq("id", jobId);
    check(
      "authenticated clients cannot query the private job company_id column",
      Boolean(companyColumn.error),
      companyColumn.error?.message ?? "column was readable",
    );

    const draftTitle = `Private Draft ${runId}`;
    const draftJob = await admin
      .from("jobs")
      .insert({
        company_id: companyA,
        created_by: idR,
        title: draftTitle,
        description: "Lowongan draft sintetis untuk uji isolasi recruiter.",
        location: "Jakarta",
        status: "draft",
      })
      .select("id")
      .single();
    check("service test fixture creates a draft job", !draftJob.error && Boolean(draftJob.data?.id), draftJob.error?.message ?? "");
    if (draftJob.data?.id) jobIds.push(draftJob.data.id);

    if (draftJob.data?.id) {
      const ownerRead = await asRecruiter
        .from("jobs")
        .select("id")
        .eq("id", draftJob.data.id);
      check("recruiter reads own draft job", !ownerRead.error && (ownerRead.data?.length ?? 0) === 1, ownerRead.error?.message ?? `rows=${ownerRead.data?.length ?? 0}`);

      const crossRecruiterRead = await asRecruiterB
        .from("jobs")
        .select("id")
        .eq("id", draftJob.data.id);
      check("second recruiter cannot read another recruiter's draft", !crossRecruiterRead.error && (crossRecruiterRead.data?.length ?? 0) === 0, crossRecruiterRead.error?.message ?? `rows=${crossRecruiterRead.data?.length ?? 0}`);

      const crossRecruiterSkillInsert = await asRecruiterB
        .from("job_skill_requirements")
        .insert({ job_id: draftJob.data.id, skill_name: "Cross Recruiter" })
        .select("id");
      check("second recruiter cannot add a skill to another recruiter's draft", Boolean(crossRecruiterSkillInsert.error), crossRecruiterSkillInsert.error?.message ?? "no error");
    }
  } else {
    check("job linked to recruiter and published", false, "no job id");
    check("job skills saved and deduplicated", false, "no job id");
  }

  const recruiterOwnRead = await asRecruiter.from("jobs").select("id").eq("id", jobId);
  check("recruiter reads own job", (recruiterOwnRead.data?.length ?? 0) === 1, `rows=${recruiterOwnRead.data?.length ?? 0}`);

  const jobseekerRead = await asA.from("jobs").select("id").eq("id", jobId);
  check("jobseeker reads published job", (jobseekerRead.data?.length ?? 0) === 1, `rows=${jobseekerRead.data?.length ?? 0}`);
} catch (error) {
  check("integration run", false, error instanceof Error ? error.message : String(error));
} finally {
  for (const id of jobIds) {
    const { error } = await admin.from("jobs").delete().eq("id", id);
    check("cleanup job fixture", !error, error?.message ?? "");
  }
  for (const id of membershipIds) {
    const { error } = await admin.from("company_memberships").delete().eq("id", id);
    check("cleanup membership fixture", !error, error?.message ?? "");
  }
  for (const id of companyIds) {
    const { error } = await admin.from("companies").delete().eq("id", id);
    check("cleanup company fixture", !error, error?.message ?? "");
  }
  for (const id of ids.reverse()) {
    const { error } = await admin.auth.admin.deleteUser(id);
    check("cleanup synthetic user", !error, error?.message ?? "");
  }
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length > 0) {
  console.error("PBI checks failed. See FAIL lines above.");
  process.exit(1);
}
console.log("All PBI checks passed.");
