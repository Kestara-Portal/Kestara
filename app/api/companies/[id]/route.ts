import { AuthError, requireRole } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";
import { softDeleteCompany, updateCompany } from "@/lib/services/companies";
import { AppError } from "@/lib/utils/errors";
import { validateCompanyId, validateUpdateCompany } from "@/lib/validations/company";

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

/**
 * KP-27 / E04-U: PATCH /api/companies/[id]
 *
 * Recruiter (active member of that company) or Administrator updates the
 * company profile. Only name, description, website, location, and logo_path are
 * accepted; role, status, and timestamps are never taken from the request.
 */
export async function PATCH(request: Request, context: RouteParams) {
  try {
    // 1. Otorisasi: role diperiksa di sini, keanggotaan perusahaan di service.
    const currentUser = await requireRole(["admin", "recruiter"]);

    // 2. Baca dan validasi parameter ID
    const { id } = await context.params;
    const idError = validateCompanyId(id);
    if (idError) {
      return jsonError("BAD_REQUEST", idError, 400);
    }

    // 3. Parse body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Body permintaan tidak valid.", 400);
    }

    // 4. Validasi field (server-side, authoritative)
    const parsed = validateUpdateCompany(body);
    if (!parsed.success) {
      return jsonError(
        "VALIDATION_ERROR",
        "Periksa kembali data perusahaan yang diisi.",
        400,
        parsed.fieldErrors,
      );
    }

    // 5. Eksekusi use case
    const company = await updateCompany(id, parsed.data, currentUser);

    return jsonOk({ company });
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

    console.error("PATCH /api/companies/[id] gagal:", error);
    return jsonError(
      "INTERNAL_ERROR",
      "Terjadi kesalahan saat memperbarui profil perusahaan.",
      500,
    );
  }
}
