import { z } from "zod";

/**
 * Shared Zod → field-error helpers for Kestara server validation.
 *
 * The API envelope carries `error.fieldErrors` keyed by dotted field path so the
 * presentation layer can render inline messages next to the offending input.
 */
export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    // Keep the first message per field: it is the most specific one for a user.
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }

  return fieldErrors;
}

/** Trims a string and turns an empty result into `null` for nullable columns. */
export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Postgres `LIKE`/`ILIKE` metacharacters must be escaped to compare literally. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
