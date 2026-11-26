"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { type AuthActionState, signUpAction } from "@/lib/auth/actions";

const initialState: AuthActionState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [role, setRole] = useState<"jobseeker" | "mentor" | "recruiter">("jobseeker");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen bg-white text-slate-800 font-sans">
      {/* PANEL KIRI (FORM) */}
      <div className="w-full md:w-[50%] p-8 md:p-16 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="text-3xl font-bold text-brand flex items-center gap-2">
              <span className="text-3xl">🧩</span>
              <span className="text-slate-900 text-2xl font-extrabold tracking-tight">Kestara</span>
            </div>
          </div>

          {/* Judul */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Daftar ke Kestara</h1>
          <p className="text-slate-500 mb-6">Mulai perjalanan karier yang lebih adil.</p>

          {/* Toggle Role */}
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mb-6 max-w-md">
            <button
              type="button"
              onClick={() => setRole("jobseeker")}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                role === "jobseeker"
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pencari Kerja
            </button>
            <button
              type="button"
              onClick={() => setRole("mentor")}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                role === "mentor"
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mentor
            </button>
            <button
              type="button"
              onClick={() => setRole("recruiter")}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                role === "recruiter"
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rekruter
            </button>
          </div>

          {state.error ? (
            <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-danger border border-red-200">
              {state.error}
            </p>
          ) : null}

          <form action={formAction} className="space-y-4 max-w-md" noValidate>
            {/* Hidden role input yang sinkron dengan toggle */}
            <input type="hidden" name="role" value={role} />

            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nama lengkap
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="Masukkan nama lengkap Anda"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
              />
              {state.fieldErrors?.fullName ? (
                <p className="mt-1 text-xs text-danger">{state.fieldErrors.fullName}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@email.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
              />
              {state.fieldErrors?.email ? (
                <p className="mt-1 text-xs text-danger">{state.fieldErrors.email}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
              {state.fieldErrors?.password ? (
                <p className="mt-1 text-xs text-danger">{state.fieldErrors.password}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-brand hover:bg-brand-hover text-white py-3.5 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-60 cursor-pointer"
            >
              {pending ? "Memproses..." : "Buat Akun"} <span>→</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center md:text-left mt-6">
          <p className="text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="text-brand font-semibold hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>

      {/* PANEL KANAN (PROMOSI & VISUAL BRAND) */}
      <div className="hidden md:flex md:w-[50%] bg-slate-50 relative overflow-hidden flex-col justify-between p-16">
        {/* Background Visual */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute right-0 top-0 bottom-0 w-[45%] bg-brand opacity-90 rounded-l-[100px] transform translate-x-20 z-10" />
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#dd1567_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="absolute bottom-0 right-0 w-[80%] h-[75%] border-t-[30px] border-l-[30px] border-white/20 rounded-tl-[120px] bg-gradient-to-tr from-slate-100 to-white flex items-end justify-end p-8">
            <div className="w-[85%] h-[85%] rounded-tl-[90px] border-t-[16px] border-l-[16px] border-brand/10 bg-slate-50 overflow-hidden relative">
              <div className="absolute right-0 bottom-0 top-0 w-2/5 bg-brand rounded-l-[80px]" />
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
              Mulai langkah baru. <br />
              <span className="text-brand">Raih karier impianmu.</span>
            </h2>
            <p className="text-slate-600 text-lg">
              Kestara mendukung keterbukaan dan kesempatan setara untuk semua talenta.
            </p>
          </div>

          <div />
        </div>
      </div>
    </div>
  );
}
