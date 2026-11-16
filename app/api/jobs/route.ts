import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { jobCreateSchema } from "@/lib/validations/job";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";

// Create and publish a job vacancy (recruiter only).
// The creator identity always comes from the authenticated session.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("UNAUTHENTICATED", "Anda harus masuk terlebih dahulu.", 401);
  }
  if (user.role !== "recruiter") {
    return jsonError(
      "FORBIDDEN",
      "Hanya rekruter yang dapat membuat lowongan.",
      403,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Body permintaan tidak valid.", 400);
  }

  const parsed = jobCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(zodFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { data: jobId, error } = await supabase.rpc("create_job_with_skills", {
    p_company_id: parsed.data.companyId,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_location: parsed.data.location,
    p_employment_type: parsed.data.employmentType,
    p_skills: parsed.data.skills,
  });

  if (error) {
    if (error.code === "42501") {
      return jsonError(
        "JOB_CREATE_FORBIDDEN",
        "Anda tidak memiliki membership perusahaan terverifikasi untuk lowongan ini.",
        403,
      );
    }
    if (error.code === "22023") {
      return jsonError(
        "JOB_CREATE_INVALID",
        "Data lowongan tidak valid. Periksa kembali isian Anda.",
        422,
      );
    }
    return jsonError(
      "JOB_CREATE_FAILED",
      "Lowongan belum dapat dipublikasikan. Coba lagi nanti.",
      500,
    );
  }

  return jsonOk({ jobId }, { status: 201 });
}
