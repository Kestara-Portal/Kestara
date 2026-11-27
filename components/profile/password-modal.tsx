"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, inputClasses } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { apiRequest } from "@/lib/client/api";
import { passwordChangeSchema } from "@/lib/validations/profile";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordModal() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  function close() {
    setOpen(false);
    setValues(EMPTY);
    setFieldErrors({});
    setFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const parsed = passwordChangeSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setPending(true);

    const result = await apiRequest<{ updated: boolean }>("/api/profile/password", {
      method: "POST",
      body: values,
    });
    setPending(false);

    if (!result.ok) {
      setFieldErrors(result.fields);
      setFeedback({ tone: "error", message: result.message });
      return;
    }

    setFeedback({ tone: "success", message: "Kata sandi berhasil diperbarui." });
    setValues(EMPTY);
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Ubah kata sandi
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Ubah kata sandi"
        description="Masukkan kata sandi saat ini lalu kata sandi baru Anda."
      >
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}

          <FormField
            id="currentPassword"
            label="Kata sandi saat ini"
            required
            error={fieldErrors.currentPassword}
          >
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              className={inputClasses}
              value={values.currentPassword}
              onChange={(event) =>
                setValues({ ...values, currentPassword: event.target.value })
              }
              aria-invalid={Boolean(fieldErrors.currentPassword)}
            />
          </FormField>

          <FormField
            id="newPassword"
            label="Kata sandi baru"
            required
            hint="Minimal 8 karakter."
            error={fieldErrors.newPassword}
          >
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              className={inputClasses}
              value={values.newPassword}
              onChange={(event) => setValues({ ...values, newPassword: event.target.value })}
              aria-invalid={Boolean(fieldErrors.newPassword)}
            />
          </FormField>

          <FormField
            id="confirmPassword"
            label="Konfirmasi kata sandi baru"
            required
            error={fieldErrors.confirmPassword}
          >
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={inputClasses}
              value={values.confirmPassword}
              onChange={(event) =>
                setValues({ ...values, confirmPassword: event.target.value })
              }
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={close}>
              Tutup
            </Button>
            <Button type="submit" loading={pending}>
              {pending ? "Menyimpan..." : "Simpan kata sandi"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
