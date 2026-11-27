import { AuthError, requireRole } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";
import { updateApplicationStatus } from "@/lib/services/applications";
import { AppError } from "@/lib/utils/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * KP-61: PATCH / PUT /api/applications/[id]/status
 *
 * Endpoint bagi Rekruter untuk mengubah status tahapan seleksi kandidat
 * (misal dari Seleksi Administrasi ke Wawancara), mencatat event audit,
 * dan memicu trigger notifikasi otomatis ke kandidat (KP-62).
 */
export async function PATCH(request: Request, context: RouteParams) {
  return handleUpdateStatus(request, context);
}

export async function PUT(request: Request, context: RouteParams) {
  return handleUpdateStatus(request, context);
}

async function handleUpdateStatus(request: Request, context: RouteParams) {
  try {
    // 1. Otorisasi: Rekruter atau Admin
    const currentUser = await requireRole(["recruiter", "admin"]);

    // 2. Baca parameter ID
    const { id } = await context.params;
    if (!id || id.trim().length === 0) {
      return jsonError("BAD_REQUEST", "ID lamaran tidak valid.", 400);
    }

    // 3. Baca body request
    const body = await request.json().catch(() => null);
    if (!body || typeof body.status !== "string") {
      return jsonError("BAD_REQUEST", "Kolom 'status' wajib diisi.", 400);
    }

    // 4. Eksekusi pembaruan status dan trigger notifikasi
    const result = await updateApplicationStatus(
      id,
      body.status,
      body.note,
      currentUser,
    );

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

    console.error("Gagal memperbarui status lamaran:", error);
    return jsonError("INTERNAL_ERROR", "Terjadi kesalahan saat memperbarui status lamaran.", 500);
  }
}

