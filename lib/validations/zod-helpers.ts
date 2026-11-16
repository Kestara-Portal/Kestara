import type { ZodError } from "zod";

/**
 * Shared Zod helpers for API validation. Works with Zod v4 issues.
 */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}
