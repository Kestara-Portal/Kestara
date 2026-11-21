import type { CurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/errors";
import type { JobRow } from "@/types/database";

export interface CloseJobResult {
  jobId: string;
  title: string;
  status: "closed";
  message: string;
}

export interface DeleteJobResult {
  jobId: string;
  title: string;
  status: "archived" | "deleted";
  message: string;
}

/**
 * Validasi otorisasi dan kepemilikan lowongan sebelum penutupan atau penghapusan.
 * Memastikan hanya Administrator atau Rekruter pemilik lowongan yang diizinkan.
 */
export function validateJobManagement(
  job: Pick<JobRow, "id" | "title" | "status" | "created_by"> | null,
  actor: CurrentUser,
): void {
  if (actor.role !== "admin" && actor.role !== "recruiter") {
    throw new AppError(
      "Hanya Administrator atau Rekruter yang berhak mengelola lowongan pekerjaan.",
      "FORBIDDEN",
      403,
    );
  }

  if (!job) {
    throw new AppError("Lowongan pekerjaan tidak ditemukan.", "NOT_FOUND", 404);
  }

  // Rekruter hanya boleh mengelola lowongannya sendiri jika created_by terisi
  if (actor.role === "recruiter" && job.created_by && job.created_by !== actor.id) {
    throw new AppError(
      "Rekruter hanya memiliki izin untuk mengelola lowongan yang dibuatnya sendiri.",
      "FORBIDDEN",
      403,
    );
  }
}

/**
 * KP-47: Menutup lowongan pekerjaan agar pelamar tidak lagi dapat melamar.
 */
export async function closeJobVacancy(
  jobId: string,
  actor: CurrentUser,
): Promise<CloseJobResult> {
  const supabase = await createClient();

  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("id, title, status, created_by")
    .eq("id", jobId)
    .maybeSingle();

  if (fetchErr) {
    throw new AppError("Gagal mengambil data lowongan pekerjaan.", "DATABASE_ERROR", 500);
  }

  validateJobManagement(job as Pick<JobRow, "id" | "title" | "status" | "created_by"> | null, actor);

  const existingJob = job as Pick<JobRow, "id" | "title" | "status" | "created_by">;

  if (existingJob.status === "closed") {
    throw new AppError("Lowongan pekerjaan ini sudah dalam kondisi ditutup.", "ALREADY_CLOSED", 400);
  }

  const { error: updateErr } = await supabase
    .from("jobs")
    .update({
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (updateErr) {
    throw new AppError("Gagal memperbarui status penutupan lowongan.", "DATABASE_ERROR", 500);
  }

  return {
    jobId,
    title: existingJob.title,
    status: "closed",
    message: `Lowongan "${existingJob.title}" berhasil ditutup dan tidak lagi menerima lamaran.`,
  };
}

/**
 * KP-47: Menghapus lowongan pekerjaan (Soft delete ke status 'archived' atau permanent delete).
 */
export async function deleteJobVacancy(
  jobId: string,
  actor: CurrentUser,
  permanent = false,
): Promise<DeleteJobResult> {
  const supabase = await createClient();

  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("id, title, status, created_by")
    .eq("id", jobId)
    .maybeSingle();

  if (fetchErr) {
    throw new AppError("Gagal mengambil data lowongan pekerjaan.", "DATABASE_ERROR", 500);
  }

  validateJobManagement(job as Pick<JobRow, "id" | "title" | "status" | "created_by"> | null, actor);

  const existingJob = job as Pick<JobRow, "id" | "title" | "status" | "created_by">;

  if (permanent) {
    const { error: deleteErr } = await supabase.from("jobs").delete().eq("id", jobId);
    if (deleteErr) {
      throw new AppError("Gagal menghapus lowongan secara permanen.", "DATABASE_ERROR", 500);
    }
    return {
      jobId,
      title: existingJob.title,
      status: "deleted",
      message: `Lowongan "${existingJob.title}" berhasil dihapus secara permanen.`,
    };
  }

  const { error: updateErr } = await supabase
    .from("jobs")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (updateErr) {
    throw new AppError("Gagal mengarsipkan/menghapus lowongan pekerjaan.", "DATABASE_ERROR", 500);
  }

  return {
    jobId,
    title: existingJob.title,
    status: "archived",
    message: `Lowongan "${existingJob.title}" berhasil dihapus dari daftar aktif.`,
  };
}
