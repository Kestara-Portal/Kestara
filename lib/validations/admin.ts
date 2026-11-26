export type AccountStatus = "active" | "suspended" | "deactivated";

export const ALLOWED_ACCOUNT_STATUSES: readonly AccountStatus[] = [
  "active",
  "suspended",
  "deactivated",
] as const;

export function isAccountStatus(value: unknown): value is AccountStatus {
  return (
    typeof value === "string" &&
    (ALLOWED_ACCOUNT_STATUSES as readonly string[]).includes(value)
  );
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateUserId(id: string): string | null {
  const value = id.trim();
  if (value.length === 0) return "ID pengguna wajib diisi.";
  if (!UUID_PATTERN.test(value)) return "Format ID pengguna tidak valid.";
  return null;
}

export function validateAccountStatus(status: string): string | null {
  if (!isAccountStatus(status)) {
    return "Status akun tidak valid. Status yang diizinkan: active, suspended, deactivated.";
  }
  return null;
}

