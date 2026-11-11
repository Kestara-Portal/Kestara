"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DeleteCompanyModal } from "@/components/companies/delete-company-modal";
import type { CompanyWithJobCount } from "@/lib/services/companies";

// Demo data dengan detail realistis
const DEMO_COMPANIES: CompanyWithJobCount[] = [
  {
    id: "comp-1111-aaaa",
    name: "PT Nusantara Teknologi Inovasi",
    industry: "Teknologi Informasi & Cloud",
    location: "Jakarta Selatan, DKI Jakarta",
    website: "https://nusantaratekno.example.com",
    description: "Perusahaan pengembang solusi teknologi cerdas dan infrastruktur cloud terkemuka.",
    size: "50-200 Karyawan",
    logo_path: null,
    status: "active",
    created_by: null,
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    totalJobsCount: 4,
    activeJobsCount: 3,
  },
  {
    id: "comp-2222-bbbb",
    name: "PT Duplikasi Sejahtera Mitra",
    industry: "Logistik & Rantai Pasok",
    location: "Bekasi, Jawa Barat",
    website: "https://duplikat-sejahtera.example.com",
    description: "Entitas perusahaan terduplikasi yang didaftarkan ulang tanpa otorisasi mitra resmi.",
    size: "20-50 Karyawan",
    logo_path: null,
    status: "active",
    created_by: null,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    totalJobsCount: 2,
    activeJobsCount: 2,
  },
  {
    id: "comp-3333-cccc",
    name: "CV Mantan Mitra Karya",
    industry: "Desain Grafis & Media",
    location: "Bandung, Jawa Barat",
    website: "https://mantanmitra.example.com",
    description: "Mitra kerja sama periode 2024–2025 yang telah resmi mengakhiri nota kesepahaman.",
    size: "10-25 Karyawan",
    logo_path: null,
    status: "active",
    created_by: null,
    created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    totalJobsCount: 1,
    activeJobsCount: 1,
  },
  {
    id: "comp-4444-dddd",
    name: "PT Solusi Finansial Digital",
    industry: "Fintech & Pembayaran",
    location: "Tangerang, Banten",
    website: "https://solusifinansial.example.com",
    description: "Platform aggregator keuangan mikro inklusif untuk komunitas pencari kerja.",
    size: "100-500 Karyawan",
    logo_path: null,
    status: "active",
    created_by: null,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    totalJobsCount: 6,
    activeJobsCount: 5,
  },
];

type FilterTab = "all" | "active" | "deleted";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithJobCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  // State untuk modal konfirmasi penghapusan (KP-32)
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithJobCount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCompanies() {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data && Array.isArray(json.data) && json.data.length > 0) {
            setCompanies(json.data);
            setLoading(false);
            return;
          }
        }
        if (isMounted) {
          setCompanies(DEMO_COMPANIES);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setCompanies(DEMO_COMPANIES);
          setLoading(false);
        }
      }
    }

    loadCompanies();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & Search computation
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (activeTab === "active") return c.status === "active";
      if (activeTab === "deleted") return c.status === "deleted";
      return true;
    });
  }, [companies, searchQuery, activeTab]);

  // Statistik metrics ringkas
  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.status === "active").length;
    const deleted = companies.filter((c) => c.status === "deleted").length;
    const totalActiveJobs = companies
      .filter((c) => c.status === "active")
      .reduce((sum, c) => sum + (c.activeJobsCount || 0), 0);

    return { total, active, deleted, totalActiveJobs };
  }, [companies]);

  function handleOpenDeleteModal(company: CompanyWithJobCount) {
    setSelectedCompany(company);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedCompany(null);
  }

  function handleDeletionSuccess(message: string) {
    if (selectedCompany) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === selectedCompany.id
            ? { ...c, status: "deleted", activeJobsCount: 0 }
            : c,
        ),
      );
    }
    setFeedback({ type: "success", message });
    setTimeout(() => setFeedback(null), 6000);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Link href="/" className="hover:text-[#176B62] transition-colors">
            Beranda
          </Link>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span>Admin Portal</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="text-slate-700 font-semibold">Mitra Perusahaan</span>
        </nav>

        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-slate-200/80">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F3F1] text-[#176B62] border border-[#176B62]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#176B62] animate-pulse" />
                Administrator Panel
              </span>
              <span className="text-xs text-slate-400 font-medium">Modul E04-D</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Kelola Data Mitra Perusahaan
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Pantau dan kelola entitas perusahaan terdaftar di platform Kestara. Hapus perusahaan yang terduplikasi atau telah berhenti bermitra guna menjaga integritas lowongan kerja.
            </p>
          </div>
        </div>

        {/* Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Mitra</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">{stats.total}</p>
            <p className="text-[11px] text-slate-400">Entitas dalam basis data</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mitra Aktif</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums">{stats.active}</p>
            <p className="text-[11px] text-emerald-600/80 font-medium">Bermitra secara valid</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lowongan Terbuka</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#176B62] tabular-nums">{stats.totalActiveJobs}</p>
            <p className="text-[11px] text-slate-400">Sedang menerima pelamar</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dinonaktifkan</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tabular-nums">{stats.deleted}</p>
            <p className="text-[11px] text-rose-600/80 font-medium">Soft delete terverifikasi</p>
          </div>
        </div>

        {/* Floating Feedback Toast */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
              feedback.type === "success"
                ? "bg-emerald-50/90 border-emerald-200 text-emerald-900"
                : "bg-rose-50/90 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  feedback.type === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {feedback.type === "success" ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="6" />
                  </svg>
                )}
              </div>
              <span className="leading-snug">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Content Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Controls Toolbar: Search & Filter Tabs */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-slate-100/80 rounded-2xl self-start">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Semua ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "active"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Aktif ({stats.active})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("deleted")}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "deleted"
                    ? "bg-white text-rose-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Dihapus ({stats.deleted})
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, industri, kota..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#176B62]/20 focus:border-[#176B62] transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="6" />
                  </svg>
                </button>
              )}
            </div>

          </div>

          {/* Table Area */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#176B62]/20 border-t-[#176B62] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">Memuat data mitra perusahaan...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-700">Tidak ada perusahaan ditemukan</p>
              <p className="text-xs text-slate-400">
                Coba sesuaikan kata kunci pencarian Anda atau ubah filter tab di atas.
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-semibold text-[#176B62] hover:underline pt-1 cursor-pointer"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Perusahaan</th>
                    <th className="py-4 px-6">Bidang & Domisili</th>
                    <th className="py-4 px-6">Lowongan Aktif</th>
                    <th className="py-4 px-6">Status Akun</th>
                    <th className="py-4 px-6 text-right">Aksi Moderasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredCompanies.map((company) => {
                    const isDeleted = company.status === "deleted";
                    // Initial logo letter
                    const initials = company.name
                      .replace(/^PT\s+|^CV\s+/i, "")
                      .trim()
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={company.id}
                        className={`group transition-colors ${
                          isDeleted
                            ? "bg-slate-50/40 text-slate-400"
                            : "hover:bg-slate-50/70 text-slate-700"
                        }`}
                      >
                        {/* Nama Perusahaan & Avatar */}
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-11 h-11 rounded-2xl font-bold flex items-center justify-center shrink-0 text-sm tracking-wider shadow-xs border ${
                                isDeleted
                                  ? "bg-slate-100 text-slate-400 border-slate-200"
                                  : "bg-linear-to-br from-[#E8F3F1] to-[#D5ECE8] text-[#176B62] border-[#176B62]/20"
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="space-y-0.5">
                              <p className={`font-semibold tracking-tight ${isDeleted ? "text-slate-500 line-through" : "text-slate-900"}`}>
                                {company.name}
                              </p>
                              {company.website ? (
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-[#176B62] hover:underline inline-flex items-center gap-1 font-medium"
                                >
                                  <span>Kunjungi Situs</span>
                                  <svg className="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M7 17 17 7" />
                                    <path d="M7 7h10v10" />
                                  </svg>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Situs tidak dicantumkan</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Bidang & Domisili */}
                        <td className="py-4.5 px-6">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-800 text-xs sm:text-sm">
                              {company.industry || "-"}
                            </p>
                            <p className="text-xs text-slate-400 inline-flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span>{company.location || "-"}</span>
                            </p>
                          </div>
                        </td>

                        {/* Lowongan Kerja */}
                        <td className="py-4.5 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
                              isDeleted
                                ? "bg-slate-100 text-slate-400 border-slate-200"
                                : company.activeJobsCount > 0
                                ? "bg-amber-50 text-amber-800 border-amber-200/80"
                                : "bg-slate-50 text-slate-600 border-slate-200/70"
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                            <span>
                              {company.activeJobsCount} aktif / {company.totalJobsCount} total
                            </span>
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4.5 px-6">
                          {isDeleted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Nonaktif (Soft Delete)
                            </span>
                          ) : company.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Ditangguhkan
                            </span>
                          )}
                        </td>

                        {/* Tombol Aksi Hapus (KP-32) */}
                        <td className="py-4.5 px-6 text-right">
                          {isDeleted ? (
                            <span className="text-xs text-slate-400 font-medium italic">
                              Telah Dihapus
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(company)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200/80 hover:border-rose-600 rounded-xl transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                              <span>Hapus Perusahaan</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

      {/* Pop-up Dialog Konfirmasi Hapus Perusahaan (KP-32) */}
      {selectedCompany && (
        <DeleteCompanyModal
          isOpen={isModalOpen}
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          activeJobsCount={selectedCompany.activeJobsCount}
          onClose={handleCloseModal}
          onSuccess={handleDeletionSuccess}
        />
      )}
    </div>
  );
}
