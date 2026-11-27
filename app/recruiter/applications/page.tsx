import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

import RecruiterApplicationsClient from "./recruiter-applications-client";

export const metadata = {
  title: "Kelola Lamaran — Kestara",
};

export default function RecruiterApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Memuat data lamaran…</p>
        </div>
      }
    >
      <RecruiterApplicationsContent />
    </Suspense>
  );
}

async function RecruiterApplicationsContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <AppShell user={user} title="Kelola Lamaran" activePath="/recruiter/applications">
      <RecruiterApplicationsClient />
    </AppShell>
  );
}
