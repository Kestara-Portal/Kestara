"use client";

import Link from "next/link";
import { useActionState } from "react";

import { type AuthActionState, signUpAction } from "@/lib/auth/actions";

const initialState: AuthActionState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-soft px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-brand-soft bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold tracking-wide text-brand">KESTARA</p>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">Daftar ke Kestara</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Mulai perjalanan karier yang lebih adil.
          </p>
        </div>

        {state.error ? (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <form action={formAction} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-neutral-800">
              Nama lengkap
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {state.fieldErrors?.fullName ? (
              <p className="mt-1 text-sm text-danger">{state.fieldErrors.fullName}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-800">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {state.fieldErrors?.email ? (
              <p className="mt-1 text-sm text-danger">{state.fieldErrors.email}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-800">
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {state.fieldErrors?.password ? (
              <p className="mt-1 text-sm text-danger">{state.fieldErrors.password}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-neutral-800">
              Peran
            </label>
            <select
              id="role"
              name="role"
              defaultValue="jobseeker"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="jobseeker">Pencari Kerja</option>
              <option value="mentor">Mentor</option>
              <option value="recruiter">Rekruter</option>
            </select>
            {state.fieldErrors?.role ? (
              <p className="mt-1 text-sm text-danger">{state.fieldErrors.role}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Memproses..." : "Buat Akun"}
          </button>
        </form>

        <p className="mt-6 text-sm text-neutral-600">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="font-semibold text-brand hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
