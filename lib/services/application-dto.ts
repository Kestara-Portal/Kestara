import { AppError } from "@/lib/utils/errors";
import type { ApplicationStatus } from "@/types/database";

/**
 * KP-63 / E05-D: pure application rules and read model.
 *
 * Kept free of any server-only import (`next/headers`, Supabase server client)
 * because both the server page and the client list component use the labels and
 * the `withdrawable` flag. The data access lives in `lib/services/applications.ts`.
 */

/**
 * Statuses a candidate may still withdraw from. `shortlisted` is already a
 * recruiter decision, and `rejected` / `withdrawn` are terminal.
 */
export const WITHDRAWABLE_STATUSES: readonly ApplicationStatus[] = [
  "submitted",
  "under_review",
] as const;

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Terkirim",
  under_review: "Sedang Ditinjau",
  shortlisted: "Masuk Shortlist",
  rejected: "Tidak Lolos",
  withdrawn: "Dibatalkan",
  cancelled: "Dibatalkan",
};

export function applicationStatusLabel(status: ApplicationStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function isWithdrawable(status: ApplicationStatus): boolean {
  return WITHDRAWABLE_STATUSES.includes(status);
}

/** Pure lifecycle guard: a terminal or decision state must not be cancelled. */
export function assertWithdrawableLifecycle(status: ApplicationStatus): void {
  if (isWithdrawable(status)) return;

  const label = applicationStatusLabel(status);

  throw new AppError(
    status === "withdrawn"
      ? "Lamaran ini sudah dibatalkan sebelumnya."
      : `Lamaran dengan status "${label}" tidak dapat dibatalkan lagi.`,
    "INVALID_LIFECYCLE_STATE",
    409,
  );
}

/**
 * Pure ownership guard. The row id comes from the URL, so ownership must be
 * proven from the row itself, never from the request body.
 */
export function assertApplicationOwner(
  application: { applicant_id?: string; jobseeker_id?: string },
  actor: { id: string },
): void {
  const ownerId = application.applicant_id ?? application.jobseeker_id;
  if (ownerId !== actor.id) {
    throw new AppError("Anda tidak memiliki akses ke lamaran ini.", "FORBIDDEN", 403);
  }
}

export interface MyApplication {
  id: string;
  vacancyId: string;
  jobTitle: string;
  companyName: string | null;
  status: ApplicationStatus;
  statusLabel: string;
  submittedAt: string;
  withdrawable: boolean;
}

/** Joined row shape returned by the nested select in `getMyApplications`. */
export type ApplicationListRow = {
  id: string;
  job_id?: string;
  vacancy_id?: string;
  status: ApplicationStatus;
  created_at: string;
  vacancy:
    | {
        id: string;
        title: string;
        company: { name: string } | null;
      }
    | null;
};

/**
 * Maps a joined row to what the browser may see. Pure so the label and the
 * `withdrawable` flag stay identical between the page and the API.
 */
export function toMyApplication(row: ApplicationListRow): MyApplication {
  return {
    id: row.id,
    vacancyId: row.job_id ?? row.vacancy_id ?? "",
    jobTitle: row.vacancy?.title ?? "Lowongan tidak tersedia lagi",
    companyName: row.vacancy?.company?.name ?? null,
    status: row.status,
    statusLabel: applicationStatusLabel(row.status),
    submittedAt: row.created_at,
    withdrawable: isWithdrawable(row.status),
  };
}
