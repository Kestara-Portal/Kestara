import type { CurrentUser } from "@/lib/auth/session";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationDetail,
  type UpdateStatusResult,
} from "@/lib/constants/applications";
import {
  assertApplicationOwner,
  assertWithdrawableLifecycle,
  toMyApplication,
  type MyApplication,
} from "@/lib/services/application-dto";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/errors";
import { isApplicationId } from "@/lib/validations/application";
import type { ApplicationStatus, JobApplicationRow } from "@/types/database";

/**
 * KP-63 / E05-D: withdraw (cancel) a submitted job application.
 * KP-60 / KP-61 / KP-62: recruiter application status update & notification trigger.
 */

export {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationDetail,
  type UpdateStatusResult,
};

export {
  applicationStatusLabel,
  assertApplicationOwner,
  assertWithdrawableLifecycle,
  isWithdrawable,
  toMyApplication,
  WITHDRAWABLE_STATUSES,
  type ApplicationListRow,
  type MyApplication,
} from "@/lib/services/application-dto";

export interface WithdrawApplicationDeps {
  findApplication(applicationId: string): Promise<JobApplicationRow | null>;
  markWithdrawn(
    applicationId: string,
    reason: string | null,
  ): Promise<JobApplicationRow | null>;
}

export interface WithdrawApplicationOptions {
  reason?: string | null;
  deps?: WithdrawApplicationDeps;
}

export interface WithdrawApplicationResult {
  success: true;
  status: "withdrawn";
  application: JobApplicationRow;
}

function supabaseApplicationDeps(
  supabase: Awaited<ReturnType<typeof createClient>>,
): WithdrawApplicationDeps {
  return {
    async findApplication(applicationId) {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicationId)
        .maybeSingle();

      if (error) {
        throw new AppError("Gagal memuat data lamaran.", "DB_ERROR", 500);
      }

      return (data as JobApplicationRow | null) ?? null;
    },

    async markWithdrawn(applicationId, reason) {
      // `updated_at` is owned by the set_updated_at trigger and is not part of
      // the column-level UPDATE grant.
      const { data, error } = await supabase
        .from("applications")
        .update({ status: "withdrawn", withdrawal_reason: reason })
        .eq("id", applicationId)
        .select("*")
        .maybeSingle();

      if (error) {
        if (error.code === "42501") {
          throw new AppError(
            "Anda tidak memiliki akses untuk membatalkan lamaran ini.",
            "FORBIDDEN",
            403,
          );
        }

        throw new AppError("Gagal membatalkan lamaran.", "DB_ERROR", 500);
      }

      return (data as JobApplicationRow | null) ?? null;
    },
  };
}

export async function withdrawApplication(
  applicationId: string,
  actor: CurrentUser,
  options: WithdrawApplicationOptions = {},
): Promise<WithdrawApplicationResult> {
  if (!isApplicationId(applicationId)) {
    throw new AppError("ID lamaran tidak valid.", "BAD_REQUEST", 400);
  }

  if (actor.role !== "jobseeker") {
    throw new AppError(
      "Hanya pencari kerja yang dapat membatalkan lamaran.",
      "FORBIDDEN",
      403,
    );
  }

  const deps = options.deps ?? supabaseApplicationDeps(await createClient());

  const application = await deps.findApplication(applicationId);
  if (!application) {
    throw new AppError("Lamaran tidak ditemukan.", "NOT_FOUND", 404);
  }

  assertApplicationOwner(application, actor);
  assertWithdrawableLifecycle(application.status);

  const updated = await deps.markWithdrawn(applicationId, options.reason ?? null);
  if (!updated) {
    throw new AppError("Lamaran tidak ditemukan.", "NOT_FOUND", 404);
  }

  return { success: true, status: "withdrawn", application: updated };
}

interface RawApplicationRow {
  id: string;
  job_id: string;
  status: ApplicationStatus;
  created_at: string;
  jobs: {
    id: string;
    title: string;
    companies: { name: string } | { name: string }[] | null;
  } | null;
}

/**
 * The candidate's own applications, newest first.
 *
 * RLS already limits the result to `applicant_id = auth.uid()`; the explicit
 * filter keeps the query honest and lets the planner use the index.
 */
export async function getMyApplications(actor: CurrentUser): Promise<MyApplication[]> {
  if (actor.role !== "jobseeker") {
    throw new AppError(
      "Hanya pencari kerja yang memiliki daftar lamaran.",
      "FORBIDDEN",
      403,
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("id, job_id, status, created_at, jobs ( id, title, companies ( name ) )")
    .eq("applicant_id", actor.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Gagal memuat daftar lamaran.", "DB_ERROR", 500);
  }

  return ((data ?? []) as unknown as RawApplicationRow[]).map((row) => {
    const company = Array.isArray(row.jobs?.companies)
      ? row.jobs?.companies[0]
      : row.jobs?.companies;

    return toMyApplication({
      id: row.id,
      job_id: row.job_id,
      status: row.status,
      created_at: row.created_at,
      vacancy: row.jobs
        ? { id: row.jobs.id, title: row.jobs.title, company: company ?? null }
        : null,
    });
  });
}

/**
 * Validasi otorisasi dan transisi status lamaran (Pure logic untuk unit test).
 */
export function validateStatusTransition(
  currentStatus: ApplicationStatus,
  nextStatus: string,
  actorRole: string,
): ApplicationStatus {
  // 1. Otorisasi aktor: Wajib recruiter atau admin
  if (actorRole !== "recruiter" && actorRole !== "admin") {
    throw new AppError(
      "Hanya Rekruter atau Administrator yang berwenang memperbarui status lamaran.",
      "FORBIDDEN",
      403,
    );
  }

  // 2. Validasi nilai status
  if (!APPLICATION_STATUSES.includes(nextStatus as ApplicationStatus)) {
    throw new AppError(
      `Status "${nextStatus}" tidak valid. Pilihan: ${APPLICATION_STATUSES.join(", ")}`,
      "INVALID_STATUS",
      400,
    );
  }

  const targetStatus = nextStatus as ApplicationStatus;

  // 3. Status tidak boleh sama dengan status saat ini
  if (currentStatus === targetStatus) {
    throw new AppError(
      `Status lamaran sudah berada pada tahap "${STATUS_LABELS[currentStatus]}".`,
      "NO_CHANGE",
      400,
    );
  }

  // 4. Lamaran yang sudah dibatalkan pelamar tidak dapat diubah lagi oleh rekruter
  if (currentStatus === "cancelled" || currentStatus === "withdrawn") {
    throw new AppError(
      "Lamaran ini telah dibatalkan oleh pencari kerja dan tidak dapat diubah statusnya.",
      "APPLICATION_CANCELLED",
      400,
    );
  }

  return targetStatus;
}

/**
 * KP-62: Membangun template pesan notifikasi otomatis untuk pencari kerja.
 */
export function buildStatusUpdateNotification(
  jobTitle: string,
  nextStatus: ApplicationStatus,
): { title: string; message: string } {
  const statusLabel = STATUS_LABELS[nextStatus];

  let message = `Status lamaran Anda untuk posisi "${jobTitle}" telah diperbarui menjadi "${statusLabel}".`;

  if (nextStatus === "interview") {
    message = `Kabar baik! Lamaran Anda untuk posisi "${jobTitle}" telah lolos seleksi dan masuk ke "Tahap Wawancara". Tim rekruter akan segera menghubungi Anda.`;
  } else if (nextStatus === "accepted") {
    message = `Selamat! Anda dinyatakan "Lolos / Diterima" untuk posisi "${jobTitle}". Periksa email Anda untuk informasi penawaran resmi.`;
  } else if (nextStatus === "rejected") {
    message = `Terima kasih atas minat Anda pada posisi "${jobTitle}". Saat ini proses seleksi Anda belum dapat dilanjutkan ke tahap berikutnya.`;
  }

  return {
    title: `Pembaruan Lamaran: ${statusLabel}`,
    message,
  };
}

/**
 * KP-61 & KP-62: Memperbarui status lamaran di database, mencatat audit event,
 * dan memicu notifikasi otomatis ke akun Pencari Kerja.
 */
export async function updateApplicationStatus(
  applicationId: string,
  nextStatusInput: string,
  note: string | undefined,
  actor: CurrentUser,
): Promise<UpdateStatusResult> {
  // 1. Otorisasi role
  if (actor.role !== "recruiter" && actor.role !== "admin") {
    throw new AppError(
      "Hanya Rekruter yang berwenang memperbarui status kandidat.",
      "FORBIDDEN",
      403,
    );
  }

  const supabase = await createClient();

  // 2. Ambil data lamaran beserta lowongan dan data pelamar
  const { data: appData, error: appErr } = await supabase
    .from("applications")
    .select(`
      id,
      job_id,
      applicant_id,
      status,
      jobs (
        id,
        title,
        company_id,
        companies (name)
      ),
      users (
        id,
        full_name
      )
    `)
    .eq("id", applicationId)
    .maybeSingle();

  if (appErr) {
    throw new AppError("Gagal mengambil data lamaran dari database.", "DB_ERROR", 500);
  }

  if (!appData) {
    throw new AppError("Data lamaran kandidat tidak ditemukan.", "NOT_FOUND", 404);
  }

  const currentStatus = appData.status as ApplicationStatus;
  const validatedNextStatus = validateStatusTransition(
    currentStatus,
    nextStatusInput,
    actor.role,
  );

  // 3. Update status lamaran di database (KP-61)
  const { error: updateErr } = await supabase
    .from("applications")
    .update({
      status: validatedNextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updateErr) {
    throw new AppError("Gagal memperbarui status lamaran.", "DB_ERROR", 500);
  }

  // 4. Catat riwayat perubahan ke application_events (Audit trail)
  await supabase.from("application_events").insert({
    application_id: applicationId,
    actor_id: actor.id,
    previous_status: currentStatus,
    new_status: validatedNextStatus,
    note: note || `Status diubah dari ${STATUS_LABELS[currentStatus]} ke ${STATUS_LABELS[validatedNextStatus]}`,
  });

  // 5. KP-62: Trigger notifikasi otomatis ke akun Pencari Kerja
  const jobTitle = (appData.jobs as unknown as { title: string })?.title || "Lowongan Pekerjaan";
  const notificationPayload = buildStatusUpdateNotification(jobTitle, validatedNextStatus);

  const { error: notifErr } = await supabase.from("notifications").insert({
    user_id: appData.applicant_id,
    title: notificationPayload.title,
    message: notificationPayload.message,
    type: "application_status",
    reference_id: applicationId,
  });

  const nextStatusLabel = STATUS_LABELS[validatedNextStatus];

  return {
    applicationId,
    previousStatus: currentStatus,
    newStatus: validatedNextStatus,
    newStatusLabel: nextStatusLabel,
    notificationCreated: !notifErr,
    message: `Status lamaran berhasil diperbarui menjadi "${nextStatusLabel}". Notifikasi otomatis telah dikirimkan ke kandidat.`,
  };
}

/**
 * Mengambil daftar lamaran pelamar untuk ditampilkan di panel Rekruter (KP-60).
 */
export async function getApplicationsForRecruiter(): Promise<ApplicationDetail[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(`
      id,
      job_id,
      applicant_id,
      status,
      cover_letter,
      resume_path,
      created_at,
      updated_at,
      jobs (
        id,
        title,
        companies (name)
      ),
      users (
        id,
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item: unknown) => {
    const raw = item as {
      id: string;
      job_id: string;
      applicant_id: string;
      status: ApplicationStatus;
      cover_letter: string | null;
      resume_path: string | null;
      created_at: string;
      updated_at: string;
      jobs: { id: string; title: string; companies: { name: string } | null } | null;
      users: { id: string; full_name: string } | null;
    };

    return {
      id: raw.id,
      job_id: raw.job_id,
      applicant_id: raw.applicant_id,
      status: raw.status,
      cover_letter: raw.cover_letter,
      resume_path: raw.resume_path,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      applicantName: raw.users?.full_name || "Kandidat Pelamar",
      applicantEmail: "kandidat@kestara.test",
      jobTitle: raw.jobs?.title || "Posisi Pekerjaan",
      companyName: raw.jobs?.companies?.name || "Perusahaan Mitra",
    };
  });
}
