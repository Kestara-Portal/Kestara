import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/errors";
import type { JobVacancyRow } from "@/types/database";

import type { VacancyDeps, VacancyUpdatePatch } from "./vacancies";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface PostgrestLikeError {
  code?: string;
  message: string;
}

function isAccessDenied(error: PostgrestLikeError): boolean {
  return (
    error.code === "42501" ||
    error.message.toLowerCase().includes("row-level security") ||
    error.message.toLowerCase().includes("permission denied")
  );
}

function isMissingRow(error: PostgrestLikeError): boolean {
  return error.code === "PGRST116";
}

export function createVacancyDeps(client: SupabaseServerClient): VacancyDeps {
  return {
    async findVacancy(id: string) {
      const { data, error } = await client
        .from("job_vacancies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        if (isAccessDenied(error)) {
          throw new AppError("Lowongan tidak ditemukan.", "VACANCY_NOT_FOUND", 404);
        }
        throw new AppError(
          "Lowongan gagal dimuat. Silakan coba lagi.",
          "VACANCY_LOAD_FAILED",
          500,
        );
      }

      return (data as JobVacancyRow | null) ?? null;
    },

    async isCompanyMember(companyId: string, userId: string) {
      const { data, error } = await client
        .from("company_memberships")
        .select("id")
        .eq("company_id", companyId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw new AppError(
          "Keanggotaan perusahaan gagal diverifikasi.",
          "MEMBERSHIP_CHECK_FAILED",
          500,
        );
      }

      return Boolean(data);
    },

    async applyUpdate(id: string, patch: VacancyUpdatePatch) {
      const { data, error } = await client
        .from("job_vacancies")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        if (isAccessDenied(error)) {
          throw new AppError(
            "Anda tidak memiliki akses untuk mengubah lowongan ini.",
            "VACANCY_FORBIDDEN",
            403,
          );
        }
        if (isMissingRow(error)) {
          throw new AppError("Lowongan tidak ditemukan.", "VACANCY_NOT_FOUND", 404);
        }
        throw new AppError(
          "Perubahan lowongan gagal disimpan. Silakan coba lagi.",
          "VACANCY_UPDATE_FAILED",
          500,
        );
      }

      return data as JobVacancyRow;
    },
  };
}

export async function supabaseVacancyDeps(): Promise<VacancyDeps> {
  return createVacancyDeps(await createClient());
}
