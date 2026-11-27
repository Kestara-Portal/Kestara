import { describe, expect, it } from "vitest";

import { jobCreateSchema } from "@/lib/validations/job";

const base = {
  companyId: "7b15225c-2a7f-4de7-a634-47c9a4f07a72",
  title: "Backend Engineer",
  description: "Membangun dan memelihara layanan backend untuk platform Kestara.",
  location: "Jakarta",
  employmentType: "Penuh waktu",
  skills: ["TypeScript", "PostgreSQL"],
};

describe("jobCreateSchema", () => {
  it("accepts a valid job payload", () => {
    const result = jobCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("requires a valid company identifier", () => {
    const result = jobCreateSchema.safeParse({ ...base, companyId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("deduplicates skills case-insensitively", () => {
    const result = jobCreateSchema.safeParse({
      ...base,
      skills: ["React", "react", "Node", "  Node  "],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toEqual(["React", "Node"]);
    }
  });

  it("requires at least one skill", () => {
    const result = jobCreateSchema.safeParse({ ...base, skills: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short title", () => {
    const result = jobCreateSchema.safeParse({ ...base, title: "AB" });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short description", () => {
    const result = jobCreateSchema.safeParse({ ...base, description: "Terlalu pendek" });
    expect(result.success).toBe(false);
  });

  it("normalizes an empty employment type to null", () => {
    const result = jobCreateSchema.safeParse({ ...base, employmentType: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.employmentType).toBeNull();
    }
  });
});
