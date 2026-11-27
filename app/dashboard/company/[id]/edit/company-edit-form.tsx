"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  COMPANY_DESCRIPTION_MAX,
  COMPANY_LOCATION_MAX,
  validateUpdateCompany,
  type FieldErrors,
} from "@/lib/validations/company";
import type { CompanyRow } from "@/types/database";

interface FormValues {
  name: string;
  description: string;
  website: string;
  location: string;
  logo_path: string;
}

type Banner =
  | { tone: "success"; message: string }
  | { tone: "error"; message: string };

function toFormValues(company: CompanyRow): FormValues {
  return {
    name: company.name ?? "",
    description: company.description ?? "",
    website: company.website ?? "",
    location: company.location ?? "",
    logo_path: company.logo_path ?? "",
  };
}

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function CompanyEditForm({ company }: { company: CompanyRow }) {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(() => toFormValues(company));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(company.updated_at);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner(null);

    // Same schema the route handler uses, so the client cannot drift from the
    // server rules. The server still re-validates every field.
    const parsed = validateUpdateCompany(values);
    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setBanner({ tone: "error", message: "Periksa kembali isian yang ditandai merah." });
      return;
    }

    setFieldErrors({});
    setIsSaving(true);

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/auth/login");
        return;
      }

      if (!response.ok) {
        const error = body?.error as
          | { code?: string; message?: string; fieldErrors?: FieldErrors }
          | undefined;

        if (error?.fieldErrors) setFieldErrors(error.fieldErrors);
        if (error?.code === "COMPANY_NAME_TAKEN") {
          setFieldErrors((current) => ({
            ...current,
            name: error.message ?? "Nama perusahaan sudah terdaftar.",
          }));
        }
        if (error?.code === "COMPANY_WEBSITE_TAKEN") {
          setFieldErrors((current) => ({
            ...current,
            website: error.message ?? "Alamat website sudah dipakai perusahaan lain.",
          }));
        }

        setBanner({
          tone: "error",
          message: error?.message ?? "Perubahan tidak dapat disimpan. Coba lagi.",
        });
        return;
      }

      const updated = body?.data?.company as CompanyRow | undefined;
      if (updated) {
        setValues(toFormValues(updated));
        setLastUpdated(updated.updated_at);
      }

      setBanner({ tone: "success", message: "Profil perusahaan berhasil diperbarui." });
    } catch {
      setBanner({
        tone: "error",
        message: "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Informasi Perusahaan</h2>
        <p className="text-xs text-slate-500">
          Terakhir diperbarui: <span className="font-medium">{formatTimestamp(lastUpdated)}</span>
        </p>
      </div>

      {banner && (
        <div
          role={banner.tone === "success" ? "status" : "alert"}
          aria-live="polite"
          className={
            banner.tone === "success"
              ? "mb-6 flex items-start justify-between gap-3 rounded-xl border border-[#176B62]/30 bg-[#176B62]/10 px-4 py-3 text-sm text-[#12554e]"
              : "mb-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          }
        >
          <span className="flex items-start gap-2">
            <span aria-hidden="true">{banner.tone === "success" ? "✓" : "!"}</span>
            <span>{banner.message}</span>
          </span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="rounded-md px-1 text-xs font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62]"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="space-y-5">
        <Field
          id="company-name"
          label="Nama perusahaan"
          required
          error={fieldErrors.name}
          hint="Gunakan nama resmi yang terdaftar."
        >
          <input
            id="company-name"
            name="name"
            type="text"
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
            maxLength={255}
            required
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={describedBy("company-name", fieldErrors.name, true)}
            className={inputClass(Boolean(fieldErrors.name))}
          />
        </Field>

        <Field
          id="company-website"
          label="Website"
          error={fieldErrors.website}
          hint="Contoh: https://perusahaan.co.id — boleh tanpa https://."
        >
          <input
            id="company-website"
            name="website"
            type="text"
            inputMode="url"
            value={values.website}
            onChange={(event) => setField("website", event.target.value)}
            aria-invalid={Boolean(fieldErrors.website)}
            aria-describedby={describedBy("company-website", fieldErrors.website, true)}
            className={inputClass(Boolean(fieldErrors.website))}
          />
        </Field>

        <Field id="company-location" label="Lokasi" error={fieldErrors.location}>
          <input
            id="company-location"
            name="location"
            type="text"
            value={values.location}
            onChange={(event) => setField("location", event.target.value)}
            maxLength={COMPANY_LOCATION_MAX}
            aria-invalid={Boolean(fieldErrors.location)}
            aria-describedby={describedBy("company-location", fieldErrors.location)}
            className={inputClass(Boolean(fieldErrors.location))}
          />
        </Field>

        <Field
          id="company-description"
          label="Deskripsi perusahaan"
          error={fieldErrors.description}
          hint={`${values.description.trim().length}/${COMPANY_DESCRIPTION_MAX} karakter`}
        >
          <textarea
            id="company-description"
            name="description"
            rows={6}
            value={values.description}
            onChange={(event) => setField("description", event.target.value)}
            maxLength={COMPANY_DESCRIPTION_MAX}
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={describedBy("company-description", fieldErrors.description, true)}
            className={inputClass(Boolean(fieldErrors.description))}
          />
        </Field>

        <Field
          id="company-logo-path"
          label="Path logo"
          error={fieldErrors.logo_path}
          hint="Diisi otomatis oleh proses unggah berkas. Kosongkan jika belum ada logo."
        >
          <input
            id="company-logo-path"
            name="logo_path"
            type="text"
            value={values.logo_path}
            onChange={(event) => setField("logo_path", event.target.value)}
            aria-invalid={Boolean(fieldErrors.logo_path)}
            aria-describedby={describedBy("company-logo-path", fieldErrors.logo_path, true)}
            className={inputClass(Boolean(fieldErrors.logo_path))}
          />
        </Field>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#176B62] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#12554e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B62] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isSaving ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}

function inputClass(hasError: boolean): string {
  const base =
    "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:bg-slate-50";
  return hasError
    ? `${base} border-red-400 focus-visible:ring-red-400`
    : `${base} border-slate-300 focus-visible:ring-[#176B62]`;
}

function describedBy(id: string, error?: string, hasHint = false): string | undefined {
  const ids = [error ? `${id}-error` : null, hasHint ? `${id}-hint` : null].filter(
    (value): value is string => Boolean(value),
  );
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function Field({
  id,
  label,
  error,
  hint,
  required = false,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-900">
        {label}
        {required ? (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
