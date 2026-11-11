import { AuthError, requireRole } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";
import { softDeleteCompany } from "@/lib/services/companies";
import { AppError } from "@/lib/utils/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * KP-31 / KP-33 / E04-D: DELETE /api/companies/[id]
 *
 * Endpoint khusus Administrator untuk menghapus profil entitas perusahaan
 * (Soft Delete) dan secara otomatis menutup seluruh lowongan kerja terhubung (KP-34).
 */
export async function DELETE(request: Request, context: RouteParams) {
  try {
    // 1. Otorisasi: Wajib role 'admin'
    const currentUser = await requireRole(["admin"]);

    // 2. Baca parameter ID
    const { id } = await context.params;
    if (!id || id.trim().length === 0) {
      return jsonError("BAD_REQUEST", "ID perusahaan tidak valid.", 400);
    }

    // 3. Eksekusi soft delete & cascading aturan lowongan terkait
    const result = await softDeleteCompany(id, currentUser);

    return jsonOk(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(
        error.code,
        error.message,
        error.code === "UNAUTHENTICATED" ? 401 : 403,
      );
    }

    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status);
    }

    console.error("DELETE /api/companies/[id] gagal:", error);
    return jsonError("INTERNAL_ERROR", "Terjadi kesalahan saat menghapus perusahaan.", 500);
  }
}
