"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DeleteCompanyModal } from "@/components/companies/delete-company-modal";
import type { CompanyWithJobCount } from "@/lib/services/companies";

// Data awal / demo jika tabel lokal masih kosong
const DEMO_COMPANIES: CompanyWithJobCount[] = [
  {
    id: "comp-1111-aaaa",
    name: "PT Nusantara Teknologi Inovasi",
    industry: "Teknologi Informasi & Software",
    location: "Jakarta Selatan, DKI Jakarta",
    website: "https://nusantaratekno.example.com",
    description: "Perusahaan pengembang solusi teknologi cerdas dan cloud terdepan.",
    size: "50-200 Karyawan",
    logo_path: null,
    status: "active",
    created_by: null,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    totalJobsCount: 4,
    activeJobsCount: 3,
  },
  {
    id: "comp-2222-bbbb",
    name: "PT Duplikasi Sejahtera Mitra (Duplikat)",
    industry: "Manufaktur & Logistik",
    location: "Bekasi, Jawa Barat",
    website: "https://duplikat-sejahtera.example.com",
    description: "Entitas perusahaan duplikat yang terdaftar dua kali oleh mitra.",
    size: "10-50 Karyawan",
    logo_path: null,
    status: "active",
    created_by: null,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    totalJobsCount: 2,
    activeJobsCount: 2,
  },
  {
    id: "comp-3333-cccc",
    name: "CV Mantan Mitra Karya (Tidak Lagi Bermitra)",
    industry: "Kreatif & Desain Grafis",
    location: "Bandung, Jawa Barat",
    website: "https://mantanmitra.example.com",
    description: "Mitra yang sudah menyelesaikan masa kontrak kerja sama dengan Kestara.",
    size: "5-20 Karyawan",
    logo_path: null,
    status: "active",
    created_by: null,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    totalJobsCount: 1,
    activeJobsCount: 1,
  },
];

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithJobCount[]>([]);
  const [loading, setLoading] = useState(true);
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
      // Perbarui tampilan secara instan (soft delete status)
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === selectedCompany.id
            ? { ...c, status: "deleted", activeJobsCount: 0 }
            : c,
        ),
      );
    }
    setFeedback({ type: "success", message });
    // Hilangkan notifikasi setelah 6 detik
    setTimeout(() => setFeedback(null), 6000);
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-[#176B62] transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-slate-400">Administrator</span>
          <span>/</span>
          <span className="font-semibold text-slate-800">Kelola Mitra Perusahaan</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Kelola Data Mitra Perusahaan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Panel Administrator untuk memoderasi, memverifikasi, dan menghapus entitas mitra
              yang terduplikasi atau sudah tidak aktif (KP-31).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#176B62] border border-emerald-100">
              Role: Administrator
            </span>
          </div>
        </div>

        {/* Toast / Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between animate-in fade-in duration-300 ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{feedback.type === "success" ? "✅" : "❌"}</span>
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 ml-4 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Tabel Perusahaan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Daftar Entitas Perusahaan Terdaftar ({companies.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              <span className="inline-block w-6 h-6 border-2 border-[#176B62]/20 border-t-[#176B62] rounded-full animate-spin mb-2" />
              <p>Memuat daftar perusahaan...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Belum ada data perusahaan terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Perusahaan</th>
                    <th className="px-6 py-4">Industri & Lokasi</th>
                    <th className="px-6 py-4">Lowongan Aktif</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map((company) => {
                    const isDeleted = company.status === "deleted";

                    return (
                      <tr
                        key={company.id}
                        className={`hover:bg-slate-50/50 transition-colors ${
                          isDeleted ? "opacity-60 bg-slate-50/40" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg shrink-0">
                              🏢
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                {company.name}
                              </div>
                              {company.website && (
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-[#176B62] hover:underline"
                                >
                                  {company.website}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-slate-800 font-medium">
                            {company.industry || "-"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {company.location || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            💼 {company.activeJobsCount} aktif ({company.totalJobsCount} total)
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {isDeleted ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              Dihapus (Soft Delete)
                            </span>
                          ) : company.status === "active" ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Ditangguhkan
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {isDeleted ? (
                            <span className="text-xs text-slate-400 italic">
                              Nonaktif
                            </span>
                          ) : (
                            /* Tombol Aksi Hapus Perusahaan (KP-32) */
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(company)}
                              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition-all cursor-pointer"
                            >
                              Hapus Perusahaan
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
