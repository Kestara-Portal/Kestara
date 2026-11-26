import { AuthError, requireRole } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";
import { withdrawApplication } from "@/lib/services/applications";
import { AppError } from "@/lib/utils/errors";
import { validateApplicationId, validateWithdrawApplication } from "@/lib/validations/application";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * KP-63 / E05-D: DELETE /api/applications/[id]
 *
 * Withdraws the caller's own application. Implemented as a status transition to
 * 'withdrawn' (history is kept), which is why DELETE is the HTTP verb the client
 * calls but no row is physically removed.
 *
 * Optional body: `{ "reason": "..." }` (max 500 characters).
 */
export async function DELETE(request: Request, context: RouteParams) {
  try {
    // 1. Otorisasi: hanya pencari kerja.
    const currentUser = await requireRole(["jobseeker"]);

    // 2. Parameter URL.
    const { id } = await context.params;
    const idError = validateApplicationId(id);
    if (idError) {
      return jsonError("BAD_REQUEST", idError, 400);
    }

    // 3. Body opsional. Permintaan tanpa body tetap sah.
    let body: unknown = null;
    const rawBody = await request.text();
    if (rawBody.trim().length > 0) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return jsonError("INVALID_JSON", "Body permintaan tidak valid.", 400);
      }
    }

    const parsed = validateWithdrawApplication(body);
    if (!parsed.success) {
      return jsonError(
        "VALIDATION_ERROR",
        parsed.fieldErrors.reason ?? "Periksa kembali alasan pembatalan.",
        400,
      );
    }

    // 4. Eksekusi use case (kepemilikan + status diperiksa di service & RLS).
    const result = await withdrawApplication(id, currentUser, { reason: parsed.data.reason });

    return jsonOk({
      success: result.success,
      status: result.status,
      application: result.application,
    });
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

    console.error("DELETE /api/applications/[id] gagal:", error);
    return jsonError("INTERNAL_ERROR", "Terjadi kesalahan saat membatalkan lamaran.", 500);
  }
}
