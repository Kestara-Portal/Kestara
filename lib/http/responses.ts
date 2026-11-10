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
