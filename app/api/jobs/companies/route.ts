import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/http/responses";
import { getVerifiedCompaniesForRecruiter } from "@/lib/jobs/companies";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("UNAUTHENTICATED", "Anda harus masuk terlebih dahulu.", 401);
  }
  if (user.role !== "recruiter") {
    return jsonError(
      "FORBIDDEN",
      "Hanya rekruter yang dapat melihat perusahaan untuk lowongan.",
      403,
    );
  }

  const result = await getVerifiedCompaniesForRecruiter(user.id);
  if (!result.ok) {
    return jsonError(
      "COMPANIES_LOAD_FAILED",
      "Daftar perusahaan belum dapat dimuat. Coba lagi.",
      500,
    );
  }

  return jsonOk({ companies: result.companies });
}
