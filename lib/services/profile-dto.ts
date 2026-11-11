import type { PortfolioItemRow, UserRow, UserSkillRow } from "@/types/database";

// Bentuk data profil yang boleh dikirim ke browser (KP-15 / E01-R).
// Sengaja TIDAK memuat: account_status, avatar_path, media_path, password.

export type ProfileSkill = {
  id: string;
  name: string;
  category: string | null;
  level: string | null;
  description: string | null;
};

export type ProfilePortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  startDate: string | null;
  endDate: string | null;
};

export type OwnProfile = {
  id: string;
  email: string | null;
  fullName: string;
  role: UserRow["role"];
  phoneNumber: string | null;
  bio: string | null;
  createdAt: string;
  skills: ProfileSkill[];
  portfolio: ProfilePortfolioItem[];
};

export type ProfileUserRow = Pick<
  UserRow,
  "id" | "full_name" | "role" | "phone_number" | "bio" | "created_at"
>;
export type ProfileSkillRow = Pick<
  UserSkillRow,
  "id" | "skill_name" | "category" | "proficiency_level" | "description"
>;
export type ProfilePortfolioRow = Pick<
  PortfolioItemRow,
  "id" | "title" | "description" | "project_url" | "start_date" | "end_date"
>;

export function toOwnProfile(
  email: string | null,
  user: ProfileUserRow,
  skills: ProfileSkillRow[],
  portfolio: ProfilePortfolioRow[],
): OwnProfile {
  return {
    id: user.id,
    email,
    fullName: user.full_name,
    role: user.role,
    phoneNumber: user.phone_number,
    bio: user.bio,
    createdAt: user.created_at,
    skills: skills.map((s) => ({
      id: s.id,
      name: s.skill_name,
      category: s.category,
      level: s.proficiency_level,
      description: s.description,
    })),
    portfolio: portfolio.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      url: p.project_url,
      startDate: p.start_date,
      endDate: p.end_date,
    })),
  };
}
