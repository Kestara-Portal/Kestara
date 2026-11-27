import { AuthError, requireRole } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";
import { createClient } from "@/lib/supabase/server";

// KP-53: POST /api/applications
// Menyimpan lamaran milik jobseeker yang sedang login.
//
// Kebijakan PM: satu pelamar boleh melamar lowongan yang sama berulang kali
// (tidak ada constraint unik). Hanya lowongan berstatus 'published' yang bisa
// dilamar. Aturan itu dijaga dua kali: RLS pada tabel jobs (jobseeker hanya
// melihat lowongan published) dan policy insert pada tabel applications.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const JOB_UNAVAILABLE_MESSAGE = "Lowongan tidak ditemukan atau sudah ditutup.";

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

    if (typeof jobId !== "string" || !UUID_PATTERN.test(jobId)) {
      return jsonError("VALIDATION_ERROR", "jobId tidak valid.", 400);
    }

    const supabase = await createClient();

    // RLS: jobseeker hanya bisa membaca lowongan 'published'. Lowongan yang
    // ditutup atau diarsipkan tampil sama seperti lowongan yang tidak ada.
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) {
      console.error("POST /api/applications: gagal membaca lowongan");
      return jsonError("INTERNAL_ERROR", "Gagal memproses lamaran.", 500);
    }
    if (!job) {
      return jsonError("JOB_UNAVAILABLE", JOB_UNAVAILABLE_MESSAGE, 404);
    }

    // applicant_id selalu dari sesi, tidak pernah dari request.
    const { data: created, error: insertError } = await supabase
      .from("applications")
      .insert({ job_id: jobId, applicant_id: user.id })
      .select("id, job_id, status, submitted_at")
      .single();

    if (insertError) {
      // 42501 = ditolak RLS (lowongan berubah status saat dikirim),
      // 23503 = lowongan sudah tidak ada.
      if (insertError.code === "42501" || insertError.code === "23503") {
        return jsonError("JOB_UNAVAILABLE", JOB_UNAVAILABLE_MESSAGE, 404);
      }
      console.error("POST /api/applications: gagal menyimpan lamaran");
      return jsonError("INTERNAL_ERROR", "Gagal menyimpan lamaran.", 500);
    }

    return jsonOk(
      {
        id: created.id,
        jobId: created.job_id,
        status: created.status,
        submittedAt: created.submitted_at,
      },
      { status: 201 },
    );
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