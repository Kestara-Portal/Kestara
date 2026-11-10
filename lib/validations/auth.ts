import { isPublicRole } from "@/lib/auth/roles";

export type FieldErrors = Record<string, string>;

export interface RegistrationInput {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (value.length === 0) return "Email wajib diisi.";
  if (!EMAIL_PATTERN.test(value)) return "Format email tidak valid.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length === 0) return "Kata sandi wajib diisi.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  return null;
}

export function validateRegistration(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {};

  const fullName = input.fullName.trim();
  if (fullName.length === 0) {
    errors.fullName = "Nama lengkap wajib diisi.";
  } else if (fullName.length < 2) {
    errors.fullName = "Nama lengkap minimal 2 karakter.";
  }

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;

  if (!isPublicRole(input.role)) {
    errors.role = "Peran tidak valid untuk pendaftaran publik.";
  }

  return errors;
}

export function validateLogin(input: LoginInput): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  if (input.password.length === 0) errors.password = "Kata sandi wajib diisi.";
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
