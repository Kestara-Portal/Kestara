import { AuthError, requireRole } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";

// KP-53: POST /api/applications
// STUB: sudah cek login + role jobseeker dan validasi input, tetapi BELUM
// menyimpan ke database. Tabel lamaran (KP-54) menunggu keputusan migrasi
// database. Jangan dianggap fitur lengkap.
export async function POST(request: Request) {
  try {
    const user = await requireRole(["jobseeker"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Body permintaan tidak valid.", 400);
    }

    const jobId =
      typeof body === "object" && body !== null && "jobId" in body
        ? (body as { jobId: unknown }).jobId
        : undefined;

    if (typeof jobId !== "string" || jobId.trim().length === 0 || jobId.length > 100) {
      return jsonError("VALIDATION_ERROR", "jobId wajib diisi.", 400);
    }

    // TODO(KP-54): cek lowongan ada & dibuka, lalu insert ke tabel applications
    // dengan applicant_id = user.id (dari sesi, bukan dari request).
    void user;

    return jsonOk({ jobId, persisted: false }, { status: 202 });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(
        error.code,
        error.message,
        error.code === "UNAUTHENTICATED" ? 401 : 403,
      );
    }

    console.error("POST /api/applications gagal");
    return jsonError("INTERNAL_ERROR", "Gagal memproses lamaran.", 500);
  }
}