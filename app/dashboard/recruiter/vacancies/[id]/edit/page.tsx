import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { AppShell } from "@/components/layout/app-shell";
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
 */
export default function VacancyEditPage({ params }: VacancyEditPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Memuat data lowongan…</p>
        </div>
      }
    >
      <VacancyEditPageContent params={params} />
    </Suspense>
  );
}

async function VacancyEditPageContent({ params }: VacancyEditPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <AppShell user={user} title="Ubah Lowongan" activePath="/lowongan">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6">
          <p className="text-xs font-bold tracking-wider text-[#dd1567]">KESTARA</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Ubah Lowongan</h1>
          <p className="mt-1 text-sm text-slate-600">
            Perbarui detail, kualifikasi, dan status lowongan perusahaan Anda.
          </p>
        </header>

        <Suspense
          fallback={
            <p
              role="status"
              className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600"
            >
              Memuat data lowongan…
            </p>
          }
        >
          <VacancyEditSection params={params} user={user} />
        </Suspense>
      </main>
    </AppShell>
  );
}

async function VacancyEditSection({
  params,
  user,
}: VacancyEditPageProps & { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }) {
  const { id } = await params;

  if (!vacancyIdSchema.safeParse(id).success) {
    return <Notice title="Lowongan tidak ditemukan" message="ID lowongan tidak valid." />;
  }

  if (user.role !== "admin" && user.role !== "recruiter") {
    return (
      <Notice
        title="Akses ditolak"
        message="Hanya rekruter dan administrator yang dapat mengubah lowongan."
        actionHref="/dashboard"
        actionLabel="Kembali ke beranda"
      />
    );
  }

  let vacancy: JobVacancyRow | null = null;
  let loadError: AppError | null = null;

  try {
    vacancy = await getVacancyForEdit(id, user, await supabaseVacancyDeps());
  } catch (error) {
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
    <section role="alert" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-block rounded-xl bg-[#dd1567] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c21259]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
