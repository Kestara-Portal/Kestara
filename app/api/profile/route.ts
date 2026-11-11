import { AuthError, requireUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";
import { getOwnProfile } from "@/lib/services/profile";

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
