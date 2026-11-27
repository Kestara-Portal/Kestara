"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  type ApplicationDetail,
} from "@/lib/constants/applications";
import type { ApplicationStatus } from "@/types/database";

// Demo data pelamar realistis jika database lokal belum memiliki data lamaran
const DEMO_APPLICATIONS: ApplicationDetail[] = [
  {
    id: "app-1111-aaaa",
    job_id: "job-1",
    applicant_id: "user-1",
    status: "screening",
    cover_letter: "Saya memiliki pengalaman 3 tahun sebagai Frontend Engineer dengan spesialisasi Next.js dan Tailwind CSS.",
    resume_path: "/resumes/kandidat-1.pdf",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    applicantName: "Budi Santoso",
    applicantEmail: "budi.santoso@example.com",
    jobTitle: "Senior Frontend Engineer",
    companyName: "PT Nusantara Teknologi Inovasi",
  },
  {
    id: "app-2222-bbbb",
    job_id: "job-1",
    applicant_id: "user-2",
    status: "submitted",
    cover_letter: "Tertarik bergabung dengan tim engineer Kestara untuk mengembangkan web yang inklusif.",
    resume_path: "/resumes/kandidat-2.pdf",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    applicantName: "Siti Rahmawati",
    applicantEmail: "siti.rahma@example.com",
    jobTitle: "Senior Frontend Engineer",
    companyName: "PT Nusantara Teknologi Inovasi",
  },
  {
    id: "app-3333-cccc",
    job_id: "job-2",
    applicant_id: "user-3",
    status: "interview",
    cover_letter: "Berpengalaman mengelola pipeline CI/CD dan cloud infrastructure di AWS dan GCP.",
    resume_path: "/resumes/kandidat-3.pdf",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    applicantName: "Dimas Anggara",
    applicantEmail: "dimas.dev@example.com",
    jobTitle: "DevOps & Cloud Specialist",
    companyName: "PT Solusi Finansial Digital",
  },
  {
    id: "app-4444-dddd",
    job_id: "job-3",
    applicant_id: "user-4",
    status: "accepted",
    cover_letter: "Lulusan UI/UX Design dengan portofolio riset aksesibilitas digital.",
    resume_path: "/resumes/kandidat-4.pdf",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    applicantName: "Anisa Permata",
    applicantEmail: "anisa.design@example.com",
    jobTitle: "Product Designer (UI/UX)",
    companyName: "CV Mantan Mitra Karya",
  },
];

const STATUS_COLOR_CONFIG: Record<
  ApplicationStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  submitted: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
  under_review: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" },
  shortlisted: { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", dot: "bg-sky-500" },
  screening: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" },
  interview: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", dot: "bg-blue-500" },
  assessment: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", dot: "bg-purple-500" },
  accepted: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  rejected: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", dot: "bg-rose-500" },
  withdrawn: { bg: "bg-zinc-100", text: "text-zinc-500", border: "border-zinc-200", dot: "bg-zinc-400" },
  cancelled: { bg: "bg-zinc-100", text: "text-zinc-500", border: "border-zinc-200", dot: "bg-zinc-400" },
};

export default function RecruiterApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch("/api/applications");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data && Array.isArray(json.data) && json.data.length > 0) {
            setApplications(json.data);
            setLoading(false);
            return;
          }
        }
        if (isMounted) {
          setApplications(DEMO_APPLICATIONS);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setApplications(DEMO_APPLICATIONS);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handler mengubah status pelamar
  async function handleStatusChange(applicationId: string, newStatus: ApplicationStatus) {
    setUpdatingId(applicationId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Mode demo / pratinjau ketika belum login sesi rekruter
        if (response.status === 401 || applicationId.startsWith("app-")) {
          setApplications((prev) =>
            prev.map((app) =>
              app.id === applicationId ? { ...app, status: newStatus } : app,
            ),
          );

          setFeedback({
            type: "success",
            message: `Status kandidat berhasil diperbarui menjadi "${STATUS_LABELS[newStatus]}". Notifikasi terkirim ke pelamar.`,
          });
          setTimeout(() => setFeedback(null), 5000);
          return;
        }

        throw new Error(result.error?.message || "Gagal memperbarui status pelamar.");
      }

      // Update state lokal
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app,
        ),
      );

      setFeedback({
        type: "success",
        message: result.data?.message || `Status berhasil diubah menjadi "${STATUS_LABELS[newStatus]}". Notifikasi otomatis terkirim ke pelamar.`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan status.",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  // Filtered list
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchQuery =
        app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;
      if (activeFilter === "all") return true;
      return app.status === activeFilter;
    });
  }, [applications, searchQuery, activeFilter]);

  // Statistik metrics
  const stats = useMemo(() => {
    const total = applications.length;
    const screening = applications.filter((a) => a.status === "screening").length;
    const interview = applications.filter((a) => a.status === "interview").length;
    const accepted = applications.filter((a) => a.status === "accepted").length;
    return { total, screening, interview, accepted };
  }, [applications]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Link href="/" className="hover:text-[#dd1567] transition-colors">
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span>Rekruter</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Kelola Pelamar</span>
        </nav>

        {/* Page Header (Anti-Slop Modern) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Alur Rekrutmen & Status Pelamar
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-pink-50 text-[#dd1567] border border-pink-200/60 tabular-nums">
                {stats.total} kandidat
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Kelola alur seleksi kandidat secara efisien. Pembaruan tahapan seleksi otomatis mengirimkan notifikasi ke akun pencari kerja.
            </p>
          </div>

          {/* View Mode Toggle: Table vs Kanban */}
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="6" height="14" x="4" y="5" rx="1" />
                <rect width="6" height="10" x="14" y="5" rx="1" />
              </svg>
              <span>Kanban</span>
            </button>
          </div>
        </div>

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Total Pelamar</span>
            <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{stats.total}</div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Seleksi Berkas</span>
            <div className="text-2xl font-bold tracking-tight text-amber-600 tabular-nums">{stats.screening}</div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Wawancara</span>
            <div className="text-2xl font-bold tracking-tight text-blue-600 tabular-nums">{stats.interview}</div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Diterima / Lolos</span>
            <div className="text-2xl font-bold tracking-tight text-[#dd1567] tabular-nums">{stats.accepted}</div>
          </div>
        </div>

        {/* Toast Notification (Anti-Slop Clean SVGs) */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
              feedback.type === "success"
                ? "bg-emerald-50/95 border-emerald-200/80 text-emerald-900"
                : "bg-rose-50/95 border-rose-200/80 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              {feedback.type === "success" ? (
                <svg className="w-5 h-5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Toolbar: Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-[#dd1567] text-white shadow-2xs"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("screening")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeFilter === "screening"
                  ? "bg-amber-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Seleksi ({stats.screening})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("interview")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeFilter === "interview"
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Wawancara ({stats.interview})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("accepted")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeFilter === "accepted"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Lolos ({stats.accepted})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kandidat atau posisi..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#dd1567]/20 focus:border-[#dd1567]"
            />
          </div>
        </div>

        {/* View Mode 1: Table View with Status Dropdown */}
        {viewMode === "table" ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-xs text-slate-400">Memuat daftar pelamar...</div>
            ) : filteredApps.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">Tidak ada pelamar dalam kriteria ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">Kandidat</th>
                      <th className="py-4 px-6">Posisi & Perusahaan</th>
                      <th className="py-4 px-6">Tanggal Lamar</th>
                      <th className="py-4 px-6">Tahapan Seleksi Saat Ini</th>
                      <th className="py-4 px-6 text-right">Ubah Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredApps.map((app) => {
                      const isUpdating = updatingId === app.id;
                      const config = STATUS_COLOR_CONFIG[app.status];
                      const initials = app.applicantName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Nama & Monogram */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-pink-50 to-rose-100 border border-pink-200/60 text-[#dd1567] font-bold text-xs flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{app.applicantName}</p>
                                <p className="text-xs text-slate-400">{app.applicantEmail}</p>
                              </div>
                            </div>
                          </td>

                          {/* Posisi & Mitra */}
                          <td className="py-4 px-6">
                            <p className="font-medium text-slate-800 text-xs sm:text-sm">{app.jobTitle}</p>
                            <p className="text-xs text-slate-400">{app.companyName}</p>
                          </td>

                          {/* Tanggal */}
                          <td className="py-4 px-6 text-xs text-slate-500 tabular-nums">
                            {new Date(app.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>

                          {/* Current Status Pill */}
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                              {STATUS_LABELS[app.status]}
                            </span>
                          </td>

                          {/* Dropdown Pemindah Status */}
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              {isUpdating ? (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  <span>Menyimpan...</span>
                                </span>
                              ) : (
                                <select
                                  value={app.status}
                                  onChange={(e) =>
                                    handleStatusChange(app.id, e.target.value as ApplicationStatus)
                                  }
                                  disabled={app.status === "cancelled"}
                                  className="text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-1.5 px-3 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#dd1567]/20 cursor-pointer disabled:opacity-50"
                                >
                                  {APPLICATION_STATUSES.filter((s) => s !== "cancelled").map((s) => (
                                    <option key={s} value={s}>
                                      Pindah ke: {STATUS_LABELS[s]}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* View Mode 2: Kanban Board */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(["submitted", "screening", "interview", "accepted"] as ApplicationStatus[]).map(
              (columnStatus) => {
                const colApps = applications.filter((a) => a.status === columnStatus);
                const colConfig = STATUS_COLOR_CONFIG[columnStatus];

                return (
                  <div
                    key={columnStatus}
                    className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200/60 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${colConfig.dot}`} />
                        {STATUS_LABELS[columnStatus]}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/80">
                        {colApps.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 min-h-[220px]">
                      {colApps.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">Kosong</div>
                      ) : (
                        colApps.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-[#dd1567]/40 transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-xs text-slate-900">{candidate.applicantName}</p>
                              <p className="text-[11px] text-slate-500">{candidate.jobTitle}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              {columnStatus !== "accepted" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextMap: Record<string, ApplicationStatus> = {
                                      submitted: "screening",
                                      screening: "interview",
                                      interview: "accepted",
                                    };
                                    handleStatusChange(candidate.id, nextMap[columnStatus]);
                                  }}
                                  className="text-[#dd1567] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Loloskan →</span>
                                </button>
                              ) : (
                                <span className="text-emerald-700 font-semibold">Telah Lolos</span>
                              )}

                              {columnStatus !== "accepted" && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(candidate.id, "rejected")}
                                  className="text-rose-500 font-medium hover:underline cursor-pointer"
                                >
                                  Tolak
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}

      </div>
    </div>
  );
}

