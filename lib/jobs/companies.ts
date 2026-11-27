import { createClient } from "@/lib/supabase/server";

export type VerifiedCompany = { id: string; name: string };

type CompanyQueryError = { message: string; code: string };

export type VerifiedCompanyResult =
  | { ok: true; companies: VerifiedCompany[] }
  | { ok: false; error: CompanyQueryError };

export async function getVerifiedCompaniesForRecruiter(
  recruiterId: string,
): Promise<VerifiedCompanyResult> {
  const supabase = await createClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("company_memberships")
    .select("company_id")
    .eq("user_id", recruiterId)
    .eq("membership_status", "verified");

  if (membershipError) {
    return {
      ok: false,
      error: { message: membershipError.message, code: membershipError.code },
    };
  }

  const companyIds = [...new Set((memberships ?? []).map(({ company_id }) => company_id))];
  if (companyIds.length === 0) {
    return { ok: true, companies: [] };
  }

  const { data: companies, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .in("id", companyIds)
    .order("name", { ascending: true });

  if (companyError) {
    return {
      ok: false,
      error: { message: companyError.message, code: companyError.code },
    };
  }

  return { ok: true, companies: companies ?? [] };
}
