import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import BlindScreeningView from "@/components/features/recruiter/blind-screening-view";
import { getBlindApplicantsForJob } from "@/lib/services/blind-profile";

interface ApplicantsPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function ApplicantsPage({
  params,
}: ApplicantsPageProps) {
  const currentUser = await requireRole(["recruiter", "admin"]);

  const { jobId } = await params;
  const { job, applicants } = await getBlindApplicantsForJob(jobId, currentUser.role);

  // Compute summary stats
  const totalApplicants = applicants.length;
  const validScores = applicants
    .map((a) => a.matchScore)
    .filter((s): s is number => typeof s === "number");
  const avgScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length)
      : null;

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation & Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <Link href="/" className="hover:text-brand">
              KESTARA
            </Link>
            <span>/</span>
            <span className="text-brand font-semibold">REKRUTER</span>
            <span>/</span>
            <span>SCREENING PELAMAR</span>
          </div>

          <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                {job.title}
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Screening pelamar untuk lowongan ID: <span className="font-mono text-xs">{jobId}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand-dark">
                <span className="h-2 w-2 rounded-full bg-brand"></span>
                Mode Profil Tersamar Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Blind Profile Educational Banner */}
        <div className="rounded-2xl border border-brand/20 bg-brand-soft p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-brand-dark">
                Blind Recruitment: Seleksi Objektif Berbasis Kompetensi
              </h2>
              <p className="text-sm text-neutral-700 leading-relaxed">
                Untuk mencegah bias kognitif dan diskriminasi tak sadar, identitas pribadi pelamar (nama lengkap, foto, usia, jenis kelamin, dan kontak pribadi) disembunyikan secara ketat di sisi server.
              </p>
              <p className="text-xs text-neutral-600">
                Penyaringan kandidat difokuskan pada kecocokan keterampilan, rekam jejak portofolio, dan kompetensi teknis. Identitas akan dibuka setelah kandidat lolos ke tahap wawancara.
              </p>
            </div>
          </div>
        </div>

        {/* Screening Metrics Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Total Pelamar
            </p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
              {totalApplicants}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Berkas pelamar tersamar aktif
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Rata-rata Skor Kecocokan
            </p>
            <p className="mt-1 text-2xl font-bold text-brand">
              {avgScore !== null ? `${avgScore}%` : "-"}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Dihitung dari bobot kebutuhan keterampilan
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Kebutuhan Keterampilan
            </p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
              {job.requiredSkills.length}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Kriteria kompetensi terverifikasi
            </p>
          </div>
        </div>

        {/* Screening View and Candidates List */}
        <BlindScreeningView job={job} initialApplicants={applicants} />
      </div>
    </main>
  );
}
