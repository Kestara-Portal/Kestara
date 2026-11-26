import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/session";
import {
  assertApplicationOwner,
  assertWithdrawableLifecycle,
  getMyApplications,
  isWithdrawable,
  toMyApplication,
  withdrawApplication,
  type WithdrawApplicationDeps,
} from "@/lib/services/applications";
import { AppError } from "@/lib/utils/errors";
import type { ApplicationStatus, JobApplicationRow } from "@/types/database";

const APPLICATION_ID = "8b1d2c3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";
const JOBSEEKER_ID = "11111111-2222-4333-8444-555555555555";
const OTHER_JOBSEEKER_ID = "99999999-8888-4777-8666-555555555555";
const VACANCY_ID = "3f6c8a1e-1c2b-4a8f-9d7e-6b5a4c3d2e1f";

const jobseeker: CurrentUser = {
  id: JOBSEEKER_ID,
  email: "joko@example.com",
  fullName: "Joko Pencari",
  role: "jobseeker",
  accountStatus: "active",
};

const recruiter: CurrentUser = {
  id: "77777777-6666-4555-8444-333333333333",
  email: "rani@example.com",
  fullName: "Rani Rekruter",
  role: "recruiter",
  accountStatus: "active",
};

function makeApplication(overrides: Partial<JobApplicationRow> = {}): JobApplicationRow {
  const applicantId = overrides.applicant_id ?? overrides.jobseeker_id ?? JOBSEEKER_ID;
  const jobId = overrides.job_id ?? overrides.vacancy_id ?? VACANCY_ID;
  return {
    id: APPLICATION_ID,
    applicant_id: applicantId,
    job_id: jobId,
    jobseeker_id: applicantId,
    vacancy_id: jobId,
    status: "submitted",
    cover_letter: "Saya tertarik.",
    withdrawal_reason: null,
    created_at: "2026-11-10T02:00:00.000Z",
    updated_at: "2026-11-10T02:00:00.000Z",
    ...overrides,
  };
}

function makeDeps(overrides: Partial<WithdrawApplicationDeps> = {}) {
  const deps: WithdrawApplicationDeps = {
    findApplication: vi.fn(async () => makeApplication()),
    markWithdrawn: vi.fn(async (_id: string, reason: string | null) =>
      makeApplication({ status: "withdrawn", withdrawal_reason: reason }),
    ),
    ...overrides,
  };

  return deps;
}

async function expectAppError(promise: Promise<unknown>, code: string, status: number) {
  await expect(promise).rejects.toBeInstanceOf(AppError);
  try {
    await promise;
  } catch (error) {
    const appError = error as AppError;
    expect(appError.code).toBe(code);
    expect(appError.status).toBe(status);
  }
}

describe("KP-63: withdrawal lifecycle rules", () => {
  it("allows withdrawal only while submitted or under review", () => {
    expect(isWithdrawable("submitted")).toBe(true);
    expect(isWithdrawable("under_review")).toBe(true);
    expect(isWithdrawable("shortlisted")).toBe(false);
    expect(isWithdrawable("rejected")).toBe(false);
    expect(isWithdrawable("withdrawn")).toBe(false);
  });

  it("throws 409 INVALID_LIFECYCLE_STATE for a rejected application", () => {
    try {
      assertWithdrawableLifecycle("rejected");
      throw new Error("should have thrown");
    } catch (error) {
      const appError = error as AppError;
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.code).toBe("INVALID_LIFECYCLE_STATE");
      expect(appError.status).toBe(409);
    }
  });

  it("throws 409 for shortlisted and already-withdrawn applications", () => {
    for (const status of ["shortlisted", "withdrawn"] as ApplicationStatus[]) {
      expect(() => assertWithdrawableLifecycle(status)).toThrow(AppError);
    }
  });

  it("does not throw for cancellable statuses", () => {
    expect(() => assertWithdrawableLifecycle("submitted")).not.toThrow();
    expect(() => assertWithdrawableLifecycle("under_review")).not.toThrow();
  });
});

describe("KP-63: ownership guard", () => {
  it("accepts the applicant who owns the row", () => {
    expect(() => assertApplicationOwner(makeApplication(), jobseeker)).not.toThrow();
  });

  it("rejects a different jobseeker with 403 FORBIDDEN", () => {
    const otherApplicant: CurrentUser = { ...jobseeker, id: OTHER_JOBSEEKER_ID };

    try {
      assertApplicationOwner(makeApplication(), otherApplicant);
      throw new Error("should have thrown");
    } catch (error) {
      const appError = error as AppError;
      expect(appError.code).toBe("FORBIDDEN");
      expect(appError.status).toBe(403);
    }
  });
});

describe("KP-63: withdrawApplication use case", () => {
  it("withdraws the caller's own submitted application", async () => {
    const deps = makeDeps();

    const result = await withdrawApplication(APPLICATION_ID, jobseeker, {
      reason: "Sudah menerima tawaran lain.",
      deps,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("withdrawn");
    expect(result.application.status).toBe("withdrawn");
    expect(deps.markWithdrawn).toHaveBeenCalledWith(
      APPLICATION_ID,
      "Sudah menerima tawaran lain.",
    );
  });

  it("passes a null reason when none is supplied", async () => {
    const deps = makeDeps();

    await withdrawApplication(APPLICATION_ID, jobseeker, { deps });

    expect(deps.markWithdrawn).toHaveBeenCalledWith(APPLICATION_ID, null);
  });

  it("refuses to cancel another candidate's application", async () => {
    const deps = makeDeps({
      findApplication: vi.fn(async () => makeApplication({ jobseeker_id: OTHER_JOBSEEKER_ID })),
    });

    await expectAppError(
      withdrawApplication(APPLICATION_ID, jobseeker, { deps }),
      "FORBIDDEN",
      403,
    );
    expect(deps.markWithdrawn).not.toHaveBeenCalled();
  });

  it("refuses to cancel an application in a terminal state", async () => {
    const deps = makeDeps({
      findApplication: vi.fn(async () => makeApplication({ status: "rejected" })),
    });

    await expectAppError(
      withdrawApplication(APPLICATION_ID, jobseeker, { deps }),
      "INVALID_LIFECYCLE_STATE",
      409,
    );
    expect(deps.markWithdrawn).not.toHaveBeenCalled();
  });

  it("refuses a shortlisted application", async () => {
    const deps = makeDeps({
      findApplication: vi.fn(async () => makeApplication({ status: "shortlisted" })),
    });

    await expectAppError(
      withdrawApplication(APPLICATION_ID, jobseeker, { deps }),
      "INVALID_LIFECYCLE_STATE",
      409,
    );
  });

  it("returns 404 when the application does not exist", async () => {
    const deps = makeDeps({ findApplication: vi.fn(async () => null) });

    await expectAppError(
      withdrawApplication(APPLICATION_ID, jobseeker, { deps }),
      "NOT_FOUND",
      404,
    );
    expect(deps.markWithdrawn).not.toHaveBeenCalled();
  });

  it("rejects a recruiter or admin caller", async () => {
    const deps = makeDeps();

    await expectAppError(
      withdrawApplication(APPLICATION_ID, recruiter, { deps }),
      "FORBIDDEN",
      403,
    );
    expect(deps.findApplication).not.toHaveBeenCalled();
  });

  it("rejects a malformed application id", async () => {
    const deps = makeDeps();

    await expectAppError(
      withdrawApplication("bukan-uuid", jobseeker, { deps }),
      "BAD_REQUEST",
      400,
    );
    expect(deps.findApplication).not.toHaveBeenCalled();
  });

  it("returns 404 when the update affects no row", async () => {
    const deps = makeDeps({ markWithdrawn: vi.fn(async () => null) });

    await expectAppError(
      withdrawApplication(APPLICATION_ID, jobseeker, { deps }),
      "NOT_FOUND",
      404,
    );
  });
});

describe("KP-63: application list projection", () => {
  it("maps a joined row with the company name", () => {
    const item = toMyApplication({
      id: APPLICATION_ID,
      vacancy_id: VACANCY_ID,
      status: "under_review",
      created_at: "2026-11-10T02:00:00.000Z",
      vacancy: { id: VACANCY_ID, title: "Frontend Developer", company: { name: "PT Mitra" } },
    });

    expect(item).toEqual({
      id: APPLICATION_ID,
      vacancyId: VACANCY_ID,
      jobTitle: "Frontend Developer",
      companyName: "PT Mitra",
      status: "under_review",
      statusLabel: "Sedang Ditinjau",
      submittedAt: "2026-11-10T02:00:00.000Z",
      withdrawable: true,
    });
  });

  it("falls back when the vacancy is no longer visible", () => {
    const item = toMyApplication({
      id: APPLICATION_ID,
      vacancy_id: VACANCY_ID,
      status: "withdrawn",
      created_at: "2026-11-10T02:00:00.000Z",
      vacancy: null,
    });

    expect(item.jobTitle).toBe("Lowongan tidak tersedia lagi");
    expect(item.companyName).toBeNull();
    expect(item.statusLabel).toBe("Dibatalkan");
    expect(item.withdrawable).toBe(false);
  });

  it("does not offer withdrawal once the recruiter has decided", () => {
    for (const status of ["shortlisted", "rejected"] as ApplicationStatus[]) {
      const item = toMyApplication({
        id: APPLICATION_ID,
        vacancy_id: VACANCY_ID,
        status,
        created_at: "2026-11-10T02:00:00.000Z",
        vacancy: { id: VACANCY_ID, title: "QA", company: null },
      });
      expect(item.withdrawable).toBe(false);
    }
  });
});

describe("KP-63: getMyApplications guard", () => {
  it("rejects a non-jobseeker before querying", async () => {
    await expect(getMyApplications(recruiter)).rejects.toBeInstanceOf(AppError);
  });
});
