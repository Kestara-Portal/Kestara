import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

import { VacancyList } from "./vacancy-list";

export const metadata = {
  title: "Daftar Lowongan — Kestara",
};

export default async function VacanciesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <AppShell user={user} title="Lowongan Pekerjaan" activePath="/lowongan">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <p className="text-xs font-bold tracking-wider text-brand">JOB PORTAL KESTARA</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            Temukan Lowongan Pekerjaan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lihat lowongan yang tersedia dan pilih peluang karier yang sesuai dengan minatmu.
          </p>
        </header>
        <VacancyList />
      </main>
    </AppShell>
  );
}
