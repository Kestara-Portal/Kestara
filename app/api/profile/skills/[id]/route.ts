import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { skillInputSchema } from "@/lib/validations/profile";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";

const SKILL_COLUMNS = "id, user_id, skill_name, category, description, created_at, updated_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Update one of the authenticated user's own skills-matrix items.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("UNAUTHENTICATED", "Anda harus masuk terlebih dahulu.", 401);
  }

  const { id } = await params;
  if (!UUID.test(id)) {
    return jsonError("INVALID_ID", "ID keahlian tidak valid.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Body permintaan tidak valid.", 400);
  }

  const parsed = skillInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(zodFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_skills")
    .update({
      skill_name: parsed.data.skillName,
      category: parsed.data.category,
      description: parsed.data.description,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(SKILL_COLUMNS)
    .maybeSingle();

  if (error) {
    return jsonError("SKILL_UPDATE_FAILED", "Keahlian belum dapat diperbarui.", 400);
  }
  if (!data) {
    return jsonError(
      "SKILL_NOT_FOUND",
      "Keahlian tidak ditemukan atau bukan milik Anda.",
      404,
    );
  }

  return jsonOk({ skill: data });
}
