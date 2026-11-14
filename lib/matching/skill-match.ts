export interface JobSkillRequirement {
  skillName: string;
  weight?: number | null;
}

function normalizeSkillName(skillName: string): string {
  return skillName.trim().toLocaleLowerCase();
}

/**
 * Calculates a candidate's skill match percentage against job requirements.
 * Uses configured weights only when every requirement has a finite,
 * non-negative weight. Otherwise, all requirements receive equal weight.
 * Returns null when there are no usable requirements or total weight is zero.
 */
export function calculateSkillMatchScore(
  candidateSkills: readonly string[],
  requirements: readonly JobSkillRequirement[],
): number | null {
  const usableRequirements = requirements.filter(
    (requirement) => normalizeSkillName(requirement.skillName).length > 0,
  );

  if (usableRequirements.length === 0) {
    return null;
  }

  const candidateSkillSet = new Set(
    candidateSkills
      .map(normalizeSkillName)
      .filter((skillName) => skillName.length > 0),
  );

  const hasCompleteValidWeights = usableRequirements.every(
    (requirement) =>
      typeof requirement.weight === "number" &&
      Number.isFinite(requirement.weight) &&
      requirement.weight >= 0,
  );

  const equalWeight = 1;
  const weightedRequirements = usableRequirements.map((requirement) => ({
    skillName: normalizeSkillName(requirement.skillName),
    weight: hasCompleteValidWeights ? requirement.weight! : equalWeight,
  }));

  const totalWeight = weightedRequirements.reduce(
    (total, requirement) => total + requirement.weight,
    0,
  );

  if (totalWeight <= 0) {
    return null;
  }

  const matchedWeight = weightedRequirements.reduce(
    (total, requirement) =>
      total +
      (candidateSkillSet.has(requirement.skillName) ? requirement.weight : 0),
    0,
  );

  return Math.round((matchedWeight / totalWeight) * 10000) / 100;
}
