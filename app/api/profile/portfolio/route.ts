import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { portfolioInputSchema } from "@/lib/validations/profile";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";

const PORTFOLIO_COLUMNS =
  "id, user_id, title, description, project_url, media_path, start_date, end_date, created_at, updated_at";

// Create a portfolio item for the authenticated user.
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

  const parsed = portfolioInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(zodFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      project_url: parsed.data.projectUrl,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
    })
    .select(PORTFOLIO_COLUMNS)
    .maybeSingle();

  if (error) {
    return jsonError("PORTFOLIO_CREATE_FAILED", "Portofolio belum dapat disimpan.", 403);
  }

  return jsonOk({ portfolio: data }, { status: 201 });
}
