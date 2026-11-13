import { requireRole } from "@/lib/auth/session";
import { readJsonBody, toRouteError } from "@/lib/http/route-error";
import { jsonOk, jsonValidationError } from "@/lib/http/responses";
import { registerCompany } from "@/lib/services/companies";
import { supabaseCompanyDeps } from "@/lib/services/companies-deps";
import { validateCompanyRegistration } from "@/lib/validations/company";

/**
 * E04-C — Register a company profile.
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
