/**
 * Application-layer error type. Use for expected, user-facing failures that
 * map to an HTTP status. Never include secrets or raw database errors.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Converts an unknown thrown value into a safe message. Internal/unknown errors
 * are replaced with a generic message so implementation details never leak.
 */
export function toSafeMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  return "Terjadi kesalahan. Silakan coba lagi.";
}
