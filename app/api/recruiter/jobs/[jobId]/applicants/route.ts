import { NextRequest } from "next/server";
import { AuthError, requireRole } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";
import { getBlindApplicantsForJob } from "@/lib/services/blind-profile";
import { AppError } from "@/lib/utils/errors";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/recruiter/jobs/[jobId]/applicants
 * Returns the masked blind profiles and match scores of applicants for a given job.
 * Only accessible by recruiters and administrators.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["recruiter", "admin"]);
    const { jobId } = await params;

    const data = await getBlindApplicantsForJob(jobId, user.role);

    return jsonOk(data);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
      return jsonError(error.code, error.message, status);
    }

    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status);
    }

    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal.";
    return jsonError("INTERNAL_ERROR", message, 500);
  }
}
