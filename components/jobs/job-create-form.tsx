"use client";

import { useCallback, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, inputClasses, textareaClasses } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/client/api";
import type { VerifiedCompany } from "@/lib/jobs/companies";
import { jobCreateSchema } from "@/lib/validations/job";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";

type Values = {
  companyId: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
};

const EMPTY: Values = {
  companyId: "",
  title: "",
  description: "",
  location: "",
  employmentType: "",
};

export function JobCreateForm({
  initialCompanies,
  initialLoadError,
}: {
  initialCompanies: VerifiedCompany[];
  initialLoadError?: string;
}) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [companies, setCompanies] = useState(initialCompanies);
  const [companyLoadState, setCompanyLoadState] = useState<"loading" | "ready" | "error">(
    initialLoadError ? "error" : "ready",
  );
  const [companyLoadError, setCompanyLoadError] = useState(initialLoadError ?? "");
  const [skills, setSkills] = useState<string[]>([""]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  const loadCompanies = useCallback(async () => {
    setCompanyLoadState("loading");
    setCompanyLoadError("");
    const result = await apiRequest<{ companies: VerifiedCompany[] }>("/api/jobs/companies", {
      method: "GET",
    });

    if (!result.ok) {
      setCompanyLoadState("error");
      setCompanyLoadError(result.message);
      return;
    }

    setCompanies(result.data.companies);
    setCompanyLoadState("ready");
  }, []);

  function updateSkill(index: number, value: string) {
    setSkills((current) => current.map((item, i) => (i === index ? value : item)));
  }

  function addSkill() {
    setSkills((current) => [...current, ""]);
  }

  function removeSkill(index: number) {
    setSkills((current) =>
      current.length === 1 ? [""] : current.filter((_, i) => i !== index),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const parsed = jobCreateSchema.safeParse({ ...values, skills });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      setFeedback({ tone: "error", message: "Periksa kembali isian lowongan Anda." });
      return;
    }
    setFieldErrors({});
    setPending(true);

    const result = await apiRequest<{ jobId: string }>("/api/jobs", {
      method: "POST",
      body: {
        companyId: parsed.data.companyId,
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        employmentType: parsed.data.employmentType ?? "",
        skills: parsed.data.skills,
      },
    });
    setPending(false);

    if (!result.ok) {
      setFieldErrors(result.fields);
      setFeedback({ tone: "error", message: result.message });
      return;
    }

    setFeedback({
      tone: "success",
      message: "Lowongan berhasil dibuat dan dipublikasikan.",
    });
    setValues(EMPTY);
    setSkills([""]);
  }

  return (
    <>
      {companyLoadState === "loading" ? (
        <p role="status" className="text-sm text-muted">
          Memuat perusahaan dengan membership terverifikasi...
        </p>
      ) : null}

      {companyLoadState === "error" ? (
        <div className="space-y-3">
          <Alert tone="error">{companyLoadError}</Alert>
          <Button type="button" variant="secondary" onClick={() => void loadCompanies()}>
            Coba lagi
          </Button>
        </div>
      ) : null}

      {companyLoadState === "ready" && companies.length === 0 ? (
        <div className="space-y-2 rounded-[14px] border border-line bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Belum ada perusahaan terverifikasi
          </h2>
          <p className="text-sm leading-6 text-muted">
            Anda perlu memiliki membership perusahaan berstatus terverifikasi sebelum
            memublikasikan lowongan. Hubungi admin untuk memeriksa status membership Anda.
          </p>
        </div>
      ) : null}

      {companyLoadState === "ready" && companies.length > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}

          {fieldErrors.form ? <Alert tone="error">{fieldErrors.form}</Alert> : null}

          <FormField id="companyId" label="Perusahaan" required error={fieldErrors.companyId}>
            <select
              id="companyId"
              className={inputClasses}
              value={values.companyId}
              onChange={(event) => setValues({ ...values, companyId: event.target.value })}
              aria-invalid={Boolean(fieldErrors.companyId)}
              aria-describedby={fieldErrors.companyId ? "companyId-error" : undefined}
            >
              <option value="">Pilih perusahaan</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="title" label="Judul pekerjaan" required error={fieldErrors.title}>
            <input
              id="title"
              type="text"
              className={inputClasses}
              value={values.title}
              onChange={(event) => setValues({ ...values, title: event.target.value })}
              aria-invalid={Boolean(fieldErrors.title)}
            />
          </FormField>

          <FormField
            id="description"
            label="Deskripsi pekerjaan"
            required
            hint="Jelaskan tanggung jawab, kualifikasi, dan konteks peran."
            error={fieldErrors.description}
          >
            <textarea
              id="description"
              rows={6}
              className={textareaClasses}
              value={values.description}
              onChange={(event) => setValues({ ...values, description: event.target.value })}
              aria-invalid={Boolean(fieldErrors.description)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="location" label="Lokasi" required error={fieldErrors.location}>
              <input
                id="location"
                type="text"
                className={inputClasses}
                value={values.location}
                onChange={(event) => setValues({ ...values, location: event.target.value })}
                aria-invalid={Boolean(fieldErrors.location)}
              />
            </FormField>

            <FormField
              id="employmentType"
              label="Tipe pekerjaan"
              error={fieldErrors.employmentType}
            >
              <input
                id="employmentType"
                type="text"
                placeholder="Contoh: Penuh waktu, Kontrak"
                className={inputClasses}
                value={values.employmentType}
                onChange={(event) => setValues({ ...values, employmentType: event.target.value })}
                aria-invalid={Boolean(fieldErrors.employmentType)}
              />
            </FormField>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">
              Kriteria keahlian
              <span className="ml-1 text-danger" aria-hidden="true">
                *
              </span>
            </legend>
            <p className="text-xs text-muted">
              Tambahkan satu atau lebih keahlian yang dibutuhkan untuk lowongan ini.
            </p>

            {fieldErrors.skills ? (
              <p role="alert" className="text-xs text-danger">
                {fieldErrors.skills}
              </p>
            ) : null}

            <ul className="space-y-2">
              {skills.map((skill, index) => (
                <li key={index} className="flex items-center gap-2">
                  <label htmlFor={`skill-${index}`} className="sr-only">
                    Kriteria keahlian {index + 1}
                  </label>
                  <input
                    id={`skill-${index}`}
                    type="text"
                    className={inputClasses}
                    value={skill}
                    onChange={(event) => updateSkill(index, event.target.value)}
                    placeholder="Contoh: Analisis data"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSkill(index)}
                    aria-label={`Hapus kriteria keahlian ${index + 1}`}
                  >
                    Hapus
                  </Button>
                </li>
              ))}
            </ul>

            <Button type="button" variant="secondary" size="sm" onClick={addSkill}>
              Tambah kriteria keahlian
            </Button>
          </fieldset>

          <div className="flex justify-end">
            <Button type="submit" loading={pending}>
              {pending ? "Mempublikasikan..." : "Publikasikan lowongan"}
            </Button>
          </div>
        </form>
      ) : null}
    </>
  );
}
