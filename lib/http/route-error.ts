import { AuthError } from "@/lib/auth/session";
import { AppError } from "@/lib/utils/errors";

import { jsonError } from "./responses";

/**
 * Maps application-layer errors to the standard response envelope.
 *
 * - `AuthError` → 401 (unauthenticated) or 403 (wrong role)
 * - `AppError`  → its declared status (403/404/409/...)
 * - anything else → 500 with a generic message; internal details never leak.
 */
export function toRouteError(error: unknown) {
  if (error instanceof AuthError) {
    return jsonError(error.code, error.message, error.code === "UNAUTHENTICATED" ? 401 : 403);
  }

  if (error instanceof AppError) {
    return jsonError(error.code, error.message, error.status);
  }

  return jsonError("INTERNAL_ERROR", "Terjadi kesalahan. Silakan coba lagi.", 500);
}

/**
 * Reads a JSON request body. Returns `null` for malformed or empty bodies so the
 * caller can answer with a validation error instead of a 500.
 */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}
