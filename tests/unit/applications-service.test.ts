import { describe, expect, it } from "vitest";
import {
  APPLICATION_STATUSES,
  buildStatusUpdateNotification,
  STATUS_LABELS,
  validateStatusTransition,
} from "@/lib/services/applications";
import { AppError } from "@/lib/utils/errors";
import type { ApplicationStatus } from "@/types/database";

describe("KP-60 / KP-61 / KP-62: Application Status Updates & Notification Triggers", () => {
  describe("validateStatusTransition (KP-61 Business Rules & Authorization)", () => {
    it("allows recruiter to transition application status to valid next stage", () => {
      const result = validateStatusTransition("submitted", "screening", "recruiter");
      expect(result).toBe("screening");

      const interviewResult = validateStatusTransition("screening", "interview", "recruiter");
      expect(interviewResult).toBe("interview");

      const acceptedResult = validateStatusTransition("interview", "accepted", "recruiter");
      expect(acceptedResult).toBe("accepted");
    });

    it("allows admin to transition application status", () => {
      const result = validateStatusTransition("screening", "rejected", "admin");
      expect(result).toBe("rejected");
    });

    it("rejects unauthorized roles (jobseeker, mentor, guest) with 403 FORBIDDEN", () => {
      const unauthorizedRoles = ["jobseeker", "mentor", "guest", "anonymous"];

      for (const role of unauthorizedRoles) {
        expect(() => {
          validateStatusTransition("submitted", "screening", role);
        }).toThrow(AppError);

        try {
          validateStatusTransition("submitted", "screening", role);
        } catch (err) {
          const appErr = err as AppError;
          expect(appErr.code).toBe("FORBIDDEN");
          expect(appErr.status).toBe(403);
        }
      }
    });

    it("rejects invalid status strings with 400 INVALID_STATUS", () => {
      const invalidStatuses = ["promoted", "hired_now", "deleted", "random_string"];

      for (const invalid of invalidStatuses) {
        expect(() => {
          validateStatusTransition("submitted", invalid, "recruiter");
        }).toThrow(AppError);

        try {
          validateStatusTransition("submitted", invalid, "recruiter");
        } catch (err) {
          const appErr = err as AppError;
          expect(appErr.code).toBe("INVALID_STATUS");
          expect(appErr.status).toBe(400);
        }
      }
    });

    it("rejects transition if target status is identical to current status (400 NO_CHANGE)", () => {
      expect(() => {
        validateStatusTransition("interview", "interview", "recruiter");
      }).toThrow(AppError);

      try {
        validateStatusTransition("interview", "interview", "recruiter");
      } catch (err) {
        const appErr = err as AppError;
        expect(appErr.code).toBe("NO_CHANGE");
        expect(appErr.status).toBe(400);
      }
    });

    it("rejects updates to applications that were cancelled by the jobseeker (400 APPLICATION_CANCELLED)", () => {
      expect(() => {
        validateStatusTransition("cancelled", "interview", "recruiter");
      }).toThrow(AppError);

      try {
        validateStatusTransition("cancelled", "interview", "recruiter");
      } catch (err) {
        const appErr = err as AppError;
        expect(appErr.code).toBe("APPLICATION_CANCELLED");
        expect(appErr.status).toBe(400);
      }
    });
  });

  describe("buildStatusUpdateNotification (KP-62 Automatic Notification Trigger)", () => {
    const jobTitle = "Frontend Engineer";

    it("builds encouraging notification when candidate passes to interview", () => {
      const notif = buildStatusUpdateNotification(jobTitle, "interview");

      expect(notif.title).toContain("Tahap Wawancara");
      expect(notif.message).toContain("Frontend Engineer");
      expect(notif.message).toContain("Tahap Wawancara");
      expect(notif.message).toContain("Kabar baik!");
    });

    it("builds celebratory notification when candidate is accepted", () => {
      const notif = buildStatusUpdateNotification(jobTitle, "accepted");

      expect(notif.title).toContain("Lolos / Diterima");
      expect(notif.message).toContain("Selamat!");
      expect(notif.message).toContain("Frontend Engineer");
      expect(notif.message).toContain("email");
    });

    it("builds polite and professional rejection notification when candidate is rejected", () => {
      const notif = buildStatusUpdateNotification(jobTitle, "rejected");

      expect(notif.title).toContain("Tidak Lolos");
      expect(notif.message).toContain("Terima kasih");
      expect(notif.message).toContain("Frontend Engineer");
      expect(notif.message).toContain("belum dapat dilanjutkan");
    });

    it("builds standard progress notification for intermediate statuses like screening or assessment", () => {
      const notif = buildStatusUpdateNotification(jobTitle, "assessment");

      expect(notif.title).toContain("Uji Kompetensi");
      expect(notif.message).toContain("Uji Kompetensi");
      expect(notif.message).toContain("Frontend Engineer");
    });
  });

  describe("APPLICATION_STATUSES and STATUS_LABELS integrity", () => {
    it("ensures every application status has a corresponding user-friendly label in Indonesian", () => {
      for (const status of APPLICATION_STATUSES) {
        expect(STATUS_LABELS[status]).toBeDefined();
        expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
      }
    });
  });
});

