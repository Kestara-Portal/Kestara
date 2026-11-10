"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isPublicRole } from "@/lib/auth/roles";
import {
  type FieldErrors,
  hasErrors,
  validateLogin,
  validateRegistration,
} from "@/lib/validations/auth";

export type AuthActionState = {
  error?: string;
  fieldErrors?: FieldErrors;
};

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login")) return "Email atau kata sandi salah.";
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Email sudah terdaftar.";
  }
  if (normalized.includes("password")) return "Kata sandi tidak memenuhi ketentuan.";
  if (normalized.includes("email")) return "Email tidak valid atau belum dikonfirmasi.";
  return "Terjadi kesalahan. Silakan coba lagi.";
}

export async function signUpAction(
  _previous: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleInput = String(formData.get("role") ?? "");

  const fieldErrors = validateRegistration({ fullName, email, password, role: roleInput });
  if (hasErrors(fieldErrors)) {
    return { fieldErrors };
  }

  // Never trust the submitted role. Only public roles are allowed here, so an
  // "admin" value can never be granted through public registration.
  if (!isPublicRole(roleInput)) {
    return { error: "Peran tidak valid untuk pendaftaran publik." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: roleInput },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  redirect("/auth/login?registered=1");
}

export async function signInAction(
  _previous: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const fieldErrors = validateLogin({ email, password });
  if (hasErrors(fieldErrors)) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
