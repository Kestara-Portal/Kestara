"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, inputClasses, textareaClasses } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/client/api";
import { skillInputSchema } from "@/lib/validations/profile";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";
import type { UserSkillRow } from "@/types/database";

type SkillValues = { skillName: string; category: string; description: string };

const EMPTY: SkillValues = { skillName: "", category: "", description: "" };

function SkillForm({
  initial,
  endpoint,
  method,
  submitLabel,
  onDone,
}: {
  initial: SkillValues;
  endpoint: string;
  method: "POST" | "PATCH";
  submitLabel: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const parsed = skillInputSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setPending(true);

    const result = await apiRequest<{ skill: UserSkillRow }>(endpoint, {
      method,
      body: {
        skillName: parsed.data.skillName,
        category: parsed.data.category ?? "",
        description: parsed.data.description ?? "",
      },
    });
    setPending(false);

    if (!result.ok) {
      setFieldErrors(result.fields);
      setFeedback({ tone: "error", message: result.message });
      return;
    }

    setFeedback({ tone: "success", message: "Keahlian berhasil disimpan." });
    if (method === "POST") setValues(EMPTY);
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}

      <FormField id="skillName" label="Nama keahlian" required error={fieldErrors.skillName}>
        <input
          id="skillName"
          type="text"
          className={inputClasses}
          value={values.skillName}
          onChange={(event) => setValues({ ...values, skillName: event.target.value })}
          aria-invalid={Boolean(fieldErrors.skillName)}
        />
      </FormField>

      <FormField id="category" label="Kategori" error={fieldErrors.category}>
        <input
          id="category"
          type="text"
          className={inputClasses}
          value={values.category}
          onChange={(event) => setValues({ ...values, category: event.target.value })}
          aria-invalid={Boolean(fieldErrors.category)}
        />
      </FormField>

      <FormField id="skillDescription" label="Deskripsi" error={fieldErrors.description}>
        <textarea
          id="skillDescription"
          rows={2}
          className={textareaClasses}
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
          aria-invalid={Boolean(fieldErrors.description)}
        />
      </FormField>

      <div className="flex justify-end gap-2">
        {onDone ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Batal
          </Button>
        ) : null}
        <Button type="submit" size="sm" loading={pending}>
          {pending ? "Menyimpan..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function SkillsManager({ skills }: { skills: UserSkillRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-line bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Tambah keahlian</h3>
        <SkillForm
          initial={EMPTY}
          endpoint="/api/profile/skills"
          method="POST"
          submitLabel="Tambah keahlian"
        />
      </div>

      {skills.length === 0 ? (
        <EmptyState
          title="Belum ada keahlian"
          description="Tambahkan keahlian agar matriks kompetensimu terlihat oleh proses rekrutmen berbasis kompetensi."
        />
      ) : (
        <ul className="space-y-3">
          {skills.map((skill) => (
            <li key={skill.id} className="rounded-[14px] border border-line bg-white p-4">
              {editingId === skill.id ? (
                <SkillForm
                  initial={{
                    skillName: skill.skill_name,
                    category: skill.category ?? "",
                    description: skill.description ?? "",
                  }}
                  endpoint={`/api/profile/skills/${skill.id}`}
                  method="PATCH"
                  submitLabel="Simpan perubahan"
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{skill.skill_name}</p>
                    {skill.category ? (
                      <span className="mt-1 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-dark">
                        {skill.category}
                      </span>
                    ) : null}
                    {skill.description ? (
                      <p className="mt-1 text-sm text-muted">{skill.description}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingId(skill.id)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
