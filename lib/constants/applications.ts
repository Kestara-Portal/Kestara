import type { ApplicationRow, ApplicationStatus } from "@/types/database";

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "submitted",
  "screening",
  "interview",
  "assessment",
  "accepted",
  "rejected",
  "cancelled",
] as const;

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Pendaftaran Masuk",
  under_review: "Sedang Ditinjau",
  shortlisted: "Masuk Shortlist",
  screening: "Seleksi Administrasi",
  interview: "Tahap Wawancara",
  assessment: "Uji Kompetensi",
  accepted: "Lolos / Diterima",
  rejected: "Tidak Lolos",
  withdrawn: "Dibatalkan Pelamar",
  cancelled: "Dibatalkan Pelamar",
};

export interface ApplicationDetail extends ApplicationRow {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  companyName: string;
}

export interface UpdateStatusResult {
  applicationId: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  newStatusLabel: string;
  notificationCreated: boolean;
  message: string;
}

