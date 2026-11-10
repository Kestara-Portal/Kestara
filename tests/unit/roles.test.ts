import { describe, expect, it } from "vitest";

import {
  APP_ROLES,
  PUBLIC_ROLES,
  isAppRole,
  isPublicRole,
  normalizeLegacyRole,
  roleLabel,
} from "@/lib/auth/roles";

describe("roles", () => {
  it("exposes the four canonical roles", () => {
    expect(APP_ROLES).toEqual(["jobseeker", "mentor", "recruiter", "admin"]);
  });

  it("public roles exclude admin", () => {
    expect(PUBLIC_ROLES).toEqual(["jobseeker", "mentor", "recruiter"]);
    expect(PUBLIC_ROLES).not.toContain("admin");
  });

  it("validates app roles", () => {
    expect(isAppRole("jobseeker")).toBe(true);
    expect(isAppRole("admin")).toBe(true);
    expect(isAppRole("superadmin")).toBe(false);
    expect(isAppRole(null)).toBe(false);
    expect(isAppRole(123)).toBe(false);
  });

  it("validates public roles and rejects admin", () => {
    expect(isPublicRole("mentor")).toBe(true);
    expect(isPublicRole("admin")).toBe(false);
  });

  it("maps legacy role identifiers", () => {
    expect(normalizeLegacyRole("pencari")).toBe("jobseeker");
    expect(normalizeLegacyRole("PENCARI")).toBe("jobseeker");
    expect(normalizeLegacyRole("rekruter")).toBe("recruiter");
    expect(normalizeLegacyRole("mentor")).toBe("mentor");
    expect(normalizeLegacyRole("unknown")).toBeNull();
  });

  it("provides Indonesian labels", () => {
    expect(roleLabel("jobseeker")).toBe("Pencari Kerja");
    expect(roleLabel("admin")).toBe("Administrator");
  });
});
