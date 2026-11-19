import type { CurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/errors";
import type { CompanyRow, JobRow } from "@/types/database";

export interface DeleteCompanyResult {
  companyId: string;
  name: string;
  closedJobsCount: number;
  status: "deleted";
  message: string;
}

export interface CompanyWithJobCount extends CompanyRow {
  activeJobsCount: number;
  totalJobsCount: number;
}

/**
 * Validasi otorisasi dan status entitas perusahaan sebelum penghapusan.
 * (Pure business logic helper untuk mempermudah pengujian unit).
 */
export function validateCompanyDeletion(
  company: Pick<CompanyRow, "id" | "name" | "status"> | null,
  actorRole: string,
): void {
  if (actorRole !== "admin") {
    throw new AppError(
      "Hanya Administrator yang memiliki hak akses untuk menghapus entitas perusahaan.",
      "FORBIDDEN",
      403,
    );
  }

  if (!company) {
    throw new AppError("Perusahaan tidak ditemukan.", "NOT_FOUND", 404);
  }

  if (company.status === "deleted") {
    throw new AppError(
      `Perusahaan "${company.name}" sudah dihapus sebelumnya.`,
      "ALREADY_DELETED",
      400,
    );
  }
}

/**
 * KP-34: Menentukan aturan lowongan terhubung saat perusahaan dinonaktifkan.
 * Lowongan yang berstatus 'published' atau 'draft' wajib ditutup ('closed').
 */
export function determineJobCascadingAction(
  jobs: Array<Pick<JobRow, "id" | "status">>,
): {
  jobIdsToClose: string[];
  activeCount: number;
} {
  const jobIdsToClose = jobs
    .filter((j) => j.status === "published" || j.status === "draft")
    .map((j) => j.id);

  return {
    jobIdsToClose,
    activeCount: jobIdsToClose.length,
  };
}

/**
 * KP-31 / KP-33 / KP-34: Soft delete entitas perusahaan dan otomatis menutup
 * semua lowongan kerja terkait agar basis data tetap konsisten dan relevan.
 */
export async function softDeleteCompany(
  companyId: string,
  actor: CurrentUser,
): Promise<DeleteCompanyResult> {
  // 1. Otorisasi aktor
  if (actor.role !== "admin") {
    throw new AppError(
      "Hanya Administrator yang berwenang menghapus entitas perusahaan.",
      "FORBIDDEN",
      403,
    );
  }

  const supabase = await createClient();

  // 2. Ambil entitas perusahaan
  const { data: companyData, error: companyErr } = await supabase
    .from("companies")
    .select("id, name, status")
    .eq("id", companyId)
    .maybeSingle();

  if (companyErr) {
    throw new AppError("Gagal memeriksa data perusahaan dari basis data.", "DB_ERROR", 500);
  }

  const company = companyData as Pick<CompanyRow, "id" | "name" | "status"> | null;
  validateCompanyDeletion(company, actor.role);

  // 3. Ambil data lowongan kerja terkait (KP-34)
  const { data: relatedJobsData, error: jobsErr } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("company_id", companyId);

  if (jobsErr) {
    throw new AppError("Gagal memeriksa data lowongan terkait.", "DB_ERROR", 500);
  }

  const relatedJobs = (relatedJobsData ?? []) as Array<Pick<JobRow, "id" | "status">>;
  const { jobIdsToClose, activeCount } = determineJobCascadingAction(relatedJobs);

  // 4. Tutup semua lowongan aktif terkait jika ada (KP-34)
  if (jobIdsToClose.length > 0) {
    const { error: updateJobsErr } = await supabase
      .from("jobs")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .in("id", jobIdsToClose);

    if (updateJobsErr) {
      throw new AppError("Gagal memperbarui status lowongan terhubung.", "DB_ERROR", 500);
    }
  }

  // 5. Eksekusi soft delete pada perusahaan (KP-33)
  const { error: updateCompanyErr } = await supabase
    .from("companies")
    .update({
      status: "deleted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);

  if (updateCompanyErr) {
    throw new AppError("Gagal menghapus entitas perusahaan.", "DB_ERROR", 500);
  }

  return {
    companyId: company!.id,
    name: company!.name,
    closedJobsCount: activeCount,
    status: "deleted",
    message: `Entitas perusahaan "${company!.name}" berhasil dihapus (soft delete). Sebanyak ${activeCount} lowongan kerja terkait telah dinonaktifkan/ditutup.`,
  };
}

/**
 * Mengambil daftar perusahaan untuk tampilan dashboard Administrator.
 */
export async function getCompaniesForAdmin(): Promise<CompanyWithJobCount[]> {
  const supabase = await createClient();

  const { data: companiesData, error: compErr } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (compErr) {
    throw new AppError("Gagal mengambil daftar perusahaan.", "DB_ERROR", 500);
  }

  const companies = (companiesData ?? []) as CompanyRow[];

  // Ambil jobs untuk agregasi jumlah lowongan
  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, company_id, status");

  const jobs = (jobsData ?? []) as Array<Pick<JobRow, "id" | "company_id" | "status">>;

  return companies.map((c) => {
    const companyJobs = jobs.filter((j) => j.company_id === c.id);
    const activeJobs = companyJobs.filter((j) => j.status === "published");

    return {
      ...c,
      totalJobsCount: companyJobs.length,
      activeJobsCount: activeJobs.length,
    };
  });
}

