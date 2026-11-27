import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

import AdminCompaniesClient from "./admin-companies-client";

export const metadata = {
  title: "Kelola Perusahaan — Admin Kestara",
};

export default function AdminCompaniesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Memuat data perusahaan…</p>
        </div>
      }
    >
      <AdminCompaniesContent />
    </Suspense>
  );
}

async function AdminCompaniesContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <AppShell user={user} title="Kelola Perusahaan" activePath="/admin/companies">
      <AdminCompaniesClient />
    </AppShell>
  );
}
