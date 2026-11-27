import type { CurrentUser } from "@/lib/auth/session";
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
 *
 * Withdrawal is a status transition to 'withdrawn', never a row delete: the
 * recruiter keeps the application history and the audit trail.
 *
 * Pure rules and the read model live in `lib/services/application-dto.ts` so the
 * client component can import them without pulling in the server Supabase client.
 */

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
