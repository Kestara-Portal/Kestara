import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth/session";
import { getMyApplications } from "@/lib/services/applications";

import { ApplicationsList } from "./applications-list";

/**
 * KP-63 / E05-D: the jobseeker's application history.
 *
 * Cache Components pattern: the page shell prerenders, while the session read
 * and the application query stream in behind the Suspense boundary.
 */
export default function JobseekerApplicationsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2"
          >
            <span aria-hidden="true" className="text-2xl">
              🧩
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">Kestara</span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2"
          >
            Kembali ke dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#176B62]">
            Lamaran Saya
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Riwayat Lamaran</h1>
          <p className="mt-2 text-sm text-slate-600">
            Pantau status lamaranmu. Lamaran yang masih diproses dapat kamu batalkan.
          </p>
        </div>

        <Suspense fallback={<ApplicationsSkeleton />}>
          <ApplicationsContent />
        </Suspense>
      </main>
    </div>
  );
}

async function ApplicationsContent() {
  // Request-time boundary: the session read must never be baked into the static
  // shell (a build without Supabase env would otherwise prerender a redirect).
  await connection();

  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "jobseeker") {
    return (
      <section
        role="alert"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-slate-700"
      >
        Halaman ini hanya tersedia untuk akun pencari kerja. Masuk dengan akun pencari kerja
        untuk melihat riwayat lamaran.
      </section>
    );
  }

  const applications = await getMyApplications(user);

  return <ApplicationsList initialApplications={applications} />;
}

function ApplicationsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Memuat daftar lamaran…</span>
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-3 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
