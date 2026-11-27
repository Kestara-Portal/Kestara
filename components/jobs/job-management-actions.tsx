"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface JobManagementActionsProps {
  jobId: string;
  jobTitle: string;
  status: string;
}

export function JobManagementActions({
  jobId,
  jobTitle,
  status,
}: JobManagementActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isClosed = status === "closed";

  async function handleCloseJob() {
    if (!confirm(`Apakah Anda yakin ingin menutup lowongan "${jobTitle}"? Pencari kerja tidak akan bisa melamar lagi.`)) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || "Gagal menutup lowongan.");
      }

      setSuccessMessage("Lowongan berhasil ditutup.");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteJob() {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || "Gagal menghapus lowongan.");
      }

      setShowDeleteModal(false);
      alert(`Lowongan "${jobTitle}" berhasil dihapus.`);
      router.push("/lowongan");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Aksi Pengelola (Rekruter / Admin)
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isClosed
              ? "bg-amber-100 text-amber-800"
              : status === "published"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {isClosed ? "Ditutup" : status === "published" ? "Aktif" : status}
        </span>
      </div>

      {errorMessage && (
        <div className="mb-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-3 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!isClosed && (
          <button
            type="button"
            disabled={loading}
            onClick={handleCloseJob}
            className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "🔒 Tutup Lowongan"}
          </button>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={() => setShowDeleteModal(true)}
          className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "🗑️ Hapus Lowongan"}
        </button>
      </div>

      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus Lowongan</h3>
            <p className="mt-2 text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus lowongan <strong>{jobTitle}</strong>? Tindakan ini akan menghapus lowongan dari daftar lowongan aktif bagi pencari kerja.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDeleteJob}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? "Menghapus..." : "Ya, Hapus Lowongan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
