"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EMPLOYMENT_TYPES, type EmploymentType, type JobVacancyRow } from "@/types/database";
import type { FieldErrors } from "@/lib/validations/shared";

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Penuh waktu",
  part_time: "Paruh waktu",
  contract: "Kontrak",
  internship: "Magang",
  freelance: "Lepas",
};

interface ApiErrorBody {
  error?: { code?: string; message?: string; fieldErrors?: FieldErrors };
}

export function VacancyEditForm({ vacancy }: { vacancy: JobVacancyRow }) {
  const router = useRouter();

  const [title, setTitle] = useState(vacancy.title);
  const [description, setDescription] = useState(vacancy.description);
  const [skills, setSkills] = useState<string[]>(vacancy.required_skills ?? []);
  const [skillDraft, setSkillDraft] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    vacancy.employment_type ?? "",
  );
  const [location, setLocation] = useState(vacancy.location ?? "");
  const [isActive, setIsActive] = useState(vacancy.is_active);
  const [confirmReopen, setConfirmReopen] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isClosed = !vacancy.is_active;

  function addSkill() {
    const candidate = skillDraft.trim().replace(/\s+/g, " ");
    if (candidate.length === 0) return;

    const exists = skills.some((skill) => skill.toLowerCase() === candidate.toLowerCase());
    if (!exists) setSkills((current) => [...current, candidate]);

    setSkillDraft("");
    setFieldErrors((current) => ({ ...current, required_skills: "" }));
  }

  function removeSkill(skill: string) {
    setSkills((current) => current.filter((item) => item !== skill));
  }

  function handleSkillKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (skills.length === 0) {
      setFieldErrors({ required_skills: "Tambahkan minimal satu keahlian atau kualifikasi." });
      return;
    }

    setPending(true);
    setFieldErrors({});

    try {
      const response = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          required_skills: skills,
          employment_type: employmentType,
          location,
          is_active: isActive,
          confirm_reopen: confirmReopen,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as ApiErrorBody;

      if (!response.ok) {
        setFieldErrors(payload.error?.fieldErrors ?? {});

        if (payload.error?.code === "VACANCY_CLOSED_CONFIRMATION_REQUIRED") {
          setFormError(
            payload.error.message ??
              "Lowongan ini sudah ditutup. Konfirmasi pembukaan kembali sebelum mengubahnya.",
          );
          setConfirmReopen(true);
          return;
        }

        setFormError(
          payload.error?.message ?? "Perubahan lowongan gagal disimpan. Silakan coba lagi.",
        );
        return;
      }

      setSuccessMessage("Perubahan lowongan berhasil disimpan.");
      setConfirmReopen(false);
      router.refresh();
    } catch {
      setFormError("Tidak dapat menghubungi server. Periksa koneksi Anda dan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-brand-soft bg-white p-6 shadow-sm"
    >
      {isClosed ? (
        <div className="mb-5 rounded-lg border border-neutral-300 bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-900">Lowongan ini sudah ditutup.</p>
          <p className="mt-1 text-sm text-neutral-600">
            Perubahan memerlukan konfirmasi. Centang pembukaan kembali agar lowongan tampil lagi
            bagi pencari kerja.
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={confirmReopen}
              onChange={(event) => setConfirmReopen(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/30"
            />
            Saya ingin membuka kembali lowongan ini
          </label>
        </div>
      ) : null}

      {formError ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <p role="status" className="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-success">
          {successMessage}
        </p>
      ) : null}

      <div className="space-y-5">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-neutral-800">
            Judul lowongan <span className="ml-1 text-danger">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? "title-error" : undefined}
            className={inputClass(Boolean(fieldErrors.title))}
          />
          {fieldErrors.title ? (
            <p id="title-error" className="mt-1 text-sm text-danger">
              {fieldErrors.title}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-800">
            Deskripsi <span className="ml-1 text-danger">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={8}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? "description-error" : "description-hint"}
            className={inputClass(Boolean(fieldErrors.description))}
          />
          {fieldErrors.description ? (
            <p id="description-error" className="mt-1 text-sm text-danger">
              {fieldErrors.description}
            </p>
          ) : (
            <p id="description-hint" className="mt-1 text-sm text-neutral-500">
              Jelaskan tanggung jawab, kualifikasi, dan proses rekrutmen.
            </p>
          )}
        </div>

        <fieldset>
          <legend className="mb-1 block text-sm font-medium text-neutral-800">
            Keahlian yang dibutuhkan <span className="ml-1 text-danger">*</span>
          </legend>

          {skills.length > 0 ? (
            <ul className="mb-3 flex flex-wrap gap-2" aria-label="Daftar keahlian terpilih">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm text-brand-dark"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Hapus keahlian ${skill}`}
                    className="rounded-full px-1 text-brand transition-colors hover:text-danger focus:outline-none focus:ring-2 focus:ring-brand/40"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-neutral-500">Belum ada keahlian ditambahkan.</p>
          )}

          <div className="flex gap-2">
            <input
              id="skill"
              name="skill"
              type="text"
              value={skillDraft}
              onChange={(event) => setSkillDraft(event.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Contoh: Analisis Data"
              aria-invalid={Boolean(fieldErrors.required_skills)}
              aria-describedby={
                fieldErrors.required_skills ? "skills-error" : "skills-hint"
              }
              className={inputClass(Boolean(fieldErrors.required_skills))}
            />
            <button
              type="button"
              onClick={addSkill}
              className="shrink-0 rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              Tambah
            </button>
          </div>

          {fieldErrors.required_skills ? (
            <p id="skills-error" className="mt-1 text-sm text-danger">
              {fieldErrors.required_skills}
            </p>
          ) : (
            <p id="skills-hint" className="mt-1 text-sm text-neutral-500">
              Tekan Enter atau koma untuk menambahkan keahlian.
            </p>
          )}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="employment_type"
              className="mb-1 block text-sm font-medium text-neutral-800"
            >
              Jenis pekerjaan
            </label>
            <select
              id="employment_type"
              name="employment_type"
              value={employmentType}
              onChange={(event) => setEmploymentType(event.target.value as EmploymentType | "")}
              className={inputClass(Boolean(fieldErrors.employment_type))}
            >
              <option value="">Tidak ditentukan</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            {fieldErrors.employment_type ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.employment_type}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="location" className="mb-1 block text-sm font-medium text-neutral-800">
              Lokasi
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              aria-invalid={Boolean(fieldErrors.location)}
              className={inputClass(Boolean(fieldErrors.location))}
            />
            {fieldErrors.location ? (
              <p className="mt-1 text-sm text-danger">{fieldErrors.location}</p>
            ) : null}
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/30"
          />
          <span>
            Lowongan aktif
            <span className="block text-sm text-neutral-500">
              Lowongan tidak aktif disembunyikan dari pencari kerja.
            </span>
          </span>
        </label>
        {fieldErrors.is_active ? (
          <p className="text-sm text-danger">{fieldErrors.is_active}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : "Simpan perubahan"}
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
