import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import ApplyButton from "@/components/ApplyButton";
import { JobManagementActions } from "@/components/jobs/job-management-actions";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface CompanyData {
  id: string;
  name: string;
  logo_path?: string | null;
  logo?: string | null;
  industry: string;
  location: string;
  website?: string | null;
  size?: string | null;
  description?: string | null;
}

interface JobData {
  id: string;
  title: string;
  type: string;
  location?: string | null;
  salary?: string | null;
  description: string;
  requirements: string;
  status: string;
  company: CompanyData;
}

async function getJobDetail(jobId: string): Promise<JobData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      type,
      location,
      salary,
      description,
      requirements,
      status,
      companies (
        id,
        name,
        logo_path,
        industry,
        location,
        website,
        size,
        description
      )
    `)
    .eq("id", jobId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const rawCompany = Array.isArray(data.companies) ? data.companies[0] : data.companies;

  const company: CompanyData = rawCompany
    ? {
        ...rawCompany,
        logo: rawCompany.logo_path || null,
        industry: rawCompany.industry || "Umum",
        location: rawCompany.location || data.location || "-",
      }
    : {
        id: "",
        name: "Perusahaan",
        logo_path: null,
        logo: null,
        industry: "Umum",
        location: data.location || "-",
        website: null,
        size: null,
        description: "",
      };

  return {
    id: data.id,
    title: data.title,
    type: data.type || "Full-time",
    location: data.location || company.location,
    salary: data.salary,
    description: data.description || "",
    requirements: data.requirements || "",
    status: data.status || "published",
    company,
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const jobId = resolvedParams.id;

  const [job, currentUser] = await Promise.all([
    getJobDetail(jobId),
    getCurrentUser(),
  ]);

  if (!job) {
    notFound();
  }

  const isClosed = job.status === "closed";
  const isArchived = job.status === "archived";
  const canManage = currentUser?.role === "admin" || currentUser?.role === "recruiter";

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Lowongan */}
        <div className="mb-8">
          <Link href="/lowongan" className="text-sm text-slate-500 hover:text-[#dd1567] mb-4 inline-block">
            ← Kembali ke daftar lowongan
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isClosed
                      ? "bg-amber-100 text-amber-800"
                      : isArchived
                      ? "bg-rose-100 text-rose-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isClosed ? "Ditutup" : isArchived ? "Diarsipkan" : "Aktif"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                <span className="flex items-center gap-1">📍 {job.location || job.company.location}</span>
                <span className="flex items-center gap-1">💼 {job.type}</span>
                {job.salary && <span className="flex items-center gap-1">💰 {job.salary}</span>}
              </div>
            </div>

            {/* Aksi Khusus Recruiter / Admin */}
            {canManage && (
              <div className="w-full md:w-auto">
                <JobManagementActions
                  jobId={job.id}
                  jobTitle={job.title}
                  status={job.status}
                />
              </div>
            )}
          </div>
        </div>

        {/* Notifikasi Status Lowongan Tertutup */}
        {isClosed && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <p className="text-sm font-medium">
                Lowongan ini telah <strong>ditutup</strong> oleh pengelola. Pencari kerja tidak dapat lagi mengirimkan lamaran untuk posisi ini.
              </p>
            </div>
          </div>
        )}

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

            <div className="mt-10">
              {isClosed ? (
                <button
                  type="button"
                  disabled
                  className="rounded-xl bg-slate-200 px-8 py-3.5 font-medium text-slate-500 cursor-not-allowed"
                >
                  Lowongan Ditutup
                </button>
              ) : isArchived ? (
                <button
                  type="button"
                  disabled
                  className="rounded-xl bg-slate-200 px-8 py-3.5 font-medium text-slate-500 cursor-not-allowed"
                >
                  Lowongan Tidak Aktif
                </button>
              ) : (
                <ApplyButton jobId={job.id} jobTitle={job.title} />
              )}
            </div>
          </div>

          {/* KOLOM KANAN: Detail Perusahaan */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 border-b pb-2">
                Tentang Perusahaan
              </h3>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-2xl border border-slate-200 overflow-hidden">
                  {job.company.logo_path || job.company.logo ? (
                    <img
                      src={job.company.logo_path || job.company.logo || ""}
                      alt={job.company.name}
                      className="w-full h-full object-cover"
                    />
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
