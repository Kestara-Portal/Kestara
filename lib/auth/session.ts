import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { AppRole } from "@/lib/auth/roles";
import { isAppRole } from "@/lib/auth/roles";

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string;
  role: AppRole;
  accountStatus: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  role: string;
  account_status: string;
}

/**
 * Returns the authenticated user with their application profile, or null.
 * Deactivated/suspended accounts are treated as not authenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, full_name, role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileRow | null;
  if (!profile) return null;
  if (profile.account_status !== "active") return null;

  return {
    id: profile.id,
    email: user.email ?? null,
    fullName: profile.full_name,
    role: isAppRole(profile.role) ? profile.role : "jobseeker",
    accountStatus: profile.account_status,
  };
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Anda harus masuk terlebih dahulu.", "UNAUTHENTICATED");
  return user;
}

export async function requireRole(allowed: AppRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    throw new AuthError("Anda tidak memiliki akses untuk tindakan ini.", "FORBIDDEN");
  }
  return user;
}
