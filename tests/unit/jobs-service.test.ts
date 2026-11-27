import { describe, expect, it } from "vitest";
import { validateJobManagement } from "@/lib/services/jobs";
import type { CurrentUser } from "@/lib/auth/session";

describe("validateJobManagement (KP-47)", () => {
  const adminUser: CurrentUser = {
    id: "admin-1",
    email: "admin@kestara.id",
    fullName: "Admin Kestara",
    role: "admin",
    accountStatus: "active",
  };

  const recruiterUser: CurrentUser = {
    id: "recruiter-1",
    email: "recruiter@company.com",
    fullName: "Recruiter One",
    role: "recruiter",
    accountStatus: "active",
  };

  const otherRecruiter: CurrentUser = {
    id: "recruiter-2",
    email: "recruiter2@company.com",
    fullName: "Recruiter Two",
    role: "recruiter",
    accountStatus: "active",
  };

  const jobseekerUser: CurrentUser = {
    id: "user-1",
    email: "user@gmail.com",
    fullName: "Jobseeker One",
    role: "jobseeker",
    accountStatus: "active",
  };

  const sampleJob = {
    id: "job-1",
    title: "Software Engineer",
    status: "published" as const,
    created_by: "recruiter-1",
  };

  it("allows admin to manage any job", () => {
    expect(() => validateJobManagement(sampleJob, adminUser)).not.toThrow();
  });

  it("allows recruiter to manage their own job", () => {
    expect(() => validateJobManagement(sampleJob, recruiterUser)).not.toThrow();
  });

  it("rejects non-owner recruiter from managing job", () => {
    expect(() => validateJobManagement(sampleJob, otherRecruiter)).toThrow(
      "Rekruter hanya memiliki izin untuk mengelola lowongan yang dibuatnya sendiri.",
    );
  });

  it("rejects jobseeker from managing job", () => {
    expect(() => validateJobManagement(sampleJob, jobseekerUser)).toThrow(
      "Hanya Administrator atau Rekruter yang berhak mengelola lowongan pekerjaan.",
    );
  });

  it("throws 404 error when job is not found", () => {
    expect(() => validateJobManagement(null, adminUser)).toThrow(
      "Lowongan pekerjaan tidak ditemukan.",
    );
  });
});
