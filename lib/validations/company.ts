import { z } from "zod";

import { emptyToNull, toFieldErrors, type FieldErrors } from "./shared";

/**
 * E04-C — Company registration validation.
 *
 * Rules mirror the database constraints in
 * `supabase/migrations/20261113000000_e02_e04_companies_vacancies.sql`:
 * a non-empty name, optional descriptive fields, and a website that is an
 * absolute http(s) URL. `logo_path` accepts a Storage object path only — never a
 * full URL, a data URI, or a path that could escape the bucket.
 */

export const COMPANY_NAME_MAX = 120;
export const COMPANY_DESCRIPTION_MAX = 2000;
export const COMPANY_LOCATION_MAX = 200;
export const COMPANY_WEBSITE_MAX = 300;
export const COMPANY_LOGO_PATH_MAX = 300;

const HTTP_URL_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*$/i;
const STORAGE_PATH_PATTERN = /^[A-Za-z0-9._/-]+$/;

/** Case-insensitive, whitespace-normalized company name used for duplicate checks. */
export function normalizeCompanyName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Reduces a website value to a comparable host, ignoring scheme, `www.`, path,
 * query string, fragment, and port. Mirrors `public.company_website_domain()`.
 */
export function companyWebsiteDomain(website: string | null | undefined): string | null {
  if (!website) return null;

  let value = website.trim().toLowerCase();
  if (value.length === 0) return null;

  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  value = value.split("/")[0];
  value = value.split("?")[0];
  value = value.split("#")[0];
  value = value.replace(/^www\./, "");
  value = value.replace(/:[0-9]+$/, "");
  value = value.replace(/^\.+|\.+$/g, "");

  return value.length === 0 ? null : value;
}

function websiteSchema() {
  return z
    .string()
    .trim()
    .max(COMPANY_WEBSITE_MAX, `Situs web maksimal ${COMPANY_WEBSITE_MAX} karakter.`)
    .refine(
      (value) => value === "" || HTTP_URL_PATTERN.test(value),
      "Situs web harus berupa URL lengkap yang diawali http:// atau https://.",
    )
    .default("")
    .transform((value) => emptyToNull(value));
}

function logoPathSchema() {
  return z
    .string()
    .trim()
    .max(COMPANY_LOGO_PATH_MAX, `Path logo maksimal ${COMPANY_LOGO_PATH_MAX} karakter.`)
    .refine(
      (value) =>
        value === "" ||
        (STORAGE_PATH_PATTERN.test(value) &&
          !value.includes("..") &&
          !value.startsWith("/")),
      "Path logo tidak valid. Gunakan path penyimpanan relatif, bukan URL.",
    )
    .default("")
    .transform((value) => emptyToNull(value));
}

export const companyRegistrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama perusahaan minimal 2 karakter.")
    .max(COMPANY_NAME_MAX, `Nama perusahaan maksimal ${COMPANY_NAME_MAX} karakter.`),
  description: z
    .string()
    .trim()
    .max(COMPANY_DESCRIPTION_MAX, `Deskripsi maksimal ${COMPANY_DESCRIPTION_MAX} karakter.`)
    .default("")
    .transform((value) => emptyToNull(value)),
  website: websiteSchema(),
  location: z
    .string()
    .trim()
    .max(COMPANY_LOCATION_MAX, `Lokasi maksimal ${COMPANY_LOCATION_MAX} karakter.`)
    .default("")
    .transform((value) => emptyToNull(value)),
  logo_path: logoPathSchema(),
});

export type CompanyRegistrationInput = z.infer<typeof companyRegistrationSchema>;

export type CompanyRegistrationResult =
  | { ok: true; data: CompanyRegistrationInput }
  | { ok: false; fieldErrors: FieldErrors };

/** Server-side entry point used by the API route and its tests. */
export function validateCompanyRegistration(input: unknown): CompanyRegistrationResult {
  const parsed = companyRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}
