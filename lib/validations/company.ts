import { z } from "zod";
import { emptyToNull, toFieldErrors, type FieldErrors } from "./shared";

export type { FieldErrors };

/**
 * KP-27 / E04-U: validation for the company profile update form.
 * KP-19 / E04-C: validation for company registration.
 */

// --- Shared constants ---
export const COMPANY_NAME_MIN = 2;
export const COMPANY_NAME_MAX = 255;
export const COMPANY_DESCRIPTION_MAX = 2000;
export const COMPANY_LOCATION_MAX = 255;
export const COMPANY_LOGO_PATH_MAX = 512;
export const COMPANY_WEBSITE_MAX = 300;

// --- Shared utilities ---

/** Case-insensitive, whitespace-normalized company name used for duplicate checks. */
export function normalizeCompanyName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCompanyId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function validateCompanyId(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "ID perusahaan wajib diisi.";
  }
  if (!isCompanyId(value)) return "Format ID perusahaan tidak valid.";
  return null;
}

/**
 * Canonical form of a company website: `https://host[:port]`, lower-cased,
 * without a trailing slash. Returns null when the value is not an http(s)
 * address with a real host, so the caller can surface a field error.
 *
 * The canonical form is what gets persisted, which is what the
 * `companies_normalized_website_key` unique index compares.
 */
export function normalizeCompanyWebsite(value: string): string | null {
  const raw = value.trim();
  if (raw.length === 0) return null;

  // A scheme without "//" (mailto:, javascript:, data:) is never a company site.
  // Only http(s) is accepted, with or without the explicit scheme.
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  if (hasScheme && !/^https?:\/\//i.test(raw)) return null;

  const withScheme = hasScheme ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname.includes(".")) return null;
  // Credentials embedded in the URL must never be stored as a company website.
  if (url.username.length > 0 || url.password.length > 0) return null;

  return url.origin.toLowerCase();
}

/** Storage object path, not an absolute URL and free of traversal segments. */
export function isSafeLogoPath(value: string): boolean {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return false;
  if (value.startsWith("/") || value.startsWith("\\")) return false;
  if (value.split(/[\\\/]/).some((segment) => segment === ".." || segment === ".")) {
    return false;
  }
  return /^[A-Za-z0-9._/-]+$/.test(value);
}

// =============================================================================
// KP-27 / E04-U – Update Company Schema
// =============================================================================

export interface UpdateCompanyInput {
  name: string;
  description: string | null;
  website: string | null;
  location: string | null;
  logo_path: string | null;
}

export type UpdateCompanyValidation =
  | { success: true; data: UpdateCompanyInput }
  | { success: false; fieldErrors: FieldErrors };

const optionalText = (max: number, label: string) =>
  z
    .string()
    .nullish()
    .transform((value) => {
      const trimmed = (value ?? "").trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .refine((value) => value === null || value.length <= max, {
      message: `${label} maksimal ${max} karakter.`,
    });

const companyName = z
  .string({ message: "Nama perusahaan wajib diisi." })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: "Nama perusahaan wajib diisi." })
  .refine((value) => value.length >= COMPANY_NAME_MIN, {
    message: `Nama perusahaan minimal ${COMPANY_NAME_MIN} karakter.`,
  })
  .refine((value) => value.length <= COMPANY_NAME_MAX, {
    message: `Nama perusahaan maksimal ${COMPANY_NAME_MAX} karakter.`,
  });

const companyWebsite = z
  .string()
  .nullish()
  .superRefine((value, ctx) => {
    const trimmed = (value ?? "").trim();
    if (trimmed.length === 0) return;
    if (normalizeCompanyWebsite(trimmed) === null) {
      ctx.addIssue({
        code: "custom",
        message: "Alamat website tidak valid (contoh: https://perusahaan.co.id).",
      });
    }
  })
  .transform((value) => {
    const trimmed = (value ?? "").trim();
    return trimmed.length === 0 ? null : normalizeCompanyWebsite(trimmed);
  });

const companyLogoPath = z
  .string()
  .nullish()
  .transform((value) => {
    const trimmed = (value ?? "").trim();
    return trimmed.length === 0 ? null : trimmed;
  })
  .refine(
    (value) =>
      value === null ||
      (value.length <= COMPANY_LOGO_PATH_MAX && isSafeLogoPath(value)),
    { message: "Path logo tidak valid." },
  );

export const updateCompanySchema = z.object({
  name: companyName,
  description: optionalText(COMPANY_DESCRIPTION_MAX, "Deskripsi"),
  website: companyWebsite,
  location: optionalText(COMPANY_LOCATION_MAX, "Lokasi"),
  logo_path: companyLogoPath,
});

/** Maps zod issues to `{ field: message }` for the API error envelope. */
export function validateUpdateCompany(input: unknown): UpdateCompanyValidation {
  const result = updateCompanySchema.safeParse(input ?? {});

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : "_form";
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }

  return { success: false, fieldErrors };
}

// =============================================================================
// KP-19 / E04-C – Company Registration Schema
// =============================================================================

const HTTP_URL_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*$/i;
const STORAGE_PATH_PATTERN = /^[A-Za-z0-9._/-]+$/;

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
