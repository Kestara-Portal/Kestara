import { describe, expect, it } from "vitest";

import {
  WITHDRAWAL_REASON_MAX,
  validateApplicationId,
  validateWithdrawApplication,
} from "@/lib/validations/application";

const APPLICATION_ID = "8b1d2c3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";

describe("KP-63: application withdrawal validation", () => {
  it("accepts a valid application id", () => {
    expect(validateApplicationId(APPLICATION_ID)).toBeNull();
  });

  it("rejects a missing or malformed application id", () => {
    expect(validateApplicationId("")).toContain("wajib diisi");
    expect(validateApplicationId("123")).toContain("tidak valid");
    expect(validateApplicationId(null)).toContain("wajib diisi");
  });

  it("treats the reason as optional", () => {
    for (const body of [undefined, null, {}, { reason: "" }, { reason: "   " }]) {
      const result = validateWithdrawApplication(body);
      expect(result.success, JSON.stringify(body)).toBe(true);
      if (result.success) expect(result.data.reason).toBeNull();
    }
  });

  it("trims a provided reason", () => {
    const result = validateWithdrawApplication({ reason: "  Sudah menerima tawaran lain.  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reason).toBe("Sudah menerima tawaran lain.");
  });

  it("rejects a reason longer than 500 characters", () => {
    const result = validateWithdrawApplication({
      reason: "x".repeat(WITHDRAWAL_REASON_MAX + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.reason).toContain("maksimal 500");
  });

  it("accepts a reason exactly at the limit", () => {
    const result = validateWithdrawApplication({ reason: "x".repeat(WITHDRAWAL_REASON_MAX) });
    expect(result.success).toBe(true);
  });

  it("does not throw on a non-object body", () => {
    const result = validateWithdrawApplication("bukan objek");
    expect(result.success).toBe(false);
    if (!result.success) expect(Object.keys(result.fieldErrors).length).toBeGreaterThan(0);
  });
});
