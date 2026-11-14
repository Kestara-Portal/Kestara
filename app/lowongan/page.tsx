import { VacancyList } from "./vacancy-list";

export const metadata = {
  title: "Daftar Lowongan — Kestara",
};

export default function VacanciesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-xs font-bold tracking-wider text-[#dd1567]">JOB PORTAL KESTARA</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            Temukan Lowongan Pekerjaan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lihat lowongan yang tersedia dan pilih peluang karier yang sesuai dengan minatmu.
          </p>
        </header>
        <VacancyList />
      </div>
    </main>
  );
}
