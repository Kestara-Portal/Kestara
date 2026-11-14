import { describe, expect, it } from "vitest";

import { calculateSkillMatchScore } from "@/lib/matching/skill-match";

describe("calculateSkillMatchScore", () => {
  it("returns null when a job has no skill requirements", () => {
    expect(calculateSkillMatchScore(["TypeScript"], [])).toBeNull();
  });

  it("returns null when all requirement names are blank", () => {
    expect(
      calculateSkillMatchScore(["TypeScript"], [{ skillName: "  " }]),
    ).toBeNull();
  });

  it("returns 100 when every required skill matches", () => {
    expect(
      calculateSkillMatchScore(
        ["TypeScript", "React"],
        [{ skillName: "TypeScript" }, { skillName: "React" }],
      ),
    ).toBe(100);
  });

  it("returns 50 when half of equally weighted skills match", () => {
    expect(
      calculateSkillMatchScore(
        ["TypeScript"],
        [{ skillName: "TypeScript" }, { skillName: "React" }],
      ),
    ).toBe(50);
  });

  it("matches skill names without case sensitivity or surrounding spaces", () => {
    expect(
      calculateSkillMatchScore(
        ["  TYPESCRIPT  "],
        [{ skillName: "typescript" }],
      ),
    ).toBe(100);
  });

  it("uses configured weights when every requirement has a valid weight", () => {
    expect(
      calculateSkillMatchScore(
        ["TypeScript"],
        [
          { skillName: "TypeScript", weight: 3 },
          { skillName: "React", weight: 1 },
        ],
      ),
    ).toBe(75);
  });

  it("uses equal weights when configured weights are incomplete", () => {
    expect(
      calculateSkillMatchScore(
        ["TypeScript"],
        [
          { skillName: "TypeScript", weight: 3 },
          { skillName: "React" },
        ],
      ),
    ).toBe(50);
  });

  it("uses equal weights when a configured weight is invalid", () => {
    expect(
      calculateSkillMatchScore(
        ["TypeScript"],
        [
          { skillName: "TypeScript", weight: -2 },
          { skillName: "React", weight: 1 },
        ],
      ),
    ).toBe(50);
  });

  it("returns null when all configured weights total zero", () => {
    expect(
      calculateSkillMatchScore(
        ["TypeScript"],
        [{ skillName: "TypeScript", weight: 0 }, { skillName: "React", weight: 0 }],
      ),
    ).toBeNull();
  });

  it("ignores blank candidate skill names", () => {
    expect(
      calculateSkillMatchScore(
        [" ", "TypeScript"],
        [{ skillName: "TypeScript" }, { skillName: "React" }],
      ),
    ).toBe(50);
  });
});
