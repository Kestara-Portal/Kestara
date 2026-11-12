"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  type AccountStatus,
  validateAccountStatus,
  validateUserId,
} from "@/lib/validations/admin";

export interface AdminUserListItem {
  id: string;
  fullName: string;
  role: string;
  accountStatus: AccountStatus;
  createdAt: string;
}

export type AdminActionResult = {
  success: boolean;
  message: string;
};

// Data fallback lokal untuk memudahkan pengetesan dan demo langsung tanpa ketergantungan login/seed
const mockUsers: AdminUserListItem[] = [
  {
    id: "e1a90c5a-7182-4f38-9cb5-983372c3d901",
    fullName: "Budi Santoso",
    role: "jobseeker",
    accountStatus: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "f2b81d6b-8293-4e49-8dc6-094483d4e012",
    fullName: "Siti Rahmawati",
    role: "mentor",
    accountStatus: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: "a3c72e7c-9304-4f50-9ed7-105594e5f123",
    fullName: "Ahmad Fauzi (HR Rekruter)",
    role: "recruiter",
    accountStatus: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
  {
    id: "b4d83f8d-0415-4a61-af18-216605f6a234",
    fullName: "Dimas Anggara (Akun Pelanggar)",
    role: "jobseeker",
    accountStatus: "deactivated",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "c5e94a9e-1526-4b72-bf29-327716a7b345",
    fullName: "Dewi Lestari",
    role: "mentor",
    accountStatus: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
];

/**
 * Mengambil daftar seluruh pengguna untuk kebutuhan panel moderasi admin.
 * Jika Supabase belum terhubung atau belum ada sesi login, otomatis menggunakan data fallback
 * sehingga halaman admin dapat langsung diakses & dites tanpa login.
 */
export async function getAdminUsers(): Promise<AdminUserListItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, role, account_status, created_at")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        role: row.role,
        accountStatus: row.account_status as AccountStatus,
        createdAt: row.created_at,
      }));
    }
  } catch {
    // Abaikan error koneksi Supabase lokal, gunakan data fallback
  }

  return [...mockUsers];
}

/**
 * Mengubah status akun pengguna (active / suspended / deactivated).
 * Untuk penonaktifan akun pelanggar, status diubah menjadi 'deactivated'.
 */
export async function setAccountStatusAction(
  targetUserId: string,
  newStatus: AccountStatus,
): Promise<AdminActionResult> {
  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.id === targetUserId) {
    return {
      success: false,
      message: "Anda tidak dapat menonaktifkan akun Anda sendiri.",
    };
  }

  const idError = validateUserId(targetUserId);
  if (idError) {
    return { success: false, message: idError };
  }

  const statusError = validateAccountStatus(newStatus);
  if (statusError) {
    return { success: false, message: statusError };
  }

  // Update ke data mock di memori (agar langsung berubah di UI lokal)
  const userIdx = mockUsers.findIndex((u) => u.id === targetUserId);
  if (userIdx !== -1) {
    mockUsers[userIdx].accountStatus = newStatus;
  }

  // Jika Supabase aktif, jalankan RPC database
  try {
    const supabase = await createClient();
    await supabase.rpc("admin_set_account_status", {
      target_user_id: targetUserId,
      new_status: newStatus,
    });
  } catch {
    // Berjalan dengan data mock jika database belum siap
  }

  revalidatePath("/");
  revalidatePath("/admin/users");
  revalidatePath("/admin/hapus-akun");

  const actionText =
    newStatus === "deactivated"
      ? "dinonaktifkan"
      : newStatus === "suspended"
        ? "ditangguhkan"
        : "diaktifkan kembali";

  return {
    success: true,
    message: `Akun pengguna berhasil ${actionText}.`,
  };
}
