import type { CurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import {
  type OwnProfile,
  type ProfilePortfolioRow,
  type ProfileSkillRow,
  type ProfileUserRow,
  toOwnProfile,
} from "./profile-dto";

/**
 * KP-15 / E01-R: membaca profil milik user yang sedang login.
 *
 * Id selalu diambil dari sesi (current.id), tidak pernah dari request, dan
 * RLS di database juga membatasi baris ke pemiliknya.
 * Mengembalikan null jika baris profil tidak ada.
 */
export async function getOwnProfile(current: CurrentUser): Promise<OwnProfile | null> {
  const supabase = await createClient();

  const [userRes, skillsRes, portfolioRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role, phone_number, bio, created_at")
      .eq("id", current.id)
      .maybeSingle(),
    supabase
      .from("user_skills")
      .select("id, skill_name, category, proficiency_level, description")
      .eq("user_id", current.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("portfolio_items")
      .select("id, title, description, project_url, start_date, end_date")
      .eq("user_id", current.id)
      .order("created_at", { ascending: true }),
  ]);

  if (userRes.error || skillsRes.error || portfolioRes.error) {
    // Jangan bocorkan detail database ke pemanggil.
    throw new Error("Gagal membaca data profil dari database.");
  }

  const user = userRes.data as ProfileUserRow | null;
  if (!user) return null;

  return toOwnProfile(
    current.email,
    user,
    (skillsRes.data ?? []) as ProfileSkillRow[],
    (portfolioRes.data ?? []) as ProfilePortfolioRow[],
  );
}
