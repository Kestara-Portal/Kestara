"use client";

import { useState, useTransition } from "react";

import { setAccountStatusAction } from "@/lib/auth/admin-actions";
import type { AccountStatus } from "@/lib/validations/admin";

interface UserStatusButtonProps {
  userId: string;
  userName: string;
  currentStatus: AccountStatus;
  isCurrentUser: boolean;
}

export function UserStatusButton({
  userId,
  userName,
  currentStatus,
  isCurrentUser,
}: UserStatusButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [violationReason, setViolationReason] = useState("Pelanggaran pedoman komunitas Kestara");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (isCurrentUser) {
    return (
      <span className="text-xs italic text-slate-400">
        (Akun Anda)
      </span>
    );
  }

  const handleStatusChange = (newStatus: AccountStatus) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await setAccountStatusAction(userId, newStatus);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
        setIsOpen(false);
      } else {
        setFeedback({ type: "error", message: res.message });
      }
    });
  };

  return (
    <div className="relative inline-block text-left">
      {currentStatus === "active" ? (
        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          Nonaktifkan Akun
        </button>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatusChange("active")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {isPending ? "Memproses..." : "Pulihkan Akun"}
        </button>
      )}

      {/* Danger Confirmation Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div>
                <h3 id="modal-title" className="text-lg font-bold text-slate-900">
                  Konfirmasi Penonaktifan Akun Pelanggar
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan pencegahan untuk menjaga keamanan dan kenyamanan komunitas platform.
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-700">
              Apakah Anda yakin ingin menonaktifkan akun milik{" "}
              <strong className="text-slate-900">{userName}</strong> karena melanggar ketentuan
              layanan?
            </p>

            <div className="mt-4">
              <label
                htmlFor="reason"
                className="block text-xs font-semibold text-slate-700"
              >
                Kategori / Alasan Pelanggaran Ketentuan:
              </label>
              <select
                id="reason"
                value={violationReason}
                onChange={(e) => setViolationReason(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#dd1567] focus:outline-none focus:ring-1 focus:ring-[#dd1567]"
              >
                <option value="Pelanggaran pedoman komunitas Kestara">
                  Pelanggaran pedoman komunitas Kestara
                </option>
                <option value="Spam atau aktivitas mencurigakan">
                  Spam atau aktivitas mencurigakan
                </option>
                <option value="Penyalahgunaan data atau identitas palsu">
                  Penyalahgunaan data atau identitas palsu
                </option>
                <option value="Perilaku tidak pantas / pelecehan di platform">
                  Perilaku tidak pantas / pelecehan di platform
                </option>
              </select>
            </div>

            <div className="mt-3 rounded-lg border border-red-100 bg-red-50/70 p-3 text-xs text-slate-600">
              <strong className="text-red-700">Dampak Penonaktifan:</strong> Pengguna tidak akan dapat
              masuk, memperbarui profil, melamar lowongan, atau berinteraksi di forum. Riwayat
              data pengguna tetap tersimpan sesuai kebijakan retensi platform.
            </div>

            {feedback?.type === "error" && (
              <p className="mt-3 rounded-lg bg-red-100 p-2 text-xs text-red-700">
                {feedback.message}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setIsOpen(false);
                  setFeedback(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleStatusChange("deactivated")}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
              >
                {isPending ? "Menonaktifkan..." : "Ya, Nonaktifkan Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
