import { describe, expect, it } from "vitest";
import {
  determineJobCascadingAction,
  validateCompanyDeletion,
} from "@/lib/services/companies";
import { AppError } from "@/lib/utils/errors";
import type { CompanyRow, JobRow } from "@/types/database";

describe("KP-31 / KP-34: Company Deletion and Job Cascading Rules", () => {
  const activeCompany: Pick<CompanyRow, "id" | "name" | "status"> = {
    id: "comp-123",
    name: "PT Mitra Inovasi",
    status: "active",
  };

  const deletedCompany: Pick<CompanyRow, "id" | "name" | "status"> = {
    id: "comp-456",
    name: "PT Sudah Terhapus",
    status: "deleted",
  };

  describe("validateCompanyDeletion (KP-31 / KP-33 Authorization & Validation)", () => {
    it("allows admin to delete an active company", () => {
      expect(() => {
        validateCompanyDeletion(activeCompany, "admin");
      }).not.toThrow();
    });

    it("rejects non-admin roles with 403 Forbidden", () => {
      const nonAdminRoles = ["jobseeker", "mentor", "recruiter", "guest"];

      for (const role of nonAdminRoles) {
        expect(() => {
          validateCompanyDeletion(activeCompany, role);
        }).toThrow(AppError);

        try {
          validateCompanyDeletion(activeCompany, role);
        } catch (err) {
          const appErr = err as AppError;
          expect(appErr.code).toBe("FORBIDDEN");
          expect(appErr.status).toBe(403);
        }
      }
    });

    it("rejects when company does not exist (404 NOT_FOUND)", () => {
      expect(() => {
        validateCompanyDeletion(null, "admin");
      }).toThrow(AppError);

      try {
        validateCompanyDeletion(null, "admin");
      } catch (err) {
        const appErr = err as AppError;
        expect(appErr.code).toBe("NOT_FOUND");
        expect(appErr.status).toBe(404);
      }
    });

    it("rejects when company is already deleted (400 ALREADY_DELETED)", () => {
      expect(() => {
        validateCompanyDeletion(deletedCompany, "admin");
      }).toThrow(AppError);

      try {
        validateCompanyDeletion(deletedCompany, "admin");
      } catch (err) {
        const appErr = err as AppError;
        expect(appErr.code).toBe("ALREADY_DELETED");
        expect(appErr.status).toBe(400);
      }
    });
  });

  describe("determineJobCascadingAction (KP-34 Related Vacancies Rule)", () => {
    it("identifies active and draft jobs to close", () => {
      const mockJobs: Array<Pick<JobRow, "id" | "status">> = [
        { id: "job-1", status: "published" },
        { id: "job-2", status: "draft" },
        { id: "job-3", status: "closed" },
        { id: "job-4", status: "archived" },
        { id: "job-5", status: "published" },
      ];

      const result = determineJobCascadingAction(mockJobs);

      expect(result.jobIdsToClose).toEqual(["job-1", "job-2", "job-5"]);
      expect(result.activeCount).toBe(3);
    });

    it("returns empty list if company has no active or draft jobs", () => {
      const mockJobs: Array<Pick<JobRow, "id" | "status">> = [
        { id: "job-1", status: "closed" },
        { id: "job-2", status: "archived" },
      ];

      const result = determineJobCascadingAction(mockJobs);

      expect(result.jobIdsToClose).toEqual([]);
      expect(result.activeCount).toBe(0);
    });

    it("handles company with no jobs at all", () => {
      const result = determineJobCascadingAction([]);
      expect(result.jobIdsToClose).toEqual([]);
      expect(result.activeCount).toBe(0);
    });
  });
});
