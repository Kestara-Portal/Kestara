import ApplyButton from "@/components/ApplyButton";

// Halaman DEMO untuk KP-52. Data lowongan hardcoded, bukan dari database.
// Hapus/ganti setelah halaman detail lowongan (KP-47) tersedia di Supabase.
const demoJob = {
  id: "demo-1",
  title: "Frontend Developer",
  company: "Kestara Technology",
  location: "Jakarta",
  type: "Full Time",
  description: "Membangun antarmuka web Kestara menggunakan Next.js dan Tailwind CSS.",
  requirements: "Memahami React dan TypeScript.\nTerbiasa bekerja dengan Git.",
};

export default function JobDemoPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{demoJob.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {demoJob.company} · {demoJob.location} · {demoJob.type}
        </p>

        <h2 className="mt-8 text-lg font-bold text-slate-900">Deskripsi Pekerjaan</h2>
        <p className="mt-2 text-slate-600">{demoJob.description}</p>

        <h2 className="mt-6 text-lg font-bold text-slate-900">Persyaratan</h2>
        <p className="mt-2 whitespace-pre-wrap text-slate-600">{demoJob.requirements}</p>

        <div className="mt-8">
          <ApplyButton jobId={demoJob.id} jobTitle={demoJob.title} />
        </div>
      </div>
    </main>
  );
}