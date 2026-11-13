import { z } from "zod";

import { EMPLOYMENT_TYPES } from "@/types/database";

import { emptyToNull, toFieldErrors, type FieldErrors } from "./shared";

/**
 * E02-U — Job vacancy update validation.
 *
 * `required_skills` is stored as JSONB and must always be a structured list of
 * distinct, non-empty skill names. The client may only send the editable fields;
 * `company_id` and `recruiter_id` are rejected by the route handler and are not
 * updatable in the database.
 */

export const VACANCY_TITLE_MAX = 150;
export const VACANCY_DESCRIPTION_MAX = 10000;
export const VACANCY_LOCATION_MAX = 200;
export const VACANCY_SKILL_MAX_LENGTH = 60;
export const VACANCY_SKILLS_MAX_COUNT = 30;

/** Trims, drops empties, and de-duplicates skills case-insensitively (keeps first spelling). */
export function normalizeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const skill of skills) {
    const trimmed = skill.trim().replace(/\s+/g, " ");
    if (trimmed.length === 0) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

const skillsSchema = z
  .array(z.string(), { error: "Keahlian harus dikirim sebagai daftar." })
  .max(VACANCY_SKILLS_MAX_COUNT, `Maksimal ${VACANCY_SKILLS_MAX_COUNT} keahlian per lowongan.`)
  .transform((skills) => normalizeSkills(skills))
  .refine(
    (skills) => skills.length >= 1,
    "Tambahkan minimal satu keahlian atau kualifikasi yang dibutuhkan.",
  )
  .refine(
    (skills) => skills.every((skill) => skill.length <= VACANCY_SKILL_MAX_LENGTH),
    `Setiap keahlian maksimal ${VACANCY_SKILL_MAX_LENGTH} karakter.`,
  );

export const vacancyUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul lowongan minimal 3 karakter.")
    .max(VACANCY_TITLE_MAX, `Judul lowongan maksimal ${VACANCY_TITLE_MAX} karakter.`),
  description: z
    .string()
    .trim()
    .min(1, "Deskripsi lowongan wajib diisi.")
    .max(VACANCY_DESCRIPTION_MAX, `Deskripsi maksimal ${VACANCY_DESCRIPTION_MAX} karakter.`),
  required_skills: skillsSchema,
  employment_type: z
    .union([z.enum(EMPLOYMENT_TYPES), z.literal("")])
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value)),
  location: z
    .string()
    .trim()
    .max(VACANCY_LOCATION_MAX, `Lokasi maksimal ${VACANCY_LOCATION_MAX} karakter.`)
    .optional()
    .transform((value) => emptyToNull(value ?? "")),
  is_active: z.boolean({ error: "Status lowongan harus berupa boolean." }),
  // A closed vacancy must be explicitly confirmed before it can be edited or
  // reopened. The server enforces this; the UI surfaces the prompt.
  confirm_reopen: z.boolean().optional().default(false),
});

export type VacancyUpdateInput = z.infer<typeof vacancyUpdateSchema>;

export type VacancyUpdateResult =
  | { ok: true; data: VacancyUpdateInput }
  | { ok: false; fieldErrors: FieldErrors };

export function validateVacancyUpdate(input: unknown): VacancyUpdateResult {
  const parsed = vacancyUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}
