#!/usr/bin/env node
// Creates synthetic development users for local testing only.
// Usage: npm run seed:users
// Requires (server-only): NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.
// Fallback: SUPABASE_SERVICE_ROLE_KEY (legacy name).
// Never prints credentials. Safe to re-run (skips existing accounts).

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const password = process.env.DEV_SEED_PASSWORD ?? "KestaraDev123!";

if (!url || !secretKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. Configure .env.local first.",
  );
  process.exit(1);
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  { email: "jobseeker.a@kestara.test", fullName: "Jobseeker A", role: "jobseeker" },
  { email: "jobseeker.b@kestara.test", fullName: "Jobseeker B", role: "jobseeker" },
  { email: "mentor@kestara.test", fullName: "Mentor Test", role: "mentor" },
  { email: "recruiter@kestara.test", fullName: "Recruiter Test", role: "recruiter" },
  { email: "admin@kestara.test", fullName: "Admin Test", role: "admin" },
];

for (const user of users) {
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: user.fullName, role: user.role === "admin" ? "jobseeker" : user.role },
  });

  if (error || !data.user) {
    if ((error?.message ?? "").toLowerCase().includes("already")) {
      console.log(`skip (exists): ${user.email}`);
      continue;
    }
    console.error(`failed: ${user.email} -> ${error?.message ?? "unknown error"}`);
    continue;
  }

  if (user.role === "admin") {
    const { error: roleError } = await admin
      .from("users")
      .update({ role: "admin" })
      .eq("id", data.user.id);
    if (roleError) {
      console.error(`failed to set admin role: ${user.email} -> ${roleError.message}`);
      continue;
    }
  }

  console.log(`created: ${user.email} (${user.role})`);
}

console.log("Seed complete. Synthetic accounts only; never use in production.");
