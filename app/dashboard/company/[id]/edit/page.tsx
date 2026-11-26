import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth/session";
import { getCompanyForEdit } from "@/lib/services/companies";
import { AppError } from "@/lib/utils/errors";
import type { CompanyRow } from "@/types/database";

import { CompanyEditForm } from "./company-edit-form";

/**
 * KP-27 / E04-U: edit a company profile.
 *
 * Cache Components pattern: the page shell (header + card frame) is static and
 * prerenders, while the session read, the authorization check, and the company
 * fetch stream in behind the Suspense boundary below.
 */
export default function CompanyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2"
          >
            <span aria-hidden="true" className="text-2xl">
              🧩
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Kestara
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2"
          >
            Kembali ke dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<EditPageSkeleton />}>
          <CompanyEditContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function CompanyEditContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  let company: CompanyRow;
  try {
    company = await getCompanyForEdit(id, user);
  } catch (error) {
    if (error instanceof AppError && error.status === 403) {
      return <AccessDeniedPanel />;
    }
    if (error instanceof AppError && (error.status === 404 || error.status === 400)) {
      return <CompanyNotFoundPanel />;
    }
    throw error;
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#176B62]">
          Profil Perusahaan
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Perbarui Data Perusahaan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Perubahan yang disimpan akan langsung tampil pada halaman lowongan yang dilihat
          pelamar.
        </p>
      </div>

      <CompanyEditForm company={company} />
    </>
  );
}

function EditPageSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Memuat data perusahaan…</span>
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-4 w-80 animate-pulse rounded bg-slate-200" />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="space-y-5">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccessDeniedPanel() {
  return (
    <section
      role="alert"
      aria-labelledby="akses-ditolak"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8"
    >
      <h1 id="akses-ditolak" className="text-xl font-bold text-slate-900">
        Anda tidak berhak mengubah perusahaan ini
      </h1>
      <p className="mt-2 text-sm text-slate-700">
        Hanya rekruter yang terdaftar sebagai anggota aktif perusahaan, atau administrator,
        yang dapat memperbarui profil perusahaan. Jika menurut Anda ini keliru, hubungi
        administrator Kestara.
      </p>
      <Link
        href="/dashboard"
        className="mt-5 inline-flex rounded-xl bg-[#176B62] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#12554e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2"
      >
        Kembali ke dashboard
      </Link>
    </section>
  );
}

function CompanyNotFoundPanel() {
  return (
    <section
      role="alert"
      aria-labelledby="perusahaan-tidak-ada"
      className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      <h1 id="perusahaan-tidak-ada" className="text-xl font-bold text-slate-900">
        Perusahaan tidak ditemukan
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Data perusahaan ini tidak tersedia, sudah dihapus, atau tautannya tidak valid.
      </p>
      <Link
        href="/dashboard"
        className="mt-5 inline-flex rounded-xl bg-[#176B62] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#12554e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2"
      >
        Kembali ke dashboard
      </Link>
    </section>
  );
}
