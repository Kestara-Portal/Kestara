export const APP_ROLES = ["jobseeker", "mentor", "recruiter", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

// Roles allowed through public registration. Admin is provisioned separately.
export const PUBLIC_ROLES = ["jobseeker", "mentor", "recruiter"] as const;
export type PublicRole = (typeof PUBLIC_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

export function isPublicRole(value: unknown): value is PublicRole {
  return typeof value === "string" && (PUBLIC_ROLES as readonly string[]).includes(value);
}

// Legacy identifiers used by the old MySQL/NextAuth implementation.
const LEGACY_ROLE_MAP: Record<string, AppRole> = {
  pencari: "jobseeker",
  jobseeker: "jobseeker",
  mentor: "mentor",
  rekruter: "recruiter",
  recruiter: "recruiter",
  admin: "admin",
};

export function normalizeLegacyRole(value: string): AppRole | null {
  const key = value.trim().toLowerCase();
  return LEGACY_ROLE_MAP[key] ?? null;
}

const ROLE_LABELS: Record<AppRole, string> = {
  jobseeker: "Pencari Kerja",
  mentor: "Mentor",
  recruiter: "Rekruter",
  admin: "Administrator",
};

export function roleLabel(role: AppRole): string {
  return ROLE_LABELS[role];
}
