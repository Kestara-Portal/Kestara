"use client";

import Link from "next/link";
import { useState } from "react";

import type { FieldErrors } from "@/lib/validations/shared";

interface ApiErrorBody {
  error?: { code?: string; message?: string; fieldErrors?: FieldErrors };
}

interface CreatedCompany {
  id: string;
  name: string;
}

const INITIAL_FORM = {
  name: "",
  description: "",
  website: "",
  location: "",
  logo_path: "",
};

export function CompanyRegisterForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCompany | null>(null);
  const [pending, setPending] = useState(false);

  function update(field: keyof typeof INITIAL_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        data?: { company?: CreatedCompany };
      };

      if (!response.ok) {
        setFieldErrors(payload.error?.fieldErrors ?? {});
        setFormError(
          payload.error?.message ??
            "Pendaftaran perusahaan gagal. Periksa kembali data yang diisi.",
        );
        return;
      }

      setCreated(payload.data?.company ?? null);
      setForm(INITIAL_FORM);
    } catch {
      setFormError("Tidak dapat menghubungi server. Periksa koneksi Anda dan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  if (created) {
    return (
      <section
        role="status"
        className="rounded-2xl border border-brand-soft bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-neutral-900">Perusahaan berhasil didaftarkan</h2>
        <p className="mt-1 text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">{created.name}</span> kini memiliki
          identitas resmi di Kestara dan dapat mulai memasang lowongan.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setCreated(null)}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Daftarkan perusahaan lain
          </button>
          <Link
            href="/"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:border-brand hover:text-brand"
          >
            Kembali ke beranda
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-brand-soft bg-white p-6 shadow-sm"
    >
      {formError ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="space-y-5">
        <Field
          id="name"
          label="Nama perusahaan"
          required
          error={fieldErrors.name}
          hint="Gunakan nama resmi. Nama yang sama tidak dapat didaftarkan dua kali."
        >
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            required
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : "name-hint"}
            className={inputClass(Boolean(fieldErrors.name))}
          />
        </Field>

        <Field
          id="website"
          label="Situs web"
          error={fieldErrors.website}
          hint="Opsional. Contoh: https://contoh.co.id"
        >
          <input
            id="website"
            name="website"
            type="url"
            inputMode="url"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
            aria-invalid={Boolean(fieldErrors.website)}
            aria-describedby={fieldErrors.website ? "website-error" : "website-hint"}
            className={inputClass(Boolean(fieldErrors.website))}
          />
        </Field>

        <Field id="location" label="Lokasi" error={fieldErrors.location} hint="Opsional. Kota atau alamat kantor.">
          <input
            id="location"
            name="location"
            type="text"
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
            aria-invalid={Boolean(fieldErrors.location)}
            aria-describedby={fieldErrors.location ? "location-error" : "location-hint"}
            className={inputClass(Boolean(fieldErrors.location))}
          />
        </Field>

        <Field
          id="description"
          label="Deskripsi perusahaan"
          error={fieldErrors.description}
          hint="Opsional. Jelaskan bidang usaha dan nilai yang dibawa perusahaan."
        >
          <textarea
            id="description"
            name="description"
            rows={5}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? "description-error" : "description-hint"}
            className={inputClass(Boolean(fieldErrors.description))}
          />
        </Field>

        <Field
          id="logo_path"
          label="Path logo"
          error={fieldErrors.logo_path}
          hint="Opsional. Diisi path penyimpanan, bukan URL. Unggah logo belum tersedia."
        >
          <input
            id="logo_path"
            name="logo_path"
            type="text"
            value={form.logo_path}
            onChange={(event) => update("logo_path", event.target.value)}
            aria-invalid={Boolean(fieldErrors.logo_path)}
            aria-describedby={fieldErrors.logo_path ? "logo_path-error" : "logo_path-hint"}
            className={inputClass(Boolean(fieldErrors.logo_path))}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Daftarkan perusahaan"}
      </button>
    </form>
  );
}

function inputClass(hasError: boolean): string {
  const base =
    "w-full rounded-lg border px-3 py-2.5 text-neutral-900 focus:outline-none focus:ring-2";
  return hasError
    ? `${base} border-danger focus:border-danger focus:ring-danger/30`
    : `${base} border-neutral-300 focus:border-brand focus:ring-brand/30`;
}

function Field({
  id,
  label,
  required = false,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-neutral-800">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
