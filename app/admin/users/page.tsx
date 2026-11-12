import { Suspense } from "react";
import { getAdminUsers } from "@/lib/auth/admin-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { DeactivateAccountsClient } from "./deactivate-accounts-client";

export const metadata = {
  title: "Penonaktifan Akun Pelanggar — Admin Kestara",
};

async function AdminDeactivateUsersContent() {
  const currentUser = (await getCurrentUser()) ?? {
    id: "admin-system-id",
    fullName: "Administrator Kestara",
    role: "admin" as const,
    accountStatus: "active",
  };

  const users = await getAdminUsers();

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#dd1567] px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs">
                Admin Panel
              </span>
              <p className="text-xs font-bold tracking-wider text-[#dd1567]">KESTARA PLATFORM</p>
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Penonaktifan Akun Pelanggar Ketentuan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sebagai Administrator, nonaktifkan akun pengguna yang melanggar ketentuan agar keamanan
              dan kenyamanan komunitas platform Kestara tetap terjaga.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white border border-slate-200 px-3.5 py-1.5 text-xs text-slate-700 shadow-xs">
              Masuk sebagai: <strong>{currentUser.fullName}</strong>
            </span>
          </div>
        </header>

        {/* Informational Guidance Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-pink-200 bg-pink-50/70 p-4 text-xs text-slate-700 shadow-xs">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-[#dd1567]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div>
            <strong className="text-[#dd1567]">Pedoman Moderasi:</strong> Gunakan fitur ini untuk menonaktifkan akun yang dilaporkan
            atau melanggar aturan komunitas (misal spam, fraud, atau perilaku tidak pantas). Akun yang
            dinonaktifkan tidak akan dapat masuk kembali ke sistem demi melindungi kenyamanan pengguna lain.
          </div>
        </div>

        {/* Client Moderation Component (Search, Filter, Table, Modal) */}
        <DeactivateAccountsClient users={users} currentUserId={currentUser.id} />
      </div>
    </main>
  );
}
export default function AdminDeactivateUsersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">
          Memuat panel admin...
        </main>
      }
    >
      <AdminDeactivateUsersContent />
    </Suspense>
  );
}