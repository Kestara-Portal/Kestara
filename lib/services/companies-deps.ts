import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/errors";
import type { CompanyRow } from "@/types/database";

import type { CompanyDeps, CompanyInsert } from "./companies";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface PostgrestLikeError {
  code?: string;
  message: string;
}

function isUniqueViolation(error: PostgrestLikeError): boolean {
  return error.code === "23505" || error.message.toLowerCase().includes("duplicate key value");
}

function isAccessDenied(error: PostgrestLikeError): boolean {
  return (
    error.code === "42501" ||
    error.message.toLowerCase().includes("row-level security") ||
    error.message.toLowerCase().includes("permission denied")
  );
}

export function createCompanyDeps(client: SupabaseServerClient): CompanyDeps {
  return {
    async duplicateExists({ name, domain }) {
      const { data, error } = await client.rpc("company_duplicate_exists", {
        candidate_name: name,
        candidate_domain: domain,
      });

      if (error) {
        if (isAccessDenied(error)) {
          throw new AppError(
            "Anda tidak memiliki akses untuk mendaftarkan perusahaan.",
            "FORBIDDEN",
            403,
          );
        }
        throw new AppError(
          "Pemeriksaan duplikasi perusahaan gagal. Silakan coba lagi.",
          "COMPANY_CHECK_FAILED",
          500,
        );
      }

      return data === true;
    },

    async insertCompany(values: CompanyInsert) {
      const { data, error } = await client
        .from("companies")
        .insert(values)
        .select("*")
        .single();

      if (error) {
        if (isUniqueViolation(error)) {
          throw new AppError(
            "Perusahaan dengan nama atau situs web yang sama sudah terdaftar.",
            "DUPLICATE_COMPANY",
            409,
          );
        }
        if (isAccessDenied(error)) {
          throw new AppError(
            "Anda tidak memiliki akses untuk mendaftarkan perusahaan.",
            "FORBIDDEN",
            403,
          );
        }
        throw new AppError(
          "Perusahaan gagal disimpan. Silakan coba lagi.",
          "COMPANY_INSERT_FAILED",
          500,
        );
      }

      return data as CompanyRow;
    },
  };
}

export async function supabaseCompanyDeps(): Promise<CompanyDeps> {
  return createCompanyDeps(await createClient());
}
