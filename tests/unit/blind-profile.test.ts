import { describe, expect, it } from "vitest";

import {
  assertNoPiiLeaked,
  getBlindApplicantsForJob,
  PROHIBITED_PII_KEYS,
  sanitizeBlindProfile,
  type RawCandidateProfile,
} from "@/lib/services/blind-profile";

describe("Blind Profile Service & Privacy Guarantees", () => {
  const dummyCandidate: RawCandidateProfile = {
    id: "app-test-1",
    applicantId: "usr-abcdef12",
    jobId: "job-101",
    fullName: "Budi Rahardjo",
    email: "budi.rahardjo@example.com",
    phoneNumber: "+6281122334455",
    avatarPath: "/uploads/avatars/budi.png",
    gender: "Laki-laki",
    address: "Jl. Sudirman No. 10 Jakarta",
    status: "screening",
    appliedAt: "2026-11-14T08:00:00Z",
    educationLevel: "S1 Teknik Informatika",
    experienceYears: 4,
    experienceSummary: "Berpengalaman 4 tahun membangun web apps",
    skills: ["React", "TypeScript", "Tailwind CSS"],
    portfolio: [
      {
        title: "Web E-Commerce",
        description: "Membangun frontend marketplace inklusif",
        techStack: ["React", "Tailwind CSS"],
      },
    ],
  };

  const jobRequirements = [
    { skillName: "React", weight: 2 },
    { skillName: "TypeScript", weight: 2 },
    { skillName: "Next.js", weight: 1 },
  ];

  it("redacts all prohibited PII fields from the candidate profile", () => {
    const blind = sanitizeBlindProfile(dummyCandidate, jobRequirements);

    expect(assertNoPiiLeaked(blind as unknown as Record<string, unknown>)).toBe(true);

    PROHIBITED_PII_KEYS.forEach((key) => {
      expect((blind as unknown as Record<string, unknown>)[key]).toBeUndefined();
    });
  });

  it("generates an anonymized candidate code and masks personal identifier", () => {
    const blind = sanitizeBlindProfile(dummyCandidate, jobRequirements);

    expect(blind.candidateCode).toMatch(/^Kandidat #[A-Z0-9]{6}$/);
    expect(blind.candidateCode).not.toContain("Budi");
    expect(blind.candidateCode).not.toContain("Rahardjo");
  });

  it("accurately calculates the match score against job requirements", () => {
    const blind = sanitizeBlindProfile(dummyCandidate, jobRequirements);

    // React (weight 2) + TypeScript (weight 2) = 4 / 5 = 80%
    expect(blind.matchScore).toBe(80);
    expect(blind.matchScoreDisplay).toBe("80%");
  });

  it("identifies matched skills and preserves non-identifying portfolio", () => {
    const blind = sanitizeBlindProfile(dummyCandidate, jobRequirements);

    const reactSkill = blind.skills.find((s) => s.name === "React");
    const tailwindSkill = blind.skills.find((s) => s.name === "Tailwind CSS");

    expect(reactSkill?.isMatched).toBe(true);
    expect(tailwindSkill?.isMatched).toBe(false);
    expect(blind.portfolio.length).toBe(1);
    expect(blind.portfolio[0].title).toBe("Web E-Commerce");
  });

  it("denies access to unauthorized roles", async () => {
    await expect(
      getBlindApplicantsForJob("job-101", "jobseeker"),
    ).rejects.toThrow(/Akses ditolak/);

    await expect(
      getBlindApplicantsForJob("job-101", "mentor"),
    ).rejects.toThrow(/Akses ditolak/);
  });

  it("permits access to recruiters and admins", async () => {
    const recruiterResult = await getBlindApplicantsForJob("job-101", "recruiter");
    expect(recruiterResult.applicants.length).toBeGreaterThan(0);

    const adminResult = await getBlindApplicantsForJob("job-101", "admin");
    expect(adminResult.applicants.length).toBeGreaterThan(0);
  });
});
