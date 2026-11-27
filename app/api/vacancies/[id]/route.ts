import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { readJsonBody, toRouteError } from "@/lib/http/route-error";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { supabaseVacancyDeps } from "@/lib/services/vacancies-deps";
import { getVacancyForEdit, updateVacancy } from "@/lib/services/vacancies";
import { validateVacancyUpdate } from "@/lib/validations/vacancy";

const vacancyIdSchema = z.uuid();

type VacancyRouteContext = { params: Promise<{ id: string }> };

/**
 * E02-U — Read a vacancy for editing.
 *
 * GET /api/vacancies/[id]
 * Roles: admin, or a recruiter who belongs to the vacancy's company.
 */
export async function GET(_request: Request, context: VacancyRouteContext) {
  try {
    const actor = await requireRole(["admin", "recruiter"]);
    const { id } = await context.params;

    if (!vacancyIdSchema.safeParse(id).success) {
      return jsonError("INVALID_VACANCY_ID", "ID lowongan tidak valid.", 400);
    }

    const vacancy = await getVacancyForEdit(id, actor, await supabaseVacancyDeps());

    return jsonOk({ vacancy });
  } catch (error) {
    return toRouteError(error);
  }
}

/**
 * E02-U — Update a vacancy.
 *
 * PATCH /api/vacancies/[id]
 * Body: { title, description, required_skills, employment_type, location,
 *         is_active, confirm_reopen? }
 *
 * Company scope is enforced in the use case (membership of the vacancy's
 * company) and again by RLS. `company_id` and `recruiter_id` are ignored even if
 * supplied: they are not part of the validated schema nor of the update patch.
 */
export async function PATCH(request: Request, context: VacancyRouteContext) {
  try {
    const actor = await requireRole(["admin", "recruiter"]);
    const { id } = await context.params;

    if (!vacancyIdSchema.safeParse(id).success) {
      return jsonError("INVALID_VACANCY_ID", "ID lowongan tidak valid.", 400);
    }

    const body = await readJsonBody(request);
    const parsed = validateVacancyUpdate(body);
    if (!parsed.ok) {
      return jsonValidationError(parsed.fieldErrors, "Data lowongan belum valid.");
    }

    const vacancy = await updateVacancy(id, parsed.data, actor, await supabaseVacancyDeps());

    return jsonOk({ vacancy });
  } catch (error) {
    return toRouteError(error);
  }
}
