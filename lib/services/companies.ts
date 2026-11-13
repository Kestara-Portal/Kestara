import type { CurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/utils/errors";
import { companyWebsiteDomain, normalizeCompanyName } from "@/lib/validations/company";
import type { CompanyRow } from "@/types/database";

/**
 * E04-C — Company registration use case.
 *
 * Presentation → this use case → data access (`CompanyDeps`).
 * The data access port is injected so the authorization and duplicate rules can
 * be tested without a live database; the Supabase implementation lives in
 * `lib/services/supabase-deps.ts`.
 */

export interface CompanyInsert {
  name: string;
  description: string | null;
  website: string | null;
  location: string | null;
  logo_path: string | null;
  created_by: string;
}

export interface CompanyDeps {
  /** True when a company with the same normalized name or website domain exists. */
  duplicateExists(input: { name: string; domain: string | null }): Promise<boolean>;
  insertCompany(values: CompanyInsert): Promise<CompanyRow>;
}

export interface RegisterCompanyInput {
  name: string;
  description?: string | null;
  website?: string | null;
  location?: string | null;
  logo_path?: string | null;
}

/** Roles allowed to register a company (mirrors the RLS INSERT policy). */
export function canRegisterCompany(actor: CurrentUser): boolean {
  return actor.role === "admin" || actor.role === "recruiter";
}

export function assertCanRegisterCompany(actor: CurrentUser): void {
  if (!canRegisterCompany(actor)) {
    throw new AppError(
      "Hanya administrator atau rekruter yang dapat mendaftarkan perusahaan.",
      "FORBIDDEN",
      403,
    );
  }
}

export async function registerCompany(
  input: RegisterCompanyInput,
  actor: CurrentUser,
  deps: CompanyDeps,
): Promise<CompanyRow> {
  // Defense in depth: the route handler already applied requireRole().
  assertCanRegisterCompany(actor);

  const duplicate = await deps.duplicateExists({
    name: normalizeCompanyName(input.name),
    domain: companyWebsiteDomain(input.website),
  });

  if (duplicate) {
    throw new AppError(
      "Perusahaan dengan nama atau situs web yang sama sudah terdaftar.",
      "DUPLICATE_COMPANY",
      409,
    );
  }

  // created_by always comes from the authenticated actor, never from the request
  // body. A recruiter's owner membership is created by the database trigger, so
  // the company and its ownership are committed together.
  return deps.insertCompany({
    name: input.name.trim(),
    description: input.description ?? null,
    website: input.website ?? null,
    location: input.location ?? null,
    logo_path: input.logo_path ?? null,
    created_by: actor.id,
  });
}
