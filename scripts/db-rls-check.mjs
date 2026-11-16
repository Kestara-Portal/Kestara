#!/usr/bin/env node
// RLS / authorization integration check for E01.
// Requires a running LOCAL Supabase and:
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
// Legacy fallbacks: NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// Usage: npm run test:rls
//
// Creates uniquely-named synthetic users, verifies access rules, then removes them.
// Never prints credentials or session tokens.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const password = process.env.DEV_SEED_PASSWORD ?? "KestaraDev123!";

if (!url || !anonKey || !serviceRoleKey) {
  console.error("Missing Supabase env vars (URL, publishable key, secret key). Configure .env.local.");
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

const adminByServiceRole = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function check(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function createUser(email, fullName, role, ids) {
  const { data, error } = await adminByServiceRole.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: role === "admin" ? "jobseeker" : role },
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  ids.push(data.user.id);

  if (role === "admin") {
    const { error: e } = await adminByServiceRole
      .from("users")
      .update({ role: "admin" })
      .eq("id", data.user.id);
    if (e) throw new Error(`set admin role failed: ${e.message}`);
  }
  return data.user.id;
}

async function authClient(email) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn failed: ${error.message}`);
  return client;
}

const runId = Date.now();
const ids = [];
const uploadedPaths = [];
const companyIds = [];
const membershipIds = [];
const emails = {
  a: `rls.a.${runId}@kestara.test`,
  b: `rls.b.${runId}@kestara.test`,
  mentor: `rls.mentor.${runId}@kestara.test`,
  recruiter: `rls.recruiter.${runId}@kestara.test`,
  recruiterB: `rls.recruiter-b.${runId}@kestara.test`,
  admin: `rls.admin.${runId}@kestara.test`,
};

try {
  const idA = await createUser(emails.a, "RLS A", "jobseeker", ids);
  const idB = await createUser(emails.b, "RLS B", "jobseeker", ids);
  await createUser(emails.mentor, "RLS Mentor", "mentor", ids);
  const recruiterId = await createUser(emails.recruiter, "RLS Recruiter", "recruiter", ids);
  const recruiterBId = await createUser(emails.recruiterB, "RLS Recruiter B", "recruiter", ids);
  const adminId = await createUser(emails.admin, "RLS Admin", "admin", ids);

  const companyA = await adminByServiceRole
    .from("companies")
    .insert({ name: `RLS Company A ${runId}` })
    .select("id")
    .single();
  if (companyA.error || !companyA.data) {
    throw new Error(`create company fixture failed: ${companyA.error?.message}`);
  }
  companyIds.push(companyA.data.id);

  const pendingCompany = await adminByServiceRole
    .from("companies")
    .insert({ name: `RLS Company Pending ${runId}` })
    .select("id")
    .single();
  if (pendingCompany.error || !pendingCompany.data) {
    throw new Error(`create company fixture failed: ${pendingCompany.error?.message}`);
  }
  companyIds.push(pendingCompany.data.id);

  const companyB = await adminByServiceRole
    .from("companies")
    .insert({ name: `RLS Company B ${runId}` })
    .select("id")
    .single();
  if (companyB.error || !companyB.data) {
    throw new Error(`create company fixture failed: ${companyB.error?.message}`);
  }
  companyIds.push(companyB.data.id);

  const verifiedAt = new Date().toISOString();
  const verifiedMembership = await adminByServiceRole
    .from("company_memberships")
    .insert({
      company_id: companyA.data.id,
      user_id: recruiterId,
      membership_status: "verified",
      verified_by: adminId,
      verified_at: verifiedAt,
    })
    .select("id")
    .single();
  if (verifiedMembership.error || !verifiedMembership.data) {
    throw new Error(`create membership fixture failed: ${verifiedMembership.error?.message}`);
  }
  membershipIds.push(verifiedMembership.data.id);

  const pendingMembership = await adminByServiceRole
    .from("company_memberships")
    .insert({
      company_id: pendingCompany.data.id,
      user_id: recruiterId,
      membership_status: "pending",
    })
    .select("id")
    .single();
  if (pendingMembership.error || !pendingMembership.data) {
    throw new Error(`create membership fixture failed: ${pendingMembership.error?.message}`);
  }
  membershipIds.push(pendingMembership.data.id);

  const otherMembership = await adminByServiceRole
    .from("company_memberships")
    .insert({
      company_id: companyB.data.id,
      user_id: recruiterBId,
      membership_status: "verified",
      verified_by: adminId,
      verified_at: verifiedAt,
    })
    .select("id")
    .single();
  if (otherMembership.error || !otherMembership.data) {
    throw new Error(`create membership fixture failed: ${otherMembership.error?.message}`);
  }
  membershipIds.push(otherMembership.data.id);

  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const asA = await authClient(emails.a);
  const asB = await authClient(emails.b);
  const asMentor = await authClient(emails.mentor);
  const asRecruiter = await authClient(emails.recruiter);
  const asRecruiterB = await authClient(emails.recruiterB);
  const asAdmin = await authClient(emails.admin);

  const recruiterCompanies = await asRecruiter.from("companies").select("id");
  check(
    "recruiter sees only a company with their verified membership",
    recruiterCompanies.data?.length === 1 &&
      recruiterCompanies.data[0]?.id === companyA.data.id,
    recruiterCompanies.error?.message ?? `rows=${recruiterCompanies.data?.length ?? 0}`,
  );

  const pendingCompanyRead = await asRecruiter
    .from("companies")
    .select("id")
    .eq("id", pendingCompany.data.id);
  check(
    "pending membership does not expose company data",
    !pendingCompanyRead.error && (pendingCompanyRead.data?.length ?? 0) === 0,
    pendingCompanyRead.error?.message ?? "",
  );

  const otherCompanyRead = await asRecruiter
    .from("companies")
    .select("id")
    .eq("id", companyB.data.id);
  check(
    "cross-company read is isolated",
    !otherCompanyRead.error && (otherCompanyRead.data?.length ?? 0) === 0,
    otherCompanyRead.error?.message ?? "",
  );

  const otherMembershipRead = await asRecruiter
    .from("company_memberships")
    .select("id")
    .eq("user_id", recruiterBId);
  check(
    "cross-user membership read is denied",
    !otherMembershipRead.error && (otherMembershipRead.data?.length ?? 0) === 0,
    otherMembershipRead.error?.message ?? "",
  );

  const privateVerifierRead = await asRecruiter
    .from("company_memberships")
    .select("verified_by")
    .eq("id", verifiedMembership.data.id);
  check(
    "membership verifier identity is private",
    Boolean(privateVerifierRead.error),
    privateVerifierRead.error?.message ?? "column was readable",
  );

  const selfVerify = await asRecruiter.rpc("admin_verify_company_membership", {
    p_membership_id: pendingMembership.data.id,
  });
  check("recruiter cannot verify their own membership", Boolean(selfVerify.error), selfVerify.error?.message ?? "no error");

  const verifiedByAdmin = await asAdmin.rpc("admin_verify_company_membership", {
    p_membership_id: pendingMembership.data.id,
  });
  check("active admin can verify a pending membership", !verifiedByAdmin.error, verifiedByAdmin.error?.message ?? "");

  const adminRevoke = await asAdmin.rpc("admin_revoke_company_membership", {
    p_membership_id: pendingMembership.data.id,
  });
  check("active admin can revoke a verified membership", !adminRevoke.error, adminRevoke.error?.message ?? "");

  const nonAdminRevoke = await asRecruiterB.rpc("admin_revoke_company_membership", {
    p_membership_id: verifiedMembership.data.id,
  });
  check("recruiter cannot revoke a membership", Boolean(nonAdminRevoke.error), nonAdminRevoke.error?.message ?? "no error");

  const revokedCompanyRead = await asRecruiter
    .from("companies")
    .select("id")
    .eq("id", pendingCompany.data.id);
  check(
    "revoked membership removes company from verified access",
    !revokedCompanyRead.error && (revokedCompanyRead.data?.length ?? 0) === 0,
    revokedCompanyRead.error?.message ?? "",
  );

  const directMembershipInsert = await asRecruiter
    .from("company_memberships")
    .insert({ company_id: companyB.data.id, user_id: recruiterId })
    .select("id");
  check("recruiter cannot insert membership directly", Boolean(directMembershipInsert.error), directMembershipInsert.error?.message ?? "inserted unexpectedly");

  const nonRecruiterCompanyRead = await asA.from("companies").select("id");
  check(
    "non-recruiter cannot read company data",
    !nonRecruiterCompanyRead.error && (nonRecruiterCompanyRead.data?.length ?? 0) === 0,
    nonRecruiterCompanyRead.error?.message ?? "",
  );

  const anonUsers = await anon.from("users").select("id");
  check("anon cannot read users", (anonUsers.data?.length ?? 0) === 0, `rows=${anonUsers.data?.length ?? 0}`);

  const own = await asA.from("users").select("id").eq("id", idA);
  check("jobseeker reads own profile", (own.data?.length ?? 0) === 1, `rows=${own.data?.length ?? 0}`);

  const other = await asA.from("users").select("id").eq("id", idB);
  check("jobseeker cannot read other profile", (other.data?.length ?? 0) === 0, `rows=${other.data?.length ?? 0}`);

  const bioUpdate = await asA.from("users").update({ bio: "RLS check" }).eq("id", idA).select("id");
  check("jobseeker updates own bio", !bioUpdate.error && (bioUpdate.data?.length ?? 0) === 1, bioUpdate.error?.message ?? "");

  const roleUpdate = await asA.from("users").update({ role: "admin" }).eq("id", idA).select("id");
  check("jobseeker cannot change own role", Boolean(roleUpdate.error), roleUpdate.error?.message ?? "no error (unexpected)");

  const stillJobseeker = await adminByServiceRole.from("users").select("role").eq("id", idA).single();
  check("role unchanged after attempt", stillJobseeker.data?.role === "jobseeker", `role=${stillJobseeker.data?.role}`);

  const skillA = await asA
    .from("user_skills")
    .insert({ user_id: idA, skill_name: "RLS Skill A" })
    .select("id");
  check("jobseeker inserts own skill", !skillA.error && (skillA.data?.length ?? 0) === 1, skillA.error?.message ?? "");

  const skillB = await asB
    .from("user_skills")
    .insert({ user_id: idB, skill_name: "RLS Skill B" })
    .select("id");
  check("jobseeker B inserts own skill", !skillB.error && (skillB.data?.length ?? 0) === 1, skillB.error?.message ?? "");

  const readOtherSkill = await asA.from("user_skills").select("id").eq("user_id", idB);
  check("jobseeker cannot read other skill", (readOtherSkill.data?.length ?? 0) === 0, `rows=${readOtherSkill.data?.length ?? 0}`);

  const mentorEdit = await asMentor
    .from("user_skills")
    .update({ skill_name: "hacked" })
    .eq("user_id", idA)
    .select("id");
  check("mentor cannot edit another user's skill", !mentorEdit.error && (mentorEdit.data?.length ?? 0) === 0, mentorEdit.error?.message ?? "");

  const adminSkills = await asAdmin.from("user_skills").select("id");
  check("admin has no blanket skill access", (adminSkills.data?.length ?? 0) === 0, `rows=${adminSkills.data?.length ?? 0}`);

  const adminUsers = await asAdmin.from("users").select("id");
  check("admin can list users (controlled read)", (adminUsers.data?.length ?? 0) >= ids.length, `rows=${adminUsers.data?.length ?? 0}`);

  const anonPortfolio = await anon.from("portfolio_items").select("id");
  check("anon cannot read portfolio", (anonPortfolio.data?.length ?? 0) === 0, `rows=${anonPortfolio.data?.length ?? 0}`);

  // ---------------------------------------------------------------------------
  // Registration + profile provisioning
  // ---------------------------------------------------------------------------
  const signupClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const mentorSignupEmail = `rls.signup.mentor.${runId}@kestara.test`;
  const mentorSignup = await signupClient.auth.signUp({
    email: mentorSignupEmail,
    password,
    options: { data: { full_name: "Signup Mentor", role: "mentor" } },
  });
  if (mentorSignup.data?.user) ids.push(mentorSignup.data.user.id);
  check(
    "registration (public role) succeeds",
    !mentorSignup.error && Boolean(mentorSignup.data?.user),
    mentorSignup.error?.message ?? "",
  );
  if (mentorSignup.data?.user) {
    const row = await adminByServiceRole
      .from("users")
      .select("role")
      .eq("id", mentorSignup.data.user.id)
      .maybeSingle();
    check("profile provisioned with requested public role", row.data?.role === "mentor", `role=${row.data?.role}`);
  }

  const escalateClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const escalateEmail = `rls.signup.admin.${runId}@kestara.test`;
  const escalateSignup = await escalateClient.auth.signUp({
    email: escalateEmail,
    password,
    options: { data: { full_name: "Escape Admin", role: "admin" } },
  });
  if (escalateSignup.data?.user) ids.push(escalateSignup.data.user.id);
  check(
    "registration with admin metadata does not raise",
    Boolean(escalateSignup.data?.user),
    escalateSignup.error?.message ?? "",
  );
  if (escalateSignup.data?.user) {
    const row = await adminByServiceRole
      .from("users")
      .select("role")
      .eq("id", escalateSignup.data.user.id)
      .maybeSingle();
    check("admin escalation via registration blocked", row.data?.role === "jobseeker", `role=${row.data?.role}`);
  }

  // ---------------------------------------------------------------------------
  // Login / session / logout
  // ---------------------------------------------------------------------------
  const sessionClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const login = await sessionClient.auth.signInWithPassword({ email: emails.a, password });
  const sessionUser = await sessionClient.auth.getUser();
  check("login establishes session", !login.error && Boolean(sessionUser.data.user), login.error?.message ?? "");
  await sessionClient.auth.signOut();
  const afterLogout = await sessionClient.auth.getUser();
  check("logout clears session", !afterLogout.data.user);

  // ---------------------------------------------------------------------------
  // Storage isolation (avatar bucket)
  // ---------------------------------------------------------------------------
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const pngBlob = new Blob([bytes], { type: "image/png" });
  const avatarPathA = `${idA}/avatar-${runId}.png`;
  uploadedPaths.push(avatarPathA);

  const uploadOwn = await asA.storage
    .from("profile-avatars")
    .upload(avatarPathA, pngBlob, { contentType: "image/png", upsert: true });
  check("owner uploads avatar", !uploadOwn.error, uploadOwn.error?.message ?? "");

  const uploadOther = await asA.storage
    .from("profile-avatars")
    .upload(`${idB}/evil-${runId}.png`, pngBlob, { contentType: "image/png", upsert: true });
  check("user cannot upload into another user's path", Boolean(uploadOther.error), uploadOther.error?.message ?? "no error (unexpected)");

  const downloadOther = await asB.storage.from("profile-avatars").download(avatarPathA);
  check(
    "user cannot download another user's file",
    Boolean(downloadOther.error) || downloadOther.data === null,
    downloadOther.error?.message ?? "downloaded unexpectedly",
  );

  const downloadAnon = await anon.storage.from("profile-avatars").download(avatarPathA);
  check(
    "anon cannot download private file",
    Boolean(downloadAnon.error) || downloadAnon.data === null,
    downloadAnon.error?.message ?? "downloaded unexpectedly",
  );

  // ---------------------------------------------------------------------------
  // Account status protection
  // ---------------------------------------------------------------------------
  const rpcDenied = await asA.rpc("admin_set_account_status", {
    target_user_id: idB,
    new_status: "deactivated",
  });
  check("non-admin cannot change account status via RPC", Boolean(rpcDenied.error), rpcDenied.error?.message ?? "no error (unexpected)");

  const directStatus = await asA
    .from("users")
    .update({ account_status: "active" })
    .eq("id", idA)
    .select("id");
  check("user cannot change own account_status directly", Boolean(directStatus.error), directStatus.error?.message ?? "no error (unexpected)");

  const rpcAdmin = await asAdmin.rpc("admin_set_account_status", {
    target_user_id: idA,
    new_status: "suspended",
  });
  check("admin changes account status via RPC", !rpcAdmin.error, rpcAdmin.error?.message ?? "");

  const suspendedInsert = await asA
    .from("user_skills")
    .insert({ user_id: idA, skill_name: "during-suspension" })
    .select("id");
  check(
    "suspended user cannot mutate skills",
    Boolean(suspendedInsert.error) || (suspendedInsert.data?.length ?? 0) === 0,
    suspendedInsert.error?.message ?? "inserted unexpectedly",
  );

  const suspendedUpload = await asA.storage
    .from("profile-avatars")
    .upload(`${idA}/suspended-${runId}.png`, pngBlob, { contentType: "image/png", upsert: true });
  check("suspended user cannot upload avatar", Boolean(suspendedUpload.error), suspendedUpload.error?.message ?? "uploaded unexpectedly");

  // Restore for clean teardown (not strictly required).
  await adminByServiceRole.from("users").update({ account_status: "active" }).eq("id", idA);
} catch (error) {
  check("integration run", false, error instanceof Error ? error.message : String(error));
} finally {
  for (const path of uploadedPaths) {
    const { error } = await adminByServiceRole.storage.from("profile-avatars").remove([path]);
    check("cleanup uploaded fixture", !error, error?.message ?? "");
  }
  for (const id of membershipIds) {
    const { error } = await adminByServiceRole.from("company_memberships").delete().eq("id", id);
    check("cleanup membership fixture", !error, error?.message ?? "");
  }
  for (const id of companyIds) {
    const { error } = await adminByServiceRole.from("companies").delete().eq("id", id);
    check("cleanup company fixture", !error, error?.message ?? "");
  }
  for (const id of ids.reverse()) {
    const { error } = await adminByServiceRole.auth.admin.deleteUser(id);
    check("cleanup synthetic user", !error, error?.message ?? "");
  }
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length > 0) {
  console.error("RLS checks failed. See FAIL lines above.");
  process.exit(1);
}
console.log("All RLS checks passed.");
