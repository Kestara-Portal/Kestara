import Link from "next/link";
import { Suspense } from "react";

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
    <main className="min-h-screen bg-brand-soft px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6">
          <p className="text-sm font-semibold tracking-wide text-brand">KESTARA</p>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">Daftarkan Perusahaan</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Profil perusahaan menjadi identitas resmi untuk mulai memasang lowongan.
          </p>
        </header>

        <Suspense
          fallback={
            <p
              role="status"
              className="rounded-2xl border border-brand-soft bg-white p-6 text-sm text-neutral-600"
            >
              Memuat formulir…
            </p>
          }
        >
          <CompanyRegisterSection />
        </Suspense>

        <p className="mt-6 text-sm">
          <Link href="/" className="font-semibold text-brand hover:underline">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}

async function CompanyRegisterSection() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AccessNotice
        title="Anda belum masuk"
        message="Masuk sebagai rekruter atau administrator untuk mendaftarkan perusahaan."
        actionHref="/auth/login"
        actionLabel="Masuk"
      />
    );
  }

  if (user.role !== "admin" && user.role !== "recruiter") {
    return (
      <AccessNotice
        title="Akses ditolak"
        message="Hanya rekruter dan administrator yang dapat mendaftarkan perusahaan."
        actionHref="/"
        actionLabel="Kembali ke beranda"
      />
    );
  }

  return <CompanyRegisterForm />;
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
      className="rounded-2xl border border-brand-soft bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <p className="mt-1 text-sm text-neutral-600">{message}</p>
      <Link
        href={actionHref}
        className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
      >
        {actionLabel}
      </Link>
    </section>
  );
}
