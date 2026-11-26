import type { CurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/errors";
import {
  isCompanyId,
  normalizeCompanyWebsite,
  type UpdateCompanyInput,
} from "@/lib/validations/company";
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
  // `updated_at` tidak dikirim: kolom itu tidak termasuk allow-list UPDATE dan
  // sudah diisi oleh trigger companies_set_updated_at.
  const { error: updateCompanyErr } = await supabase
    .from("companies")
    .update({
      status: "deleted",
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

// =============================================================================
// KP-27 / E04-U — Update Company Profile
// =============================================================================

/** Canonical comparison form of a company name; mirrors `lower(btrim(name))`. */
export function normalizeCompanyName(value: string): string {
  return value.trim().toLowerCase();
}

export type CompanyConflict = {
  field: "name" | "website";
  existingName: string;
};

/**
 * Data access required by `updateCompany`. Injected so the use case can be
 * tested without a database, exactly like the deletion rules above.
 */
export interface UpdateCompanyDeps {
  findCompany(companyId: string): Promise<CompanyRow | null>;
  isCompanyMember(companyId: string, userId: string): Promise<boolean>;
  findConflict(params: {
    companyId: string;
    normalizedName: string;
    normalizedWebsite: string | null;
  }): Promise<CompanyConflict | null>;
  saveCompany(companyId: string, patch: UpdateCompanyInput): Promise<CompanyRow>;
}

const COMPANY_EDITOR_ROLES = ["admin", "recruiter"] as const;

/**
 * Pure authorization rule for KP-27.
 *
 * Admin may edit any company. A recruiter may edit only a company where they
 * hold an active membership — the E04 rule that "authorization must not assume
 * every Recruiter can edit every company".
 */
export function authorizeCompanyUpdate(
  actorRole: string,
  isMember: boolean,
): void {
  if (!(COMPANY_EDITOR_ROLES as readonly string[]).includes(actorRole)) {
    throw new AppError(
      "Hanya Rekruter atau Administrator yang dapat memperbarui profil perusahaan.",
      "FORBIDDEN",
      403,
    );
  }

  if (actorRole === "recruiter" && !isMember) {
    throw new AppError(
      "Anda tidak memiliki akses untuk mengubah profil perusahaan ini.",
      "FORBIDDEN",
      403,
    );
  }
}

/** Pure collision rule: a duplicate name/website must surface as 409, not 500. */
export function assertNoCompanyCollision(conflict: CompanyConflict | null): void {
  if (!conflict) return;

  if (conflict.field === "name") {
    throw new AppError(
      `Nama perusahaan "${conflict.existingName}" sudah terdaftar. Gunakan nama resmi yang berbeda.`,
      "COMPANY_NAME_TAKEN",
      409,
    );
  }

  throw new AppError(
    `Alamat website ini sudah dipakai oleh "${conflict.existingName}".`,
    "COMPANY_WEBSITE_TAKEN",
    409,
  );
}

function supabaseCompanyDeps(supabase: Awaited<ReturnType<typeof createClient>>): UpdateCompanyDeps {
  return {
    async findCompany(companyId) {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .maybeSingle();

      if (error) {
        throw new AppError("Gagal memuat data perusahaan.", "DB_ERROR", 500);
      }

      return (data as CompanyRow | null) ?? null;
    },

    async isCompanyMember(companyId, userId) {
      const { data, error } = await supabase
        .from("company_memberships")
        .select("id")
        .eq("company_id", companyId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        throw new AppError("Gagal memeriksa keanggotaan perusahaan.", "DB_ERROR", 500);
      }

      return Boolean(data);
    },

    async findConflict({ companyId, normalizedName, normalizedWebsite }) {
      const { data: nameMatches, error: nameErr } = await supabase
        .from("companies")
        .select("id, name")
        .neq("id", companyId)
        .neq("status", "deleted")
        .ilike("name", normalizedName)
        .limit(1);

      if (nameErr) {
        throw new AppError("Gagal memeriksa nama perusahaan.", "DB_ERROR", 500);
      }

      const nameMatch = (nameMatches ?? [])[0] as Pick<CompanyRow, "id" | "name"> | undefined;
      if (nameMatch && normalizeCompanyName(nameMatch.name) === normalizedName) {
        return { field: "name", existingName: nameMatch.name };
      }

      if (!normalizedWebsite) return null;

      const { data: websiteMatches, error: websiteErr } = await supabase
        .from("companies")
        .select("id, name, website")
        .neq("id", companyId)
        .neq("status", "deleted")
        .ilike("website", normalizedWebsite)
        .limit(1);

      if (websiteErr) {
        throw new AppError("Gagal memeriksa alamat website.", "DB_ERROR", 500);
      }

      const websiteMatch = (websiteMatches ?? [])[0] as
        | Pick<CompanyRow, "id" | "name" | "website">
        | undefined;

      if (websiteMatch && websiteMatch.website) {
        return { field: "website", existingName: websiteMatch.name };
      }

      return null;
    },

    async saveCompany(companyId, patch) {
      // `updated_at` is set by the companies_set_updated_at trigger; it is not in
      // the column allow-list, so sending it would be refused by the database.
      const { data, error } = await supabase
        .from("companies")
        .update({
          name: patch.name,
          description: patch.description,
          website: patch.website,
          location: patch.location,
          logo_path: patch.logo_path,
        })
        .eq("id", companyId)
        .select("*")
        .maybeSingle();

      if (error) {
        // 23505: a normalized unique index caught a duplicate that raced the
        // pre-check above.
        if (error.code === "23505") {
          throw new AppError(
            "Nama atau website perusahaan sudah digunakan oleh perusahaan lain.",
            "COMPANY_NAME_TAKEN",
            409,
          );
        }

        // RLS refuses the write when membership/active-account checks fail.
        if (error.code === "42501") {
          throw new AppError(
            "Anda tidak memiliki akses untuk mengubah profil perusahaan ini.",
            "FORBIDDEN",
            403,
          );
        }

        throw new AppError("Gagal menyimpan perubahan profil perusahaan.", "DB_ERROR", 500);
      }

      if (!data) {
        throw new AppError("Perusahaan tidak ditemukan.", "NOT_FOUND", 404);
      }

      return data as CompanyRow;
    },
  };
}

/**
 * KP-27 / E04-U: read a company for the edit form.
 *
 * Same authorization as the write path so the page cannot pre-fill a company the
 * actor is not allowed to edit. Soft-deleted companies are treated as absent.
 */
export async function getCompanyForEdit(
  companyId: string,
  actor: CurrentUser,
): Promise<CompanyRow> {
  if (!isCompanyId(companyId)) {
    throw new AppError("ID perusahaan tidak valid.", "BAD_REQUEST", 400);
  }

  const supabase = await createClient();
  const deps = supabaseCompanyDeps(supabase);

  const company = await deps.findCompany(companyId);
  if (!company || company.status === "deleted") {
    throw new AppError("Perusahaan tidak ditemukan.", "NOT_FOUND", 404);
  }

  const isMember =
    actor.role === "recruiter" ? await deps.isCompanyMember(companyId, actor.id) : false;

  authorizeCompanyUpdate(actor.role, isMember);

  return company;
}

/**
 * KP-27 / E04-U: update an authorized company profile.
 *
 * Steps: identifier → role → membership → collision → persist. The database
 * repeats every one of these checks (RLS, column grants, unique indexes), so a
 * caller that skips the service still cannot write an unauthorized change.
 */
export async function updateCompany(
  companyId: string,
  data: UpdateCompanyInput,
  actor: CurrentUser,
  deps?: UpdateCompanyDeps,
): Promise<CompanyRow> {
  if (!isCompanyId(companyId)) {
    throw new AppError("ID perusahaan tidak valid.", "BAD_REQUEST", 400);
  }

  if (!(COMPANY_EDITOR_ROLES as readonly string[]).includes(actor.role)) {
    throw new AppError(
      "Hanya Rekruter atau Administrator yang dapat memperbarui profil perusahaan.",
      "FORBIDDEN",
      403,
    );
  }

  const resolved = deps ?? supabaseCompanyDeps(await createClient());

  const company = await resolved.findCompany(companyId);
  if (!company || company.status === "deleted") {
    throw new AppError("Perusahaan tidak ditemukan.", "NOT_FOUND", 404);
  }

  const isMember =
    actor.role === "recruiter"
      ? await resolved.isCompanyMember(companyId, actor.id)
      : false;

  authorizeCompanyUpdate(actor.role, isMember);

  const normalizedName = normalizeCompanyName(data.name);
  const normalizedWebsite = data.website ? normalizeCompanyWebsite(data.website) : null;

  const nameChanged = normalizedName !== normalizeCompanyName(company.name);
  const websiteChanged =
    (company.website ? normalizeCompanyWebsite(company.website) : null) !== normalizedWebsite;

  if (nameChanged || websiteChanged) {
    const conflict = await resolved.findConflict({
      companyId,
      normalizedName,
      normalizedWebsite,
    });
    assertNoCompanyCollision(conflict);
  }

  return resolved.saveCompany(companyId, data);
}


