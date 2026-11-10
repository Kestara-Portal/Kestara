import { describe, expect, it } from "vitest";

import {
  MIN_PASSWORD_LENGTH,
  hasErrors,
  validateEmail,
  validateLogin,
  validatePassword,
  validateRegistration,
} from "@/lib/validations/auth";

describe("auth validation", () => {
  it("accepts a valid email and rejects invalid ones", () => {
    expect(validateEmail("user@example.com")).toBeNull();
    expect(validateEmail("")).not.toBeNull();
    expect(validateEmail("not-an-email")).not.toBeNull();
  });

  it("enforces minimum password length", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
    expect(validatePassword("short")).not.toBeNull();
    expect(validatePassword("")).not.toBeNull();
  });

  it("validates a correct registration", () => {
    const errors = validateRegistration({
      fullName: "Budi Santoso",
      email: "budi@example.com",
      password: "rahasia123",
      role: "jobseeker",
    });
    expect(hasErrors(errors)).toBe(false);
  });

  it("rejects admin registration through public form", () => {
    const errors = validateRegistration({
      fullName: "Budi Santoso",
      email: "budi@example.com",
      password: "rahasia123",
      role: "admin",
    });
    expect(errors.role).toBeDefined();
  });

  it("collects field errors", () => {
    const errors = validateRegistration({
      fullName: "",
      email: "bad",
      password: "123",
      role: "unknown",
    });
    expect(errors.fullName).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
    expect(errors.role).toBeDefined();
  });

  it("validates login input", () => {
    expect(hasErrors(validateLogin({ email: "a@b.com", password: "x" }))).toBe(false);
    expect(hasErrors(validateLogin({ email: "", password: "" }))).toBe(true);
  });
});
