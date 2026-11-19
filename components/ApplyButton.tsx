'use client';

import { useState } from 'react';

type Props = { jobId: string; jobTitle: string };

export default function ApplyButton({ jobId, jobTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  function close() {
    setOpen(false);
    setResult(null);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      if (res.ok) {
        setResult({ ok: true, text: 'Lamaran berhasil dikirim.' });
      } else if (res.status === 401) {
        setResult({ ok: false, text: 'Silakan masuk terlebih dahulu.' });
      } else if (res.status === 403) {
        setResult({ ok: false, text: 'Hanya pencari kerja yang dapat melamar.' });
      } else {
        setResult({ ok: false, text: 'Lamaran belum bisa dikirim. Coba lagi nanti.' });
      }
    } catch {
      setResult({ ok: false, text: 'Terjadi gangguan jaringan. Coba lagi nanti.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[#176B62] px-8 py-3.5 font-medium text-white shadow-md transition hover:bg-[#12554e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2"
      >
        Lamar Sekarang
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="apply-title" className="text-lg font-bold text-slate-900">
              Kirim lamaran?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Kamu akan mengirim lamaran untuk posisi <b>{jobTitle}</b>. Data profil dan
              berkasmu akan diteruskan untuk proses seleksi.
            </p>

            {result && (
              <p
                role="status"
                className={`mt-4 text-sm ${result.ok ? 'text-[#176B62]' : 'text-red-700'}`}
              >
                {result.text}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                {result?.ok ? 'Tutup' : 'Batal'}
              </button>
              {!result?.ok && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="rounded-lg bg-[#176B62] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {submitting ? 'Mengirim...' : 'Ya, kirim'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}