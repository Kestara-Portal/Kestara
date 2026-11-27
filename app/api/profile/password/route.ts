import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { passwordChangeSchema } from "@/lib/validations/profile";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";

// Change the authenticated user's password via Supabase Auth.
// The plaintext password is never stored in public.users.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("UNAUTHENTICATED", "Anda harus masuk terlebih dahulu.", 401);
  }
  if (!user.email) {
    return jsonError("MISSING_EMAIL", "Akun ini tidak memiliki email terdaftar.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Body permintaan tidak valid.", 400);
  }

  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(zodFieldErrors(parsed.error));
  }

  const supabase = await createClient();

  // Re-verify the current password before allowing a change.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (reauthError) {
    return jsonValidationError({ currentPassword: "Kata sandi saat ini salah." });
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (updateError) {
    return jsonError(
      "PASSWORD_UPDATE_FAILED",
      "Kata sandi belum dapat diperbarui. Coba lagi.",
      400,
    );
  }

  return jsonOk({ updated: true });
}
