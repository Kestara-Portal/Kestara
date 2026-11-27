import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, hasSupabaseEnv } from "./config";

/**
 * Refreshes the Supabase auth session on each request and forwards updated
 * cookies. Returns an unmodified response when Supabase is not configured so
 * that the legacy app still runs without Supabase environment variables.
 */
export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Do not remove: this refreshes expired tokens and keeps the session alive.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection (defense in depth; pages also verify the session).
  const path = request.nextUrl.pathname;
  const isProtected = path === "/profile" || path.startsWith("/jobs/new");
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
