#!/usr/bin/env node
// Controlled Admin provisioning for Kestara.
// Usage:
//   npm run provision:admin -- <email> <password> "<Full Name>"
// Requires (server-only): NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.
// Fallback: SUPABASE_SERVICE_ROLE_KEY (legacy name).
// Never prints credentials.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !secretKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. Configure .env.local first.",
  );
  process.exit(1);
}

const [email, password, fullName] = process.argv.slice(2);

if (!email || !password || !fullName) {
  console.error('Usage: npm run provision:admin -- <email> <password> "<Full Name>"');
  process.exit(1);
}

if (password.length < 8) {
  console.error("Admin password must be at least 8 characters.");
  process.exit(1);
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.createUser({
  email: email.trim().toLowerCase(),
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName.trim(), role: "jobseeker" },
});

if (error || !data.user) {
  console.error(`Failed to create admin account: ${error?.message ?? "unknown error"}`);
  process.exit(1);
}

const { error: updateError } = await admin
  .from("users")
  .update({ role: "admin", full_name: fullName.trim() })
  .eq("id", data.user.id);

if (updateError) {
  console.error(`Account created but failed to set admin role: ${updateError.message}`);
  console.error(`User id: ${data.user.id}`);
  process.exit(1);
}

console.log(`Admin provisioned successfully. User id: ${data.user.id}`);
