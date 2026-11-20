import { createAdminClient } from "@/lib/supabase/admin";

export interface ProvisionAdminInput {
  email: string;
  password: string;
  fullName: string;
}

/**
 * Controlled Admin provisioning. MUST run on the server with the service-role
 * key. The auth profile trigger never grants admin; this explicit, privileged
 * step is the only path that sets the admin role.
 */
export async function provisionAdmin(input: ProvisionAdminInput): Promise<string> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    // Trigger will provision a normal profile (jobseeker), never admin.
    user_metadata: { full_name: input.fullName, role: "jobseeker" },
  });

  if (error || !data.user) {
    throw new Error(`Gagal membuat akun admin: ${error?.message ?? "unknown error"}`);
  }

  const { error: updateError } = await admin
    .from("users")
    .update({ role: "admin", full_name: input.fullName })
    .eq("id", data.user.id);

  if (updateError) {
    throw new Error(`Akun dibuat tetapi gagal menetapkan role admin: ${updateError.message}`);
  }

  return data.user.id;
}
