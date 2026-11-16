import { AuthError, requireUser } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { getOwnProfile } from "@/lib/services/profile";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";

// KP-17: GET /api/profile
// Mengembalikan profil milik user yang sedang login. Tidak menerima id dari
// request, sehingga user tidak bisa membaca profil orang lain.
export async function GET() {
  try {
    const user = await requireUser();
    const profile = await getOwnProfile(user);

    if (!profile) {
      return jsonError("NOT_FOUND", "Profil tidak ditemukan.", 404);
    }

    return jsonOk(profile);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(
        error.code,
        error.message,
        error.code === "UNAUTHENTICATED" ? 401 : 403,
      );
    }

    console.error("GET /api/profile gagal");
    return jsonError("INTERNAL_ERROR", "Gagal mengambil data profil.", 500);
  }
}

// KP-7: PATCH /api/profile
// Update the authenticated user's own profile (safe columns only).
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("UNAUTHENTICATED", "Anda harus masuk terlebih dahulu.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Body permintaan tidak valid.", 400);
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(zodFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .update({
      full_name: parsed.data.fullName,
      phone_number: parsed.data.phoneNumber,
      bio: parsed.data.bio,
    })
    .eq("id", user.id)
    .select("id, full_name, phone_number, bio, role")
    .maybeSingle();

  if (error) {
    return jsonError(
      "UPDATE_FAILED",
      "Profil belum dapat disimpan. Periksa kembali isian lalu coba lagi.",
      400,
    );
  }
  if (!data) {
    return jsonError("UPDATE_DENIED", "Perubahan profil tidak diizinkan.", 403);
  }

  return jsonOk({ profile: data });
}
