import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { JobCreateForm } from "@/components/jobs/job-create-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getVerifiedCompaniesForRecruiter } from "@/lib/jobs/companies";

export const metadata: Metadata = {
  title: "Buat Lowongan",
};

// Auth-gated page reads the session cookie; opt out of Cache Components
// prerendering so the route is rendered dynamically per request.
export const instant = false;

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "recruiter") {
    return (
      <AppShell user={user} title="Buat Lowongan" activePath="/jobs/new">
        <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
          <div className="rounded-[14px] border border-line bg-white p-6">
            <h1 className="text-xl font-bold text-foreground">Akses ditolak</h1>
            <p className="mt-2 text-sm text-muted">
              Hanya akun rekruter yang dapat membuat dan memublikasikan lowongan.
            </p>
            <Link href="/profile" className="mt-4 inline-block text-sm font-medium text-brand underline">
              Kembali ke profil
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  const companyResult = await getVerifiedCompaniesForRecruiter(user.id);

  return (
    <AppShell user={user} title="Buat Lowongan" activePath="/jobs/new">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Buat lowongan baru</h1>
          <p className="mt-1 text-sm text-muted">
            Lengkapi detail lowongan dan kriteria keahlian, lalu publikasikan.
          </p>
        </div>
        <div className="rounded-[14px] border border-line bg-white p-5 sm:p-6">
          <JobCreateForm
            initialCompanies={companyResult.ok ? companyResult.companies : []}
            initialLoadError={
              companyResult.ok
                ? undefined
                : "Daftar perusahaan belum dapat dimuat. Coba lagi."
            }
          />
        </div>
      </main>
    </AppShell>
  );
}
