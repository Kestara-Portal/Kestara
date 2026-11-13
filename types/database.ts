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

export interface CompanyRow {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  location: string | null;
  logo_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CompanyMembershipRole = "owner" | "member";

export interface CompanyMembershipRow {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyMembershipRole;
  created_at: string;
}

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export interface JobVacancyRow {
  id: string;
  company_id: string;
  recruiter_id: string;
  title: string;
  description: string;
  required_skills: string[];
  employment_type: EmploymentType | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type { AppRole, PublicRole };
