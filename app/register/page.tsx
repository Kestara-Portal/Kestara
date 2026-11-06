'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  // State untuk menyimpan data form
  const [role, setRole] = useState<'pencari' | 'mentor' | 'rekruter'>('pencari');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi untuk mengirim data ke API
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Registrasi berhasil! Silakan login.');
        router.push('/login'); // Arahkan ke halaman login
      } else {
        alert(data.message || 'Gagal mendaftar');
      }
    } catch (error) {
      alert('Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-slate-800 font-sans">
      {/* PANEL KIRI (FORM) */}
      <div className="w-full md:w-[50%] p-8 md:p-16 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="text-3xl font-bold text-[#dd1567] flex items-center gap-1.5">
              <span className="text-3xl">🧩</span> 
              <span className="text-slate-900 text-2xl font-extrabold tracking-tight">Kestara</span>
            </div>
          </div>

          {/* Judul */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Daftar ke Kestara</h1>
          <p className="text-slate-500 mb-8">Mulai perjalanan karier yang lebih adil.</p>

          {/* Toggle Role */}
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mb-8 max-w-md">
            <button
              type="button"
              onClick={() => setRole('pencari')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                role === 'pencari'
                  ? 'bg-[#dd1567] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pencari Kerja
            </button>
            <button
              type="button"
              onClick={() => setRole('mentor')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                role === 'mentor'
                  ? 'bg-[#dd1567] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mentor
            </button>
            <button
              type="button"
              onClick={() => setRole('rekruter')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                role === 'rekruter'
                  ? 'bg-[#dd1567] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rekruter
            </button>
          </div>

          {/* Form */}
          <form className="space-y-5 max-w-md" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-semibold text-slate-850 mb-2">Nama lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your name here!"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#dd1567] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-850 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your Email here!"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#dd1567] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-850 mb-2">Kata sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#dd1567] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  
                </button>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="agreement"
                required
                className="mt-1 accent-[#dd1567] h-4 w-4 rounded border-slate-300 text-[#dd1567] focus:ring-[#dd1567]"
              />
              <label htmlFor="agreement" className="text-xs text-slate-500 leading-relaxed">
                Saya menyetujui <span className="text-[#dd1567] font-medium hover:underline cursor-pointer">Pemrosesan data pribadi</span> sesuai <span className="text-[#dd1567] font-medium hover:underline cursor-pointer">UU Perlindungan Data Pribadi</span>.
              </label>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#dd1567] hover:bg-[#c21259] disabled:opacity-70 text-white py-3.5 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? 'Memproses...' : 'Buat Akun'} <span>→</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center md:text-left mt-8">
          <p className="text-sm text-slate-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-[#dd1567] font-semibold hover:underline cursor-pointer">
              Masuk
            </Link>
          </p>
        </div>
      </div>

      {/* PANEL KANAN (GAMBAR & PROMOSI) */}
      <div className="hidden md:flex md:w-[50%] bg-slate-50 relative overflow-hidden flex-col justify-between p-16">
        {/* Background Visual */}
        <div className="absolute inset-0 z-0">
          <div className="absolute right-0 top-0 bottom-0 w-[45%] bg-[#dd1567] opacity-90 rounded-l-[100px] transform translate-x-20 z-10" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#dd1567_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="absolute bottom-0 right-0 w-[80%] h-[75%] border-t-[30px] border-l-[30px] border-white/20 rounded-tl-[120px] bg-gradient-to-tr from-slate-100 to-white flex items-end justify-end p-8">
            <div className="w-[85%] h-[85%] rounded-tl-[90px] border-t-[16px] border-l-[16px] border-[#dd1567]/10 bg-slate-50 overflow-hidden relative">
              <div className="absolute right-0 bottom-0 top-0 w-2/5 bg-[#dd1567] rounded-l-[80px]" />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Label atas */}
          <div className="text-right text-xs font-semibold text-slate-400 tracking-wider">
            Platform Karier Inklusif
          </div>

          {/* Copywriting */}
          <div className="max-w-md">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Lebih banyak potensi. <br />
              <span className="text-[#dd1567]">Lebih banyak kesempatan.</span>
            </h2>
            <p className="text-slate-600 text-lg">
              Karier yang lebih adil untuk semua.
            </p>
          </div>

          <div />
        </div>
      </div>
    </div>
  );
}