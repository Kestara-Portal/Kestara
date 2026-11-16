import { describe, expect, it } from "vitest";

import {
  passwordChangeSchema,
  portfolioInputSchema,
  profileUpdateSchema,
  skillInputSchema,
} from "@/lib/validations/profile";

describe("profileUpdateSchema", () => {
  it("accepts a valid profile and normalizes empty optionals to null", () => {
    const result = profileUpdateSchema.safeParse({
      fullName: "Budi Santoso",
      phoneNumber: "",
      bio: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phoneNumber).toBeNull();
      expect(result.data.bio).toBeNull();
    }
  });

  it("rejects a too-short name", () => {
    const result = profileUpdateSchema.safeParse({ fullName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an over-long bio", () => {
    const result = profileUpdateSchema.safeParse({
      fullName: "Budi",
      bio: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe("skillInputSchema", () => {
  it("accepts a valid skill", () => {
    const result = skillInputSchema.safeParse({ skillName: "Analisis data", category: "Data" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty skill name", () => {
    const result = skillInputSchema.safeParse({ skillName: "   " });
    expect(result.success).toBe(false);
  });
});

describe("portfolioInputSchema", () => {
  it("accepts a valid portfolio item", () => {
    const result = portfolioInputSchema.safeParse({
      title: "Proyek Analitik",
      projectUrl: "https://example.com/project",
      startDate: "2024-01-01",
      endDate: "2024-06-30",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL", () => {
    const result = portfolioInputSchema.safeParse({
      title: "Proyek",
      projectUrl: "example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects end date before start date", () => {
    const result = portfolioInputSchema.safeParse({
      title: "Proyek",
      startDate: "2024-06-01",
      endDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const result = portfolioInputSchema.safeParse({
      title: "Proyek",
      startDate: "2024-13-40",
    });
    expect(result.success).toBe(false);
  });
});

describe("passwordChangeSchema", () => {
  it("accepts a valid password change", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "oldpassword",
      newPassword: "newpassword1",
      confirmPassword: "newpassword1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched confirmation", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "oldpassword",
      newPassword: "newpassword1",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a short new password", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "oldpassword",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects reusing the current password", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "samepassword",
      newPassword: "samepassword",
      confirmPassword: "samepassword",
    });
    expect(result.success).toBe(false);
  });
});
