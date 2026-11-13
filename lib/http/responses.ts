import { NextResponse } from "next/server";

/**
 * Standard API response envelope for Kestara route handlers.
 * Success: { data: ... }
 * Failure: { error: { code, message } }
 */
export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * Validation failure with per-field messages so the client can render inline
 * errors. Keeps the same `{ error: { code, message } }` envelope shape.
 */
export function jsonValidationError(
  fieldErrors: Record<string, string>,
  message = "Data yang dikirim belum valid.",
) {
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message, fieldErrors } },
    { status: 422 },
  );
}
