import type { CurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/utils/errors";
import type { JobVacancyRow } from "@/types/database";

/**
 * E02-U — Job vacancy update use case.
 *
 * Authorization is company-scoped: a recruiter may only touch a vacancy that
 * belongs to a company where they hold a membership row. `company_id` and
 * `recruiter_id` are never part of the update patch, and the database does not
 * grant UPDATE on those columns, so a vacancy cannot be moved between companies.
 */

export type VacancyUpdatePatch = Pick<
  JobVacancyRow,
  "title" | "description" | "required_skills" | "employment_type" | "location" | "is_active"
>;

export interface VacancyDeps {
  findVacancy(id: string): Promise<JobVacancyRow | null>;
  /** Membership check for the vacancy's company (never a client-supplied company id). */
  isCompanyMember(companyId: string, userId: string): Promise<boolean>;
  applyUpdate(id: string, patch: VacancyUpdatePatch): Promise<JobVacancyRow>;
}

export interface UpdateVacancyInput extends VacancyUpdatePatch {
  confirm_reopen: boolean;
}

/** Admin, or a recruiter with a membership row on the vacancy's company. */
export function canManageVacancy(actor: CurrentUser, isMemberOfVacancyCompany: boolean): boolean {
  if (actor.role === "admin") return true;
  return actor.role === "recruiter" && isMemberOfVacancyCompany;
}

async function loadAuthorizedVacancy(
  id: string,
  actor: CurrentUser,
  deps: VacancyDeps,
): Promise<JobVacancyRow> {
  const vacancy = await deps.findVacancy(id);

  // A vacancy outside the caller's scope is reported as not found so the API
  // does not confirm the existence of another company's records.
  if (!vacancy) {
    throw new AppError("Lowongan tidak ditemukan.", "VACANCY_NOT_FOUND", 404);
  }

  // Membership is only meaningful for recruiters; admins bypass it and other
  // roles are rejected without an extra query.
  const isMember =
    actor.role === "recruiter"
      ? await deps.isCompanyMember(vacancy.company_id, actor.id)
      : false;

  if (!canManageVacancy(actor, isMember)) {
    throw new AppError(
      "Anda tidak memiliki akses untuk mengubah lowongan ini.",
      "VACANCY_FORBIDDEN",
      403,
    );
  }

  return vacancy;
}

/** Read path for the edit form: returns the vacancy only if the actor may edit it. */
export async function getVacancyForEdit(
  id: string,
  actor: CurrentUser,
  deps: VacancyDeps,
): Promise<JobVacancyRow> {
  return loadAuthorizedVacancy(id, actor, deps);
}

export async function updateVacancy(
  id: string,
  input: UpdateVacancyInput,
  actor: CurrentUser,
  deps: VacancyDeps,
): Promise<JobVacancyRow> {
  const vacancy = await loadAuthorizedVacancy(id, actor, deps);

  // Closed/archived lifecycle: editing a closed vacancy requires an explicit
  // confirmation from the recruiter (the UI asks before resubmitting).
  if (!vacancy.is_active && !input.confirm_reopen) {
    throw new AppError(
      "Lowongan ini sudah ditutup. Konfirmasi pembukaan kembali sebelum mengubahnya.",
      "VACANCY_CLOSED_CONFIRMATION_REQUIRED",
      409,
    );
  }

  const patch: VacancyUpdatePatch = {
    title: input.title,
    description: input.description,
    required_skills: input.required_skills,
    employment_type: input.employment_type,
    location: input.location,
    is_active: input.is_active,
  };

  return deps.applyUpdate(vacancy.id, patch);
}
