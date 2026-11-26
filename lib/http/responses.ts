import { NextResponse } from "next/server";

/**
 * Standard API response envelope for Kestara route handlers.
 * Success: { data: ... }
 * Failure: { error: { code, message } }
 */
export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  fieldErrors?: Record<string, string>,
) {
  const error =
    fieldErrors && Object.keys(fieldErrors).length > 0
      ? { code, message, fieldErrors }
      : { code, message };

  return NextResponse.json({ error }, { status });
}

