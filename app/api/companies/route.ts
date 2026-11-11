import { AuthError, requireRole } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";
import { getCompaniesForAdmin } from "@/lib/services/companies";
import { AppError } from "@/lib/utils/errors";

/**
 * GET /api/companies
 * Mengambil daftar perusahaan beserta status dan jumlah lowongannya untuk dashboard Admin.
 */
export async function GET() {
  try {
    await requireRole(["admin"]);
    const companies = await getCompaniesForAdmin();
    return jsonOk(companies);
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

    console.error("GET /api/companies gagal:", error);
    return jsonError("INTERNAL_ERROR", "Gagal memuat daftar perusahaan.", 500);
  }
}
