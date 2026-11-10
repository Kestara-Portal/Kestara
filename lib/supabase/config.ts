// Environment access for Supabase. Only public values are read on the client.
// The secret/service-role key must only be read in server-only modules
// (lib/supabase/admin.ts) and server-side scripts.
//
// Naming: prefers the current API Keys standard
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY
// with temporary fallbacks to the legacy names
//   NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
// so the local Supabase CLI (which may still print ANON_KEY/SERVICE_ROLE_KEY)
// keeps working during the transition.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export function hasSupabaseEnv(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_PUBLISHABLE_KEY.length > 0;
}

export function assertSupabaseEnv(): void {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Supabase environment is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }
}
