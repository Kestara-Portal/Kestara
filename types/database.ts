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

export type CompanyStatus = "active" | "suspended" | "deleted";

export interface CompanyRow {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  location: string | null;
  website: string | null;
  size: string | null;
  logo_path: string | null;
  status: CompanyStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type JobStatus = "draft" | "published" | "closed" | "archived";

export interface JobRow {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  type: string;
  location: string | null;
  salary: string | null;
  status: JobStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type { AppRole, PublicRole };
