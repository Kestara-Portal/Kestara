import type { AppRole, PublicRole } from "@/lib/auth/roles";

export interface UserRow {
  id: string;
  full_name: string;
  role: AppRole;
  account_status: "active" | "suspended" | "deactivated";
  avatar_path: string | null;
  phone_number: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSkillRow {
  id: string;
  user_id: string;
  skill_name: string;
  category: string | null;
  proficiency_level: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItemRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  project_url: string | null;
  media_path: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRow {
  id: string;
  job_id: string;
  applicant_id: string;
  status: "screening" | "interview" | "review" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

export type { AppRole, PublicRole };
export type {
  BlindApplicantProfile,
  BlindPortfolioItem,
  BlindSkill,
  JobScreeningInfo,
} from "@/lib/services/blind-profile";
