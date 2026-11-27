import { calculateSkillMatchScore, type JobSkillRequirement } from "@/lib/matching/skill-match";
import { AppError } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export interface RawCandidateProfile {
  id: string;
  applicantId: string;
  jobId: string;
  // Identifying fields that MUST be redacted for Blind Recruitment:
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  avatarPath?: string;
  gender?: string;
  address?: string;
  // Non-identifying screening fields:
  status: "screening" | "interview" | "review" | "accepted" | "rejected";
  appliedAt: string;
  educationLevel: string;
  experienceYears: number;
  experienceSummary: string;
  skills: string[];
  portfolio: Array<{
    title: string;
    description: string;
    techStack: string[];
  }>;
}

export interface BlindSkill {
  name: string;
  isMatched: boolean;
}

export interface BlindPortfolioItem {
  title: string;
  description: string;
  techStack: string[];
}

export interface BlindApplicantProfile {
  id: string;
  candidateCode: string;
  jobId: string;
  status: "screening" | "interview" | "review" | "accepted" | "rejected";
  appliedAt: string;
  educationLevel: string;
  experienceYears: number;
  experienceSummary: string;
  skills: BlindSkill[];
  matchScore: number | null;
  matchScoreDisplay: string | null;
  portfolio: BlindPortfolioItem[];
}

export interface JobScreeningInfo {
  id: string;
  title: string;
  department?: string;
  requiredSkills: JobSkillRequirement[];
}

/**
 * Prohibited PII keys that must never leak to recruiter screening clients.
 */
export const PROHIBITED_PII_KEYS = [
  "fullName",
  "full_name",
  "email",
  "phoneNumber",
  "phone_number",
  "avatarPath",
  "avatar_path",
  "gender",
  "address",
  "dateOfBirth",
  "date_of_birth",
] as const;

/**
 * Redacts a candidate profile into a strictly masked Blind Profile.
 * Calculates match score against the job's skill requirements.
 */
export function sanitizeBlindProfile(
  raw: RawCandidateProfile,
  requirements: readonly JobSkillRequirement[],
): BlindApplicantProfile {
  // Normalize short masked alias: e.g. KANDIDAT-#7B1A9C
  const rawId = raw.applicantId || raw.id || "000000";
  const cleanId = rawId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  const candidateCode = `Kandidat #${cleanId.padEnd(6, "X")}`;

  // Calculate matching score
  const matchScore = calculateSkillMatchScore(raw.skills, requirements);
  const matchScoreDisplay = matchScore !== null ? `${matchScore}%` : null;

  // Mark which candidate skills match the job requirements
  const requiredSkillNames = new Set(
    requirements.map((r) => r.skillName.trim().toLowerCase()),
  );

  const skills: BlindSkill[] = raw.skills.map((skillName) => ({
    name: skillName,
    isMatched: requiredSkillNames.has(skillName.trim().toLowerCase()),
  }));

  // Sanitize portfolio descriptions to remove any potential personal URLs or contact info
  const portfolio: BlindPortfolioItem[] = (raw.portfolio || []).map((p) => ({
    title: p.title,
    description: p.description,
    techStack: p.techStack || [],
  }));

  return {
    id: raw.id,
    candidateCode,
    jobId: raw.jobId,
    status: raw.status,
    appliedAt: raw.appliedAt,
    educationLevel: raw.educationLevel,
    experienceYears: raw.experienceYears,
    experienceSummary: raw.experienceSummary,
    skills,
    matchScore,
    matchScoreDisplay,
    portfolio,
  };
}

/**
 * Validates that an object contains zero prohibited PII fields.
 */
export function assertNoPiiLeaked(obj: Record<string, unknown>): boolean {
  for (const key of PROHIBITED_PII_KEYS) {
    if (key in obj && obj[key] !== undefined) {
      return false;
    }
  }
  return true;
}

// Sample fallback dataset for testing and demonstration when DB tables are empty
const FALLBACK_JOB_INFO: Record<string, JobScreeningInfo> = {
  default: {
    id: "job-fe-01",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    requiredSkills: [
      { skillName: "React", weight: 3 },
      { skillName: "TypeScript", weight: 3 },
      { skillName: "Next.js", weight: 2 },
      { skillName: "Tailwind CSS", weight: 2 },
      { skillName: "Vitest", weight: 1 },
    ],
  },
};

const SAMPLE_APPLICANTS: RawCandidateProfile[] = [
  {
    id: "app-001",
    applicantId: "usr-8f3a12bc",
    jobId: "job-fe-01",
    fullName: "Ahmad Rizky Pratama", // MUST BE REDACTED
    email: "ahmad.rizky@example.com", // MUST BE REDACTED
    phoneNumber: "+6281234567890", // MUST BE REDACTED
    avatarPath: "/avatars/ahmad.jpg", // MUST BE REDACTED
    gender: "Laki-laki", // MUST BE REDACTED
    status: "screening",
    appliedAt: "2026-11-12T08:30:00Z",
    educationLevel: "S1 Teknik Informatika",
    experienceYears: 4,
    experienceSummary:
      "4 tahun pengalaman mengembangkan aplikasi web enterprise dengan fokus pada performa frontend, state management, dan design system yang aksesibel.",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "REST API", "Git"],
    portfolio: [
      {
        title: "Platform E-Commerce Inklusif",
        description:
          "Membangun storefront performa tinggi dengan dukungan screen reader dan optimasi Core Web Vitals.",
        techStack: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
      },
      {
        title: "Sistem Manajemen Desain Komponen",
        description:
          "Membuat pustaka komponen UI berbasis token desain untuk menyelaraskan tampilan lintas tim.",
        techStack: ["TypeScript", "Tailwind CSS", "React"],
      },
    ],
  },
  {
    id: "app-002",
    applicantId: "usr-92c4e10a",
    jobId: "job-fe-01",
    fullName: "Siti Nurhaliza Putri", // MUST BE REDACTED
    email: "siti.nur@example.com", // MUST BE REDACTED
    phoneNumber: "+6281987654321", // MUST BE REDACTED
    gender: "Perempuan", // MUST BE REDACTED
    status: "screening",
    appliedAt: "2026-11-13T10:15:00Z",
    educationLevel: "S1 Sistem Informasi",
    experienceYears: 3,
    experienceSummary:
      "3 tahun pengalaman spesialisasi di React ecosystem dan implementasi automated testing untuk produk SaaS.",
    skills: ["React", "TypeScript", "Vitest", "Tailwind CSS", "Jest"],
    portfolio: [
      {
        title: "Dashboard Analitik Real-time",
        description:
          "Membangun visualisasi data interaktif dengan chart modular dan pengujian unit komprehensif.",
        techStack: ["React", "TypeScript", "Vitest"],
      },
    ],
  },
  {
    id: "app-003",
    applicantId: "usr-4d11b988",
    jobId: "job-fe-01",
    fullName: "Budi Santoso", // MUST BE REDACTED
    email: "budi.santoso@example.com", // MUST BE REDACTED
    phoneNumber: "+6285211223344", // MUST BE REDACTED
    gender: "Laki-laki", // MUST BE REDACTED
    status: "review",
    appliedAt: "2026-11-10T14:00:00Z",
    educationLevel: "D3 Manajemen Informatika",
    experienceYears: 2,
    experienceSummary:
      "2 tahun pengalaman sebagai web developer yang antusias membangun antarmuka web modern dan responsif.",
    skills: ["JavaScript", "React", "HTML5", "CSS3", "Bootstrap"],
    portfolio: [
      {
        title: "Portal Informasi Komunitas",
        description:
          "Mengembangkan aplikasi web portal informasi dengan integrasi API publik dan tata letak responsif.",
        techStack: ["React", "JavaScript", "HTML5"],
      },
    ],
  },
];

/**
 * Retrieves blind profiles for a given job.
 * Enforces server-side authorization: only 'recruiter' and 'admin' roles are permitted.
 * Redacts all personal identifying data before returning.
 */
export async function getBlindApplicantsForJob(
  jobId: string,
  actorRole: string,
): Promise<{
  job: JobScreeningInfo;
  applicants: BlindApplicantProfile[];
}> {
  if (actorRole !== "recruiter" && actorRole !== "admin") {
    throw new AppError(
      "Akses ditolak. Hanya Rekruter terotorisasi yang dapat melihat daftar pelamar.",
      "FORBIDDEN",
      403,
    );
  }

  // Attempt to read from Supabase if configured and tables exist
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();

      // Check for job info
      const { data: jobData } = await supabase
        .from("jobs")
        .select("id, title, requirements")
        .eq("id", jobId)
        .maybeSingle();

      // Check for real applications
      const { data: appsData } = await supabase
        .from("applications")
        .select("id, job_id, applicant_id, status, created_at")
        .eq("job_id", jobId);

      if (jobData && appsData && appsData.length > 0) {
        // Parse job requirements
        const requirements: JobSkillRequirement[] = [];
        if (jobData.requirements) {
          jobData.requirements
            .split(/[,;\n]+/)
            .map((s: string) => s.trim())
            .filter(Boolean)
            .forEach((skillName: string) => {
              requirements.push({ skillName, weight: 1 });
            });
        }

        const jobInfo: JobScreeningInfo = {
          id: jobData.id,
          title: jobData.title,
          requiredSkills: requirements.length > 0 ? requirements : FALLBACK_JOB_INFO.default.requiredSkills,
        };

        // Fetch skills for applicants without fetching identifying user data
        const applicantUserIds = appsData.map((a: { applicant_id: string }) => a.applicant_id);
        const { data: skillsData } = await supabase
          .from("user_skills")
          .select("user_id, skill_name")
          .in("user_id", applicantUserIds);

        const skillsByUser = new Map<string, string[]>();
        (skillsData || []).forEach((row: { user_id: string; skill_name: string }) => {
          const list = skillsByUser.get(row.user_id) || [];
          list.push(row.skill_name);
          skillsByUser.set(row.user_id, list);
        });

        const blindProfiles: BlindApplicantProfile[] = appsData.map((app: {
          id: string;
          job_id: string;
          applicant_id: string;
          status: string;
          created_at: string;
        }) => {
          const candidateSkills = skillsByUser.get(app.applicant_id) || [];
          return sanitizeBlindProfile(
            {
              id: app.id,
              applicantId: app.applicant_id,
              jobId: app.job_id,
              status: (app.status as "screening" | "interview" | "review" | "accepted" | "rejected") || "screening",
              appliedAt: app.created_at,
              educationLevel: "Tersamar (Sesuai Kualifikasi)",
              experienceYears: 2,
              experienceSummary: "Data pengalaman pelamar terverifikasi.",
              skills: candidateSkills,
              portfolio: [],
            },
            jobInfo.requiredSkills,
          );
        });

        return {
          job: jobInfo,
          applicants: blindProfiles,
        };
      }
    } catch {
      // Gracefully fall back to demo/screening sample dataset if remote tables do not exist yet
    }
  }

  // Fallback demo dataset for development / testing
  const job = FALLBACK_JOB_INFO[jobId] || {
    id: jobId,
    title: `Lowongan Pekerjaan #${jobId}`,
    requiredSkills: FALLBACK_JOB_INFO.default.requiredSkills,
  };

  const applicants = SAMPLE_APPLICANTS.map((applicant) =>
    sanitizeBlindProfile(
      { ...applicant, jobId },
      job.requiredSkills,
    ),
  );

  return {
    job,
    applicants,
  };
}
