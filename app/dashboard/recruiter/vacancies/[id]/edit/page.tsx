import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { supabaseVacancyDeps } from "@/lib/services/vacancies-deps";
import { getVacancyForEdit } from "@/lib/services/vacancies";
import { AppError } from "@/lib/utils/errors";
import type { JobVacancyRow } from "@/types/database";

import { VacancyEditForm } from "./vacancy-edit-form";

type VacancyEditPageProps = { params: Promise<{ id: string }> };

const vacancyIdSchema = z.uuid();

/**
 * E02-U — Vacancy edit page.
 *
 * The page shell is static; `params` and the session are read inside <Suspense>
 * (Cache Components pattern). The vacancy is loaded through the same use case
 * the API uses, so the company-scope check cannot drift between them.
 */
export default function VacancyEditPage({ params }: VacancyEditPageProps) {
  return (
    <main className="min-h-screen bg-brand-soft px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6">
          <p className="text-sm font-semibold tracking-wide text-brand">KESTARA</p>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">Ubah Lowongan</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Perbarui detail, kualifikasi, dan status lowongan perusahaan Anda.
          </p>
        </header>

        <Suspense
          fallback={
            <p
              role="status"
              className="rounded-2xl border border-brand-soft bg-white p-6 text-sm text-neutral-600"
            >
              Memuat data lowongan…
            </p>
          }
        >
          <VacancyEditSection params={params} />
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

async function VacancyEditSection({ params }: VacancyEditPageProps) {
  const { id } = await params;

  if (!vacancyIdSchema.safeParse(id).success) {
    return <Notice title="Lowongan tidak ditemukan" message="ID lowongan tidak valid." />;
  }

  const user = await getCurrentUser();

  if (!user) {
    return (
      <Notice
        title="Anda belum masuk"
        message="Masuk sebagai rekruter atau administrator untuk mengubah lowongan."
        actionHref="/auth/login"
        actionLabel="Masuk"
      />
    );
  }

  if (user.role !== "admin" && user.role !== "recruiter") {
    return (
      <Notice
        title="Akses ditolak"
        message="Hanya rekruter dan administrator yang dapat mengubah lowongan."
        actionHref="/"
        actionLabel="Kembali ke beranda"
      />
    );
  }

  let vacancy: JobVacancyRow | null = null;
  let loadError: AppError | null = null;

  try {
    vacancy = await getVacancyForEdit(id, user, await supabaseVacancyDeps());
  } catch (error) {
    // Unexpected failures bubble up to the framework error boundary.
    if (!(error instanceof AppError)) throw error;
    loadError = error;
  }

  if (!vacancy) {
    return (
      <Notice
        title="Lowongan tidak dapat dibuka"
        message={loadError?.message ?? "Lowongan tidak ditemukan."}
      />
    );
  }

  return <VacancyEditForm vacancy={vacancy} />;
}

function Notice({
  title,
  message,
  actionHref,
  actionLabel,
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section role="alert" className="rounded-2xl border border-brand-soft bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <p className="mt-1 text-sm text-neutral-600">{message}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
