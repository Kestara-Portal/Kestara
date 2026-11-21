import { AuthError, requireRole } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";
import { closeJobVacancy, deleteJobVacancy } from "@/lib/services/jobs";
import { AppError } from "@/lib/utils/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * KP-47: PATCH /api/jobs/[id]
 *
 * Endpoint untuk Rekruter atau Administrator menutup lowongan pekerjaan yang tidak lagi aktif.
 */
export async function PATCH(request: Request, context: RouteParams) {
  try {
    // 1. Otorisasi: Wajib role 'admin' atau 'recruiter'
    const currentUser = await requireRole(["admin", "recruiter"]);

    // 2. Baca parameter ID
    const { id } = await context.params;
    if (!id || id.trim().length === 0) {
      return jsonError("BAD_REQUEST", "ID lowongan pekerjaan tidak valid.", 400);
    }

    // 3. Baca body jika ada action tertentu
    let action = "close";
    try {
      const body = await request.json();
      if (body?.action) action = body.action;
    } catch {
      // Body opsional, default ke "close"
    }

    if (action === "close") {
      const result = await closeJobVacancy(id, currentUser);
      return jsonOk(result);
    } else if (action === "delete" || action === "archive") {
      const result = await deleteJobVacancy(id, currentUser, false);
      return jsonOk(result);
    }

    return jsonError("BAD_REQUEST", `Aksi "${action}" tidak didukung.`, 400);
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

    console.error("PATCH /api/jobs/[id] gagal:", error);
    return jsonError("INTERNAL_ERROR", "Terjadi kesalahan saat memperbarui lowongan pekerjaan.", 500);
  }
}

/**
 * KP-47: DELETE /api/jobs/[id]
 *
 * Endpoint untuk Rekruter atau Administrator menghapus lowongan pekerjaan.
 */
export async function DELETE(request: Request, context: RouteParams) {
  try {
    // 1. Otorisasi: Wajib role 'admin' atau 'recruiter'
    const currentUser = await requireRole(["admin", "recruiter"]);

    // 2. Baca parameter ID
    const { id } = await context.params;
    if (!id || id.trim().length === 0) {
      return jsonError("BAD_REQUEST", "ID lowongan pekerjaan tidak valid.", 400);
    }

    // 3. Cek parameter query permanent delete
    const url = new URL(request.url);
    const permanent = url.searchParams.get("permanent") === "true";

    const result = await deleteJobVacancy(id, currentUser, permanent);
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

    console.error("DELETE /api/jobs/[id] gagal:", error);
    return jsonError("INTERNAL_ERROR", "Terjadi kesalahan saat menghapus lowongan pekerjaan.", 500);
  }
}
