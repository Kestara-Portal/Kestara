import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, assertSupabaseEnv } from "./config";

/**
 * Request-aware Supabase server client (SSR).
 *
 * Uses the authenticated user's session from cookies so that RLS is enforced
 * as that user. Never use a service-role key here. In Next.js 16 `cookies()`
 * is async.
 */
export async function createClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component render: cookie writes happen in
          // Route Handlers / Server Actions. Safe to ignore here.
        }
      },
    },
  });
}
