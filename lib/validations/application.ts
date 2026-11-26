import { z } from "zod";

/**
 * KP-63 / E05-D: validation for withdrawing a job application.
 *
 * The application id comes from the URL and the reason is optional free text.
 * Both are validated server-side before any row is touched.
 */

export const WITHDRAWAL_REASON_MAX = 500;

export interface WithdrawApplicationInput {
  reason: string | null;
}

export type FieldErrors = Record<string, string>;

export type WithdrawValidation =
  | { success: true; data: WithdrawApplicationInput }
  | { success: false; fieldErrors: FieldErrors };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isApplicationId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function validateApplicationId(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "ID lamaran wajib diisi.";
  }
  if (!isApplicationId(value)) return "Format ID lamaran tidak valid.";
  return null;
}

export const withdrawApplicationSchema = z.object({
  reason: z
    .string()
    .nullish()
    .transform((value) => {
      const trimmed = (value ?? "").trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .refine((value) => value === null || value.length <= WITHDRAWAL_REASON_MAX, {
      message: `Alasan maksimal ${WITHDRAWAL_REASON_MAX} karakter.`,
    }),
});

/**
 * Parses the optional request body. An absent body is valid: the reason is
 * optional, so `DELETE /api/applications/[id]` with no payload still works.
 */
export function validateWithdrawApplication(input: unknown): WithdrawValidation {
  const result = withdrawApplicationSchema.safeParse(input ?? {});

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
