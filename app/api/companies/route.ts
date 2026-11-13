import { AuthError, requireRole } from "@/lib/auth/session";
import { readJsonBody, toRouteError } from "@/lib/http/route-error";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { getCompaniesForAdmin, registerCompany } from "@/lib/services/companies";
import { supabaseCompanyDeps } from "@/lib/services/companies-deps";
import { AppError } from "@/lib/utils/errors";
import { validateCompanyRegistration } from "@/lib/validations/company";

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

/**
 * E04-C – Register a company profile.
 *
 * POST /api/companies
 * Body: { name, description?, website?, location?, logo_path? }
 *
 * Roles: admin, recruiter. Anyone else is rejected by `requireRole` (401/403)
 * and again by RLS on `public.companies`.
 */
export async function POST(request: Request) {
  try {
    const actor = await requireRole(["admin", "recruiter"]);

    const body = await readJsonBody(request);
    const parsed = validateCompanyRegistration(body);
    if (!parsed.ok) {
      return jsonValidationError(parsed.fieldErrors, "Data perusahaan belum valid.");
    }

    const company = await registerCompany(parsed.data, actor, await supabaseCompanyDeps());

    return jsonOk({ company }, { status: 201 });
  } catch (error) {
    return toRouteError(error);
  }
}
