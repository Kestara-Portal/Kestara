"use client";

import { useEffect, useState } from "react";
import type { Vacancy, VacancyPage } from "@/lib/vacancies/mock-data";

const PAGE_SIZE = 6;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function VacancyCard({ v }: { v: Vacancy }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div>
        <h2 className="text-base font-bold text-slate-900">{v.title}</h2>
        <p className="text-sm text-slate-600">{v.companyName}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{v.location}</span>
        <span className="rounded-full bg-[#dd1567]/10 px-2.5 py-1 font-medium text-[#dd1567]">
          {v.employmentType}
        </span>
        {v.noExperienceRequired && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
            Tanpa syarat pengalaman
          </span>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-xs text-slate-500">Diposting {formatDate(v.postedAt)}</span>
        <a
          href={`/lowongan/${v.id}`}
          className="rounded-lg bg-[#dd1567] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#b8104f]"
        >
          Lihat Detail
        </a>
      </div>
    </article>
  );
}

export function VacancyList() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<VacancyPage | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [retry, setRetry] = useState(0);

  function goToPage(n: number) {
    if (n === page) return;
    setStatus("loading");
    setPage(n);
  }

  function retryLoad() {
    setStatus("loading");
    setRetry((n) => n + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/lowongan?page=${page}&limit=${PAGE_SIZE}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat");
        return res.json() as Promise<VacancyPage>;
      })
      .then((data) => {
        setResult(data);
        setStatus("ok");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, [page, retry]);

  if (status === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Lowongan gagal dimuat.{" "}
        <button className="font-semibold underline" onClick={retryLoad}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (status === "loading" && !result) {
    return (
      <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    );
  }

  if (!result || result.total === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Belum ada lowongan yang tersedia saat ini.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <p className="text-sm text-slate-500">
        Menampilkan {result.data.length} dari {result.total} lowongan
      </p>
      <div className={`grid gap-4 md:grid-cols-2 ${status === "loading" ? "opacity-60" : ""}`}>
        {result.data.map((v) => (
          <VacancyCard key={v.id} v={v} />
        ))}
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Penomoran halaman">
        <button
          onClick={() => goToPage(result.page - 1)}
          disabled={result.page <= 1}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Sebelumnya
        </button>
        {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => goToPage(n)}
            aria-current={n === result.page ? "page" : undefined}
            className={`h-9 w-9 rounded-lg border text-sm ${n === result.page
                ? "border-[#dd1567] bg-[#dd1567] font-semibold text-white"
                : "border-slate-300 bg-white hover:border-[#dd1567]"
              }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => goToPage(result.page + 1)}
          disabled={result.page >= result.totalPages}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Berikutnya
        </button>
      </nav>
    </section>
  );
}
