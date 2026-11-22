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
  logo?: string | null;
  status: CompanyStatus;
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

export type JobStatus = "draft" | "published" | "closed" | "archived";

export interface JobRow {
  id: string;
  company_id: string;
  companyId?: string;
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

<<<<<<< HEAD
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

export const APPLICATION_STATUSES = [
  "submitted",
  "under_review",
  "shortlisted",
  "screening",
  "interview",
  "assessment",
  "accepted",
  "rejected",
  "withdrawn",
  "cancelled",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ApplicationEventRow {
  id: string;
  application_id: string;
  actor_id: string | null;
  previous_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  note: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
}

export interface JobApplicationRow {
  id: string;
  applicant_id: string;
  job_id: string;
  status: ApplicationStatus;
  cover_letter?: string | null;
  resume_path?: string | null;
  withdrawal_reason: string | null;
  created_at: string;
  updated_at: string;
  jobseeker_id?: string;
  vacancy_id?: string;
}

export type ApplicationRow = JobApplicationRow;

export type {
  BlindApplicantProfile,
  BlindPortfolioItem,
  BlindSkill,
  JobScreeningInfo,
} from "@/lib/services/blind-profile";
