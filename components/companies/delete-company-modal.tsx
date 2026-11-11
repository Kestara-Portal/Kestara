"use client";

import { useState } from "react";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Modal */}
        <div className="bg-red-50/70 border-b border-red-100 p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 text-xl font-bold">
            ⚠️
          </div>
          <div>
            <h3 id="modal-title" className="text-lg font-bold text-slate-900">
              Hapus Entitas Perusahaan
            </h3>
            <p className="text-xs text-red-600 font-medium mt-0.5">
              Tindakan ini memerlukan konfirmasi Administrator
            </p>
          </div>
        </div>

        {/* Isi / Pesan Konfirmasi */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus perusahaan{" "}
            <span className="font-semibold text-slate-900">&quot;{companyName}&quot;</span>?
          </p>

          {activeJobsCount > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <span className="font-bold">Perhatian:</span> Perusahaan ini memiliki{" "}
              <span className="font-semibold">{activeJobsCount} lowongan kerja aktif</span>.
              Jika dihapus, seluruh lowongan tersebut akan otomatis diubah statusnya menjadi{" "}
              <span className="font-semibold">Ditutup (Closed)</span> agar tidak lagi dapat
              dilamar.
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <span>Ya, Hapus Perusahaan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
