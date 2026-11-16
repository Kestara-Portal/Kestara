import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { portfolioInputSchema } from "@/lib/validations/profile";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";

const PORTFOLIO_COLUMNS =
  "id, user_id, title, description, project_url, media_path, start_date, end_date, created_at, updated_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Update one of the authenticated user's own portfolio items.
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
    return jsonError("INVALID_ID", "ID portofolio tidak valid.", 400);
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
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      project_url: parsed.data.projectUrl,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(PORTFOLIO_COLUMNS)
    .maybeSingle();

  if (error) {
    return jsonError("PORTFOLIO_UPDATE_FAILED", "Portofolio belum dapat diperbarui.", 400);
  }
  if (!data) {
    return jsonError(
      "PORTFOLIO_NOT_FOUND",
      "Portofolio tidak ditemukan atau bukan milik Anda.",
      404,
    );
  }

  return jsonOk({ portfolio: data });
}
