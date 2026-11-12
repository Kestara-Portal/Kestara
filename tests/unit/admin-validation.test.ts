import { describe, expect, it } from "vitest";

import {
  isAccountStatus,
  validateAccountStatus,
  validateUserId,
} from "@/lib/validations/admin";

describe("admin validation", () => {
  describe("isAccountStatus", () => {
    it("recognizes valid account statuses", () => {
      expect(isAccountStatus("active")).toBe(true);
      expect(isAccountStatus("suspended")).toBe(true);
      expect(isAccountStatus("deactivated")).toBe(true);
    });

    it("rejects invalid account statuses", () => {
      expect(isAccountStatus("deleted")).toBe(false);
      expect(isAccountStatus("unknown")).toBe(false);
      expect(isAccountStatus("")).toBe(false);
      expect(isAccountStatus(null)).toBe(false);
    });
  });

  describe("validateAccountStatus", () => {
    it("returns null for valid statuses", () => {
      expect(validateAccountStatus("active")).toBeNull();
      expect(validateAccountStatus("suspended")).toBeNull();
      expect(validateAccountStatus("deactivated")).toBeNull();
    });

    it("returns error message for invalid statuses", () => {
      expect(validateAccountStatus("invalid")).not.toBeNull();
      expect(validateAccountStatus("")).not.toBeNull();
    });
  });

  describe("validateUserId", () => {
    it("accepts valid UUIDs", () => {
      expect(validateUserId("123e4567-e89b-12d3-a456-426614174000")).toBeNull();
      expect(validateUserId("c56a4180-65aa-42ec-a945-5fd21dec0538")).toBeNull();
    });

    it("rejects invalid UUID formats and empty values", () => {
      expect(validateUserId("")).toBe("ID pengguna wajib diisi.");
      expect(validateUserId("not-a-uuid")).toBe("Format ID pengguna tidak valid.");
      expect(validateUserId("12345")).toBe("Format ID pengguna tidak valid.");
    });
  });
});

