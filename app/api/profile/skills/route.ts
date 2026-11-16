import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { skillInputSchema } from "@/lib/validations/profile";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";

const SKILL_COLUMNS = "id, user_id, skill_name, category, description, created_at, updated_at";

// Create a skills-matrix item for the authenticated user.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("UNAUTHENTICATED", "Anda harus masuk terlebih dahulu.", 401);
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
    .insert({
      user_id: user.id, // always the session user; never from the client body
      skill_name: parsed.data.skillName,
      category: parsed.data.category,
      description: parsed.data.description,
    })
    .select(SKILL_COLUMNS)
    .maybeSingle();

  if (error) {
    return jsonError("SKILL_CREATE_FAILED", "Keahlian belum dapat disimpan.", 403);
  }

  return jsonOk({ skill: data }, { status: 201 });
}
