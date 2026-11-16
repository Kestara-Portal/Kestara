"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, inputClasses, textareaClasses } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/client/api";
import { portfolioInputSchema } from "@/lib/validations/profile";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";
import type { PortfolioItemRow } from "@/types/database";

type PortfolioValues = {
  title: string;
  projectUrl: string;
  startDate: string;
  endDate: string;
  description: string;
};

const EMPTY: PortfolioValues = {
  title: "",
  projectUrl: "",
  startDate: "",
  endDate: "",
  description: "",
};

function PortfolioForm({
  initial,
  endpoint,
  method,
  submitLabel,
  onDone,
}: {
  initial: PortfolioValues;
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

    const parsed = portfolioInputSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setPending(true);

    const result = await apiRequest<{ portfolio: PortfolioItemRow }>(endpoint, {
      method,
      body: {
        title: parsed.data.title,
        projectUrl: parsed.data.projectUrl ?? "",
        startDate: parsed.data.startDate ?? "",
        endDate: parsed.data.endDate ?? "",
        description: parsed.data.description ?? "",
      },
    });
    setPending(false);

    if (!result.ok) {
      setFieldErrors(result.fields);
      setFeedback({ tone: "error", message: result.message });
      return;
    }

    setFeedback({ tone: "success", message: "Portofolio berhasil disimpan." });
    if (method === "POST") setValues(EMPTY);
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}

      <FormField id="portfolioTitle" label="Judul proyek" required error={fieldErrors.title}>
        <input
          id="portfolioTitle"
          type="text"
          className={inputClasses}
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
          aria-invalid={Boolean(fieldErrors.title)}
        />
      </FormField>

      <FormField id="projectUrl" label="URL proyek" error={fieldErrors.projectUrl}>
        <input
          id="projectUrl"
          type="url"
          placeholder="https://"
          className={inputClasses}
          value={values.projectUrl}
          onChange={(event) => setValues({ ...values, projectUrl: event.target.value })}
          aria-invalid={Boolean(fieldErrors.projectUrl)}
        />
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id="startDate" label="Tanggal mulai" error={fieldErrors.startDate}>
          <input
            id="startDate"
            type="date"
            className={inputClasses}
            value={values.startDate}
            onChange={(event) => setValues({ ...values, startDate: event.target.value })}
            aria-invalid={Boolean(fieldErrors.startDate)}
          />
        </FormField>
        <FormField id="endDate" label="Tanggal selesai" error={fieldErrors.endDate}>
          <input
            id="endDate"
            type="date"
            className={inputClasses}
            value={values.endDate}
            onChange={(event) => setValues({ ...values, endDate: event.target.value })}
            aria-invalid={Boolean(fieldErrors.endDate)}
          />
        </FormField>
      </div>

      <FormField id="portfolioDescription" label="Deskripsi" error={fieldErrors.description}>
        <textarea
          id="portfolioDescription"
          rows={3}
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

export function PortfolioManager({ items }: { items: PortfolioItemRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-line bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Tambah portofolio</h3>
        <PortfolioForm
          initial={EMPTY}
          endpoint="/api/profile/portfolio"
          method="POST"
          submitLabel="Tambah portofolio"
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Belum ada portofolio"
          description="Tambahkan proyek untuk memperkuat profil profesionalmu."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-[14px] border border-line bg-white p-4">
              {editingId === item.id ? (
                <PortfolioForm
                  initial={{
                    title: item.title,
                    projectUrl: item.project_url ?? "",
                    startDate: item.start_date ?? "",
                    endDate: item.end_date ?? "",
                    description: item.description ?? "",
                  }}
                  endpoint={`/api/profile/portfolio/${item.id}`}
                  method="PATCH"
                  submitLabel="Simpan perubahan"
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    {item.start_date || item.end_date ? (
                      <p className="mt-1 text-xs text-muted">
                        {item.start_date ?? "?"} — {item.end_date ?? "sekarang"}
                      </p>
                    ) : null}
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted">{item.description}</p>
                    ) : null}
                    {item.project_url ? (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm text-brand underline"
                      >
                        Lihat proyek
                      </a>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingId(item.id)}
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
