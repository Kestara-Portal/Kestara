'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { roleLabel } from '@/lib/auth/roles';
import type { OwnProfile } from '@/lib/services/profile-dto';

// ---------- Helper tampilan ----------
function formatTanggal(value: string | null, timeZone = 'Asia/Jakarta') {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  });
}

// Tanggal tanpa jam (kolom DATE) dibaca sebagai UTC agar tidak bergeser sehari.
function formatTanggalSaja(value: string | null) {
  return formatTanggal(value, 'UTC');
}

// URL dari pengguna hanya dijadikan link jika http(s), untuk mencegah javascript:.
function isSafeUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Menu mengikuti mockup. Hanya "Profil Saya" yang aktif di KP-15; menu lain
// adalah PBI lain sehingga dinonaktifkan dulu.
const MENU = [
  { label: 'Beranda', active: false },
  { label: 'Profil Saya', active: true },
  { label: 'Asesmen Karier', active: false },
  { label: 'Rekomendasi Pekerjaan', active: false },
  { label: 'Komunitas', active: false },
  { label: 'Mentorship', active: false },
  { label: 'Kirim Lamaran', active: false },
  { label: 'Simpan Pekerjaan', active: false },
];

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // KP-18: ambil data dari backend lalu tampilkan di halaman
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' });

        // Belum login -> arahkan ke halaman login Supabase
        if (res.status === 401) {
          router.replace('/auth/login');
          return;
        }

        const body = await res.json();

        if (!res.ok) {
          if (!cancelled) {
            setErrorMessage(body?.error?.message || 'Gagal memuat profil.');
          }
          return;
        }

        if (!cancelled) setProfile(body.data as OwnProfile);
      } catch {
        if (!cancelled) {
          setErrorMessage('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const initial = profile?.fullName?.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between bg-white border-r border-slate-200 p-6">
        <div>
          <div className="flex items-center gap-1.5 mb-10">
            <span className="text-3xl" aria-hidden="true">🧩</span>
            <span className="text-slate-900 text-2xl font-extrabold tracking-tight">Kestara</span>
          </div>

          <nav aria-label="Menu utama" className="space-y-1">
            {MENU.map((item) => (
              <div
                key={item.label}
                aria-current={item.active ? 'page' : undefined}
                className={
                  item.active
                    ? 'px-4 py-2.5 rounded-xl text-sm font-medium bg-[#176B62] text-white shadow-sm'
                    : 'px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed'
                }
              >
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#176B62] transition"
          >
            Keluar
          </button>
        </form>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-6 md:p-10">
        {/* Bar atas untuk layar kecil (sidebar disembunyikan) */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl" aria-hidden="true">🧩</span>
            <span className="text-slate-900 text-xl font-extrabold tracking-tight">Kestara</span>
          </div>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#176B62] transition"
            >
              Keluar
            </button>
          </form>
        </div>

        {/* LOADING */}
        {isLoading && (
          <p className="text-slate-500" role="status">
            Memuat profil...
          </p>
        )}

        {/* ERROR */}
        {!isLoading && errorMessage && (
          <div className="max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
            <h1 className="text-lg font-bold text-slate-900 mb-1">Profil tidak dapat dimuat</h1>
            <p className="text-sm text-slate-600 mb-4">{errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-[#176B62] hover:bg-[#145A53] text-white py-2.5 px-5 rounded-xl text-sm font-medium transition shadow-md focus:outline-none focus:ring-2 focus:ring-[#176B62] focus:ring-offset-2"
            >
              Muat ulang
            </button>
          </div>
        )}

        {/* PROFIL */}
        {!isLoading && !errorMessage && profile && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">
                Halo, {profile.fullName.split(' ')[0]} 👋
              </h1>
              <p className="text-slate-500">
                Periksa kembali data dirimu agar tetap benar dan terbaru.
              </p>
            </div>

            {/* Kartu data diri */}
            <section
              aria-labelledby="judul-data-diri"
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8"
            >
              <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-200">
                <div
                  aria-hidden="true"
                  className="h-16 w-16 shrink-0 rounded-full bg-[#176B62] text-white text-2xl font-bold flex items-center justify-center"
                >
                  {initial}
                </div>
                <div className="min-w-0">
                  <h2 id="judul-data-diri" className="text-xl font-bold text-slate-900 truncate">
                    {profile.fullName}
                  </h2>
                  <span className="inline-block mt-1 px-3 py-1 rounded-full bg-[#176B62]/10 text-[#176B62] text-xs font-semibold">
                    {roleLabel(profile.role)}
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <Field label="Nama lengkap" value={profile.fullName} />
                <Field label="Email" value={profile.email} />
                <Field label="Nomor telepon" value={profile.phoneNumber} />
                <Field label="Terdaftar sejak" value={formatTanggal(profile.createdAt)} />
                <Field label="Bio" value={profile.bio} wide />
              </dl>
            </section>

            {/* Kartu keahlian */}
            <section
              aria-labelledby="judul-keahlian"
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8"
            >
              <h2 id="judul-keahlian" className="text-lg font-bold text-slate-900 mb-4">
                Keahlian
              </h2>
              {profile.skills.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada keahlian.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <li
                      key={skill.id}
                      className="px-3 py-1.5 rounded-full border border-slate-300 text-sm text-slate-700"
                    >
                      {skill.name}
                      {skill.level ? (
                        <span className="text-slate-500"> · {skill.level}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Kartu portofolio */}
            <section
              aria-labelledby="judul-portofolio"
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8"
            >
              <h2 id="judul-portofolio" className="text-lg font-bold text-slate-900 mb-4">
                Portofolio
              </h2>
              {profile.portfolio.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada portofolio.</p>
              ) : (
                <ul className="space-y-4">
                  {profile.portfolio.map((item) => {
                    const mulai = formatTanggalSaja(item.startDate);
                    const selesai = formatTanggalSaja(item.endDate);
                    return (
                      <li key={item.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                        {(mulai || selesai) && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {mulai ?? '—'} – {selesai ?? 'sekarang'}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-sm text-slate-600 mt-1 break-words">{item.description}</p>
                        )}
                        {isSafeUrl(item.url) && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#176B62] font-medium hover:underline break-all"
                          >
                            {item.url}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

// Satu baris data diri. Jika value kosong, tampilkan "Belum diisi".
function Field({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-sm font-semibold text-slate-900 mb-1">{label}</dt>
      <dd className="text-sm text-slate-600 break-words">
        {value ? value : <span className="text-slate-500">Belum diisi</span>}
      </dd>
    </div>
  );
}
