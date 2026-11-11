"use client";

import { useEffect, useState } from "react";

interface DeleteCompanyModalProps {
  isOpen: boolean;
  companyId: string;
  companyName: string;
  activeJobsCount?: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function DeleteCompanyModal({
  isOpen,
  companyId,
  companyName,
  activeJobsCount = 0,
  onClose,
  onSuccess,
}: DeleteCompanyModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  async function handleDelete() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Gagal menghapus entitas perusahaan.");
      }

      onSuccess(
        result.data?.message ||
          `Perusahaan "${companyName}" berhasil dihapus dan lowongan terkait telah ditutup.`,
      );
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      {/* Backdrop with modern subtle blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 transition-all scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-linear-to-r from-rose-500 via-rose-600 to-amber-500" />

        <div className="p-7 sm:p-8 space-y-6">
          {/* Header section with badge icon & close button */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                </svg>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100 mb-1">
                  Aksi Administratif
                </span>
                <h3 id="modal-headline" className="text-xl font-bold text-slate-900 tracking-tight">
                  Hapus Entitas Perusahaan
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors cursor-pointer"
              aria-label="Tutup dialog"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Body message */}
          <div className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Anda akan menghapus profil perusahaan{" "}
              <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                {companyName}
              </span>
              . Data akan dinonaktifkan secara aman (<span className="italic font-medium">soft delete</span>) dari pencarian dan portal publik.
            </p>

            {/* Warning callout for active job listings */}
            {activeJobsCount > 0 ? (
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-amber-900">
                    Dampak Lowongan Kerja ({activeJobsCount} Aktif)
                  </p>
                  <p className="text-amber-700 leading-relaxed">
                    Perusahaan ini memiliki lowongan yang sedang tayang. Sistem akan otomatis menutup (<span className="font-medium">closed</span>) seluruh lowongan tersebut agar tidak lagi menerima pelamar baru.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center gap-2.5 text-xs text-slate-500">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Perusahaan ini tidak memiliki lowongan kerja yang sedang aktif.</span>
              </div>
            )}

            {/* Error banner if deletion fails */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
                <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Action buttons footer */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
                  <span>Ya, Hapus Perusahaan</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
