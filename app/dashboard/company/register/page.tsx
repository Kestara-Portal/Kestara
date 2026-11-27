import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

import { CompanyRegisterForm } from "./company-register-form";

/**
 * E04-C — Company registration page.
 *
 * The shell is static; the session read happens inside <Suspense> so the route
 * stays compatible with Cache Components (see the local Next.js docs).
 */
export default function CompanyRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Memuat formulir…</p>
        </div>
      }
    >
      <CompanyRegisterPageContent />
    </Suspense>
  );
}

async function CompanyRegisterPageContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <AppShell user={user} title="Daftarkan Perusahaan" activePath="/dashboard/company/register">
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6">
          <p className="text-xs font-bold tracking-wider text-[#dd1567]">KESTARA</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Daftarkan Perusahaan</h1>
          <p className="mt-1 text-sm text-slate-600">
            Profil perusahaan menjadi identitas resmi untuk mulai memasang lowongan.
          </p>
        </header>

        {user.role !== "admin" && user.role !== "recruiter" ? (
          <AccessNotice
            title="Akses ditolak"
            message="Hanya rekruter dan administrator yang dapat mendaftarkan perusahaan."
            actionHref="/dashboard"
            actionLabel="Kembali ke beranda"
          />
        ) : (
          <CompanyRegisterForm />
        )}
      </main>
    </AppShell>
  );
}

function AccessNotice({
  title,
  message,
  actionHref,
  actionLabel,
}: {
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
      <Link
        href={actionHref}
        className="mt-4 inline-block rounded-xl bg-[#dd1567] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c21259]"
      >
        {actionLabel}
      </Link>
    </section>
  );
}
