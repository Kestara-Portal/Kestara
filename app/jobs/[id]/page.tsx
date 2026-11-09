import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const instant = false;

const prisma = new PrismaClient();

async function getJobDetail(jobId: number) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: true,
    },
  });
  return job;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const jobId = parseInt(resolvedParams.id);
  
  const job = await getJobDetail(jobId);

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Lowongan */}
        <div className="mb-8">
          <Link href="/jobs" className="text-sm text-slate-500 hover:text-[#dd1567] mb-4 inline-block">
            ← Kembali ke daftar lowongan
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
            <span className="flex items-center gap-1">📍 {job.company.location}</span>
            <span className="flex items-center gap-1">💼 {job.type}</span>
            {job.salary && <span className="flex items-center gap-1">💰 {job.salary}</span>}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* KOLOM KIRI: Detail Lowongan */}
          <div className="w-full lg:w-2/3 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Deskripsi Pekerjaan</h2>
            <div className="prose text-slate-600 max-w-none whitespace-pre-wrap mb-8">
              {job.description}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">Persyaratan</h2>
            <div className="prose text-slate-600 max-w-none whitespace-pre-wrap">
              {job.requirements}
            </div>

            <button className="mt-10 w-full md:w-auto bg-[#dd1567] hover:bg-[#c21259] text-white py-3.5 px-8 rounded-xl font-medium transition-all shadow-md">
              Lamar Pekerjaan Ini
            </button>
          </div>

          {/* KOLOM KANAN: Detail Perusahaan (Fokus PBI) */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 border-b pb-2">
                Tentang Perusahaan
              </h3>
              
              <div className="flex items-center gap-4 mb-6">
                {/* Placeholder Logo */}
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-2xl border border-slate-200 overflow-hidden">
                  {job.company.logo ? (
                    <img src={job.company.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    "🏢"
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{job.company.name}</h4>
                  <p className="text-sm text-[#dd1567] font-medium">{job.company.industry}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 mb-1">Lokasi</span>
                  <p className="text-sm text-slate-700">{job.company.location}</p>
                </div>
                {job.company.size && (
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 mb-1">Ukuran Perusahaan</span>
                    <p className="text-sm text-slate-700">{job.company.size}</p>
                  </div>
                )}
                {job.company.website && (
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 mb-1">Situs Web</span>
                    <a href={job.company.website} target="_blank" rel="noreferrer" className="text-sm text-[#dd1567] hover:underline">
                      Kunjungi Website ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <span className="block text-xs font-semibold text-slate-400 mb-2">Profil Singkat</span>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {job.company.description}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}