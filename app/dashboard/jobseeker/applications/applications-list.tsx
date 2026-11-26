"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  applicationStatusLabel,
  type MyApplication,
} from "@/lib/services/application-dto";
import { WITHDRAWAL_REASON_MAX } from "@/lib/validations/application";

interface ApplicationsListProps {
  initialApplications: MyApplication[];
}

type Toast = { tone: "success" | "error"; message: string };

const BADGE_STYLES: Record<MyApplication["status"], string> = {
  submitted: "bg-[#176B62]/10 text-[#12554e] border-[#176B62]/30",
  under_review: "bg-amber-50 text-amber-800 border-amber-200",
  shortlisted: "bg-sky-50 text-sky-800 border-sky-200",
  rejected: "bg-rose-50 text-rose-800 border-rose-200",
  withdrawn: "bg-slate-100 text-slate-600 border-slate-300",
  cancelled: "bg-slate-100 text-slate-600 border-slate-300",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export function ApplicationsList({ initialApplications }: ApplicationsListProps) {
  const [applications, setApplications] = useState<MyApplication[]>(initialApplications);
  const [target, setTarget] = useState<MyApplication | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!target) return;

    confirmButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        setTarget(null);
        setReason("");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [target, isSubmitting]);

  function openConfirm(application: MyApplication) {
    setToast(null);
    setTarget(application);
    setReason("");
  }

  function closeConfirm() {
    if (isSubmitting) return;
    setTarget(null);
    setReason("");
  }

  function markWithdrawn(id: string) {
    setApplications((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "withdrawn",
              statusLabel: applicationStatusLabel("withdrawn"),
              withdrawable: false,
            }
          : item,
      ),
    );
  }

  async function handleWithdraw() {
    if (!target) return;

    const application = target;
    const trimmedReason = reason.trim();
    const previous = applications;

    setIsSubmitting(true);
    // Optimistic: the badge flips immediately, then reconciles with the server.
    markWithdrawn(application.id);

    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmedReason.length > 0 ? trimmedReason : null }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setApplications(previous);
        // Close the dialog so the failure banner above the list is visible;
        // keeping it open would hide the message behind the overlay.
        setTarget(null);
        setReason("");
        setToast({
          tone: "error",
          message:
            body?.error?.message ?? "Lamaran tidak dapat dibatalkan. Silakan coba lagi.",
        });
        return;
      }

      setToast({ tone: "success", message: "Lamaran berhasil dibatalkan." });
      setTarget(null);
      setReason("");
    } catch {
      setApplications(previous);
      setTarget(null);
      setReason("");
      setToast({
        tone: "error",
        message: "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">Belum ada lamaran</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Lamaran yang kamu kirim akan muncul di sini beserta statusnya.
        </p>
        <Link
          href="/lowongan"
          className="mt-5 inline-flex rounded-xl bg-[#176B62] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#12554e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2"
        >
          Lihat lowongan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div
          role={toast.tone === "success" ? "status" : "alert"}
          aria-live="polite"
          className={
            toast.tone === "success"
              ? "flex items-start justify-between gap-3 rounded-xl border border-[#176B62]/30 bg-[#176B62]/10 px-4 py-3 text-sm text-[#12554e]"
              : "flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          }
        >
          <span className="flex items-start gap-2">
            <span aria-hidden="true">{toast.tone === "success" ? "✓" : "!"}</span>
            <span>{toast.message}</span>
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="rounded-md px-1 text-xs font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62]"
          >
            Tutup
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {applications.map((application) => (
          <li
            key={application.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-900">
                  {application.jobTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {application.companyName ?? "Perusahaan tidak tersedia"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Dilamar pada {formatDate(application.submittedAt)}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${BADGE_STYLES[application.status]}`}
                >
                  {application.statusLabel}
                </span>

                {application.withdrawable ? (
                  <button
                    type="button"
                    onClick={() => openConfirm(application)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
                  >
                    Batalkan Lamaran
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">
                    {application.status === "withdrawn"
                      ? "Sudah dibatalkan"
                      : "Tidak dapat dibatalkan"}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-title"
          aria-describedby="withdraw-description"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-7">
            <h2 id="withdraw-title" className="text-lg font-bold text-slate-900">
              Batalkan lamaran ini?
            </h2>
            <p id="withdraw-description" className="mt-2 text-sm text-slate-600">
              Apakah Anda yakin ingin menarik lamaran untuk posisi{" "}
              <span className="font-semibold text-slate-900">{target.jobTitle}</span>?
              Lamaran akan berstatus <span className="font-medium">Dibatalkan</span> dan tidak
              dapat dikirim ulang otomatis.
            </p>

            <div className="mt-4">
              <label
                htmlFor="withdraw-reason"
                className="mb-1.5 block text-sm font-semibold text-slate-900"
              >
                Alasan (opsional)
              </label>
              <textarea
                id="withdraw-reason"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={WITHDRAWAL_REASON_MAX}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-1"
                placeholder="Misalnya: sudah menerima tawaran lain."
              />
              <p className="mt-1.5 text-xs text-slate-500">
                {reason.trim().length}/{WITHDRAWAL_REASON_MAX} karakter
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Tidak, kembali
              </button>
              <button
                type="button"
                ref={confirmButtonRef}
                onClick={handleWithdraw}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isSubmitting ? "Membatalkan…" : "Ya, batalkan lamaran"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
