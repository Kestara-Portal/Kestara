"use client";

import { useMemo, useState } from "react";
import ApplicantCard from "@/components/features/recruiter/applicant-card";
import MatchScore from "@/components/features/recruiter/match-score";
import type {
  BlindApplicantProfile,
  JobScreeningInfo,
} from "@/lib/services/blind-profile";

interface BlindScreeningViewProps {
  job: JobScreeningInfo;
  initialApplicants: BlindApplicantProfile[];
}

type SortOption = "score-desc" | "score-asc" | "newest";
type StatusFilter = "all" | "screening" | "review" | "interview" | "rejected";

export default function BlindScreeningView({
  job,
  initialApplicants,
}: BlindScreeningViewProps) {
  const [applicants, setApplicants] = useState<BlindApplicantProfile[]>(initialApplicants);
  const [selectedApplicant, setSelectedApplicant] = useState<BlindApplicantProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("score-desc");
  const [searchSkill, setSearchSkill] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Status badge style helper
  function getStatusBadge(status: BlindApplicantProfile["status"]) {
    switch (status) {
      case "screening":
        return {
          label: "Tahap Screening",
          className: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "interview":
        return {
          label: "Lolos ke Wawancara",
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "review":
        return {
          label: "Sedang Ditinjau",
          className: "bg-blue-50 text-blue-800 border-blue-200",
        };
      case "rejected":
        return {
          label: "Tidak Lolos",
          className: "bg-neutral-100 text-neutral-600 border-neutral-200",
        };
      default:
        return {
          label: status,
          className: "bg-neutral-100 text-neutral-700 border-neutral-200",
        };
    }
  }

  // Handle status update simulation
  function handleUpdateStatus(
    applicantId: string,
    newStatus: BlindApplicantProfile["status"],
  ) {
    setApplicants((prev) =>
      prev.map((app) =>
        app.id === applicantId ? { ...app, status: newStatus } : app,
      ),
    );

    const target = applicants.find((a) => a.id === applicantId);
    const code = target?.candidateCode || "Kandidat";

    if (newStatus === "interview") {
      setActionNotice(`${code} berhasil diloloskan ke tahap wawancara.`);
    } else if (newStatus === "rejected") {
      setActionNotice(`${code} ditandai tidak memenuhi kualifikasi screening.`);
    } else {
      setActionNotice(`Status ${code} diperbarui.`);
    }

    setTimeout(() => {
      setActionNotice(null);
    }, 4000);
  }

  // Filter and sort applicants
  const filteredApplicants = useMemo(() => {
    return applicants
      .filter((app) => {
        if (statusFilter !== "all" && app.status !== statusFilter) {
          return false;
        }
        if (searchSkill.trim()) {
          const query = searchSkill.trim().toLowerCase();
          const hasSkill = app.skills.some((s) =>
            s.name.toLowerCase().includes(query),
          );
          if (!hasSkill) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score-desc") {
          return (b.matchScore ?? -1) - (a.matchScore ?? -1);
        }
        if (sortBy === "score-asc") {
          return (a.matchScore ?? 999) - (b.matchScore ?? 999);
        }
        if (sortBy === "newest") {
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        }
        return 0;
      });
  }, [applicants, statusFilter, sortBy, searchSkill]);

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-brand/30 bg-brand-soft px-4 py-3 text-sm font-medium text-brand-dark shadow-sm flex items-center justify-between"
        >
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-brand-dark/70 hover:text-brand-dark text-xs underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Filter and Controls Toolbar */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Skill Search */}
          <div className="flex-1 max-w-md">
            <label htmlFor="skill-search" className="block text-xs font-semibold uppercase text-neutral-600 mb-1">
              Cari Berdasarkan Keterampilan
            </label>
            <input
              id="skill-search"
              type="text"
              value={searchSkill}
              onChange={(e) => setSearchSkill(e.target.value)}
              placeholder="Contoh: React, TypeScript, Vitest..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-xs font-semibold uppercase text-neutral-600 mb-1">
              Status Lamaran
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="all">Semua Status ({applicants.length})</option>
              <option value="screening">Tahap Screening</option>
              <option value="review">Sedang Ditinjau</option>
              <option value="interview">Lolos ke Wawancara</option>
              <option value="rejected">Tidak Lolos</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sort-by" className="block text-xs font-semibold uppercase text-neutral-600 mb-1">
              Urutkan
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="score-desc">Skor Tertinggi ke Terendah</option>
              <option value="score-asc">Skor Terendah ke Tertinggi</option>
              <option value="newest">Lamaran Terbaru</option>
            </select>
          </div>
        </div>

        {/* Quick Requirement Skills Tags */}
        {job.requiredSkills.length > 0 && (
          <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">
              Keterampilan Dibutuhkan Lowongan:
            </span>
            {job.requiredSkills.map((req) => (
              <button
                key={req.skillName}
                type="button"
                onClick={() => setSearchSkill(req.skillName)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  searchSkill.toLowerCase() === req.skillName.toLowerCase()
                    ? "bg-brand text-white border-brand font-semibold"
                    : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-brand-soft hover:text-brand-dark"
                }`}
              >
                {req.skillName} {req.weight ? `(Bobot: ${req.weight})` : ""}
              </button>
            ))}
            {searchSkill && (
              <button
                type="button"
                onClick={() => setSearchSkill("")}
                className="text-xs text-brand hover:underline font-medium ml-2"
              >
                Reset filter keterampilan
              </button>
            )}
          </div>
        )}
      </div>

      {/* Applicants List */}
      <div className="space-y-4">
        {filteredApplicants.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-neutral-900">
              Tidak ada pelamar yang sesuai
            </h3>
            <p className="mt-1 text-sm text-neutral-500 max-w-md mx-auto">
              Tidak ditemukan kandidat dengan kriteria filter yang dipilih. Coba atur ulang filter pencarian keterampilan atau status.
            </p>
          </div>
        ) : (
          filteredApplicants.map((applicant) => {
            const statusInfo = getStatusBadge(applicant.status);
            return (
              <ApplicantCard key={applicant.id}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Masked Identity & Skills */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Masked Alias Badge */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-100 text-neutral-900 font-mono font-semibold text-sm border border-neutral-300">
                        <svg
                          className="h-4 w-4 text-brand"
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
                        {applicant.candidateCode}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>

                      {/* Blind Mode Guarantee Pill */}
                      <span className="text-xs text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                        Blind Profile Terproteksi
                      </span>
                    </div>

                    {/* Qualifications Summary */}
                    <p className="text-sm text-neutral-700 leading-relaxed">
                      {applicant.experienceSummary}
                    </p>

                    {/* Metadata details */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-neutral-500">
                      <span>Pendidikan: <strong>{applicant.educationLevel}</strong></span>
                      <span>•</span>
                      <span>Pengalaman: <strong>{applicant.experienceYears} tahun</strong></span>
                      <span>•</span>
                      <span>
                        Melamar pada:{" "}
                        {new Date(applicant.appliedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Candidate Skills Breakdown */}
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-neutral-600 mb-1.5">
                        Keterampilan Pelamar:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {applicant.skills.map((skill) => (
                          <span
                            key={skill.name}
                            className={`text-xs px-2.5 py-0.5 rounded-md border font-medium ${
                              skill.isMatched
                                ? "bg-brand-soft text-brand-dark border-brand/30"
                                : "bg-neutral-50 text-neutral-600 border-neutral-200"
                            }`}
                          >
                            {skill.isMatched && (
                              <span className="mr-1 text-brand font-bold">✓</span>
                            )}
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Match Score & Screening Actions */}
                  <div className="flex flex-col items-start md:items-end justify-between self-stretch md:min-w-[200px] border-t md:border-t-0 md:border-l border-neutral-100 pt-3 md:pt-0 md:pl-5 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold mb-1">
                        Kesesuaian Kebutuhan
                      </p>
                      <MatchScore displayValue={applicant.matchScoreDisplay} />
                    </div>

                    <div className="flex flex-wrap md:flex-col gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setSelectedApplicant(applicant)}
                        className="flex-1 md:w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition"
                      >
                        Lihat Berkas Tersamar
                      </button>

                      {applicant.status !== "interview" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(applicant.id, "interview")}
                          className="flex-1 md:w-full rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-hover transition"
                        >
                          Loloskan ke Wawancara
                        </button>
                      )}

                      {applicant.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(applicant.id, "rejected")}
                          className="flex-1 md:w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-red-700 transition"
                        >
                          Tolak
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </ApplicantCard>
            );
          })
        )}
      </div>

      {/* Modal: Full Blind Profile Detail */}
      {selectedApplicant && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-candidate-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-neutral-900 bg-neutral-100 px-3 py-1 rounded-md border border-neutral-300">
                  {selectedApplicant.candidateCode}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-brand-soft text-brand-dark border border-brand/20">
                  Blind Profile Mode
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Tutup jendela"
              >
                ✕
              </button>
            </div>

            {/* Privacy Shield Notice */}
            <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft p-4 text-xs text-neutral-700">
              <p className="font-semibold text-brand-dark mb-1">
                Jaminan Privasi & Seleksi Bebas Bias
              </p>
              <p>
                Seluruh data PII (nama lengkap, foto profil, jenis kelamin, usia, dan kontak pribadi) disaring di server dan tidak dikirimkan ke perangkat peramban. Identitas kandidat hanya akan dibuka pada tahap wawancara sesuai ketentuan Kestara.
              </p>
            </div>

            {/* Score and Stats */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50">
                <p className="text-xs text-neutral-500 font-medium">Skor Kecocokan</p>
                <p className="mt-1 text-xl font-bold text-brand">
                  {selectedApplicant.matchScoreDisplay ?? "Belum dihitung"}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50">
                <p className="text-xs text-neutral-500 font-medium">Pengalaman Kerja</p>
                <p className="mt-1 text-base font-semibold text-neutral-800">
                  {selectedApplicant.experienceYears} Tahun
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50 col-span-2 md:col-span-1">
                <p className="text-xs text-neutral-500 font-medium">Pendidikan</p>
                <p className="mt-1 text-sm font-semibold text-neutral-800">
                  {selectedApplicant.educationLevel}
                </p>
              </div>
            </div>

            {/* Ringkasan */}
            <div className="mt-5">
              <h4 className="text-sm font-bold text-neutral-900 mb-2">
                Ringkasan Kompetensi
              </h4>
              <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                {selectedApplicant.experienceSummary}
              </p>
            </div>

            {/* Matched Skills */}
            <div className="mt-5">
              <h4 className="text-sm font-bold text-neutral-900 mb-2">
                Keterampilan & Kesesuaian Kualifikasi
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedApplicant.skills.map((s) => (
                  <span
                    key={s.name}
                    className={`text-xs px-3 py-1 rounded-md border font-medium ${
                      s.isMatched
                        ? "bg-brand-soft text-brand-dark border-brand/40 font-semibold"
                        : "bg-neutral-100 text-neutral-700 border-neutral-200"
                    }`}
                  >
                    {s.isMatched ? "✓ Sesuai: " : ""}
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Portofolio Anonim */}
            {selectedApplicant.portfolio.length > 0 && (
              <div className="mt-5">
                <h4 className="text-sm font-bold text-neutral-900 mb-2">
                  Portofolio & Proyek Teknis (Tersamar)
                </h4>
                <div className="space-y-3">
                  {selectedApplicant.portfolio.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-neutral-200 p-3.5 bg-neutral-50"
                    >
                      <h5 className="text-sm font-semibold text-neutral-900">
                        {item.title}
                      </h5>
                      <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
                        {item.description}
                      </p>
                      {item.techStack.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="text-[11px] bg-white border border-neutral-200 px-2 py-0.5 rounded text-neutral-600 font-mono"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Tutup
              </button>
              {selectedApplicant.status !== "interview" && (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(selectedApplicant.id, "interview");
                    setSelectedApplicant(null);
                  }}
                  className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover"
                >
                  Loloskan ke Wawancara
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
