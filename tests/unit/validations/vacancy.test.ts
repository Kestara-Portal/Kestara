import { describe, expect, it } from "vitest";

import { normalizeSkills, validateVacancyUpdate } from "@/lib/validations/vacancy";

const VALID_UPDATE = {
  title: "Backend Engineer",
  description: "Membangun layanan API untuk platform karier inklusif.",
  required_skills: ["TypeScript", "PostgreSQL"],
  employment_type: "full_time",
  location: "Jakarta",
  is_active: true,
};

describe("vacancy update validation", () => {
  it("accepts a valid update", () => {
    const result = validateVacancyUpdate(VALID_UPDATE);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe("Backend Engineer");
      expect(result.data.required_skills).toEqual(["TypeScript", "PostgreSQL"]);
      expect(result.data.employment_type).toBe("full_time");
      expect(result.data.confirm_reopen).toBe(false);
    }
  });

  it("rejects an empty title", () => {
    const result = validateVacancyUpdate({ ...VALID_UPDATE, title: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.title).toBeDefined();
  });

  it("rejects an empty description", () => {
    const result = validateVacancyUpdate({ ...VALID_UPDATE, description: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.description).toBeDefined();
  });

  it("rejects a missing or empty skill list", () => {
    const missing = validateVacancyUpdate({ ...VALID_UPDATE, required_skills: undefined });
    const empty = validateVacancyUpdate({ ...VALID_UPDATE, required_skills: [] });
    const blank = validateVacancyUpdate({ ...VALID_UPDATE, required_skills: ["  ", ""] });

    expect(missing.ok).toBe(false);
    expect(empty.ok).toBe(false);
    expect(blank.ok).toBe(false);
  });

  it("rejects skills sent as a comma-separated string", () => {
    const result = validateVacancyUpdate({ ...VALID_UPDATE, required_skills: "React, Node" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.required_skills).toBeDefined();
  });

  it("trims and de-duplicates skills case-insensitively", () => {
    const result = validateVacancyUpdate({
      ...VALID_UPDATE,
      required_skills: ["  React ", "react", "Node.js", "REACT", "  "],
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.required_skills).toEqual(["React", "Node.js"]);
  });

  it("rejects more than the maximum number of skills", () => {
    const skills = Array.from({ length: 31 }, (_, index) => `Skill ${index}`);
    const result = validateVacancyUpdate({ ...VALID_UPDATE, required_skills: skills });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-long skill name", () => {
    const result = validateVacancyUpdate({
      ...VALID_UPDATE,
      required_skills: ["a".repeat(61)],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an unsupported employment type", () => {
    const result = validateVacancyUpdate({ ...VALID_UPDATE, employment_type: "permanent" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.employment_type).toBeDefined();
  });

  it("treats an empty employment type as not specified", () => {
    const result = validateVacancyUpdate({ ...VALID_UPDATE, employment_type: "" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.employment_type).toBeNull();
  });

  it("requires is_active to be a boolean", () => {
    const result = validateVacancyUpdate({ ...VALID_UPDATE, is_active: "true" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.is_active).toBeDefined();
  });

  it("ignores company and recruiter identifiers supplied by the client", () => {
    const result = validateVacancyUpdate({
      ...VALID_UPDATE,
      company_id: "11111111-1111-1111-1111-111111111111",
      recruiter_id: "22222222-2222-2222-2222-222222222222",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty("company_id");
      expect(result.data).not.toHaveProperty("recruiter_id");
    }
  });

  it("normalizes skill lists", () => {
    expect(normalizeSkills(["  Data  Analysis ", "data analysis", "SQL"])).toEqual([
      "Data Analysis",
      "SQL",
    ]);
  });
});
