import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "./config";

/**
 * Elevated, server-only Supabase client backed by the secret key.
 *
 * WARNING: bypasses RLS. Restrict to narrowly scoped administrative/system
 * operations (e.g. controlled admin provisioning). NEVER import this module
 * into a Client Component or any browser-reachable code.
 *
 * Key naming: prefers SUPABASE_SECRET_KEY with a temporary fallback to the
 * legacy SUPABASE_SERVICE_ROLE_KEY. This value must never be exposed via
 * NEXT_PUBLIC_* or reach the browser bundle.
 */
export function createAdminClient() {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!SUPABASE_URL || !secretKey) {
    throw new Error(
      "Supabase admin environment is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (server-only, never commit).",
    );
  }

  return createSupabaseClient(SUPABASE_URL, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
