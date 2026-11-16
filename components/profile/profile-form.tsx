"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, inputClasses, textareaClasses } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/client/api";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { zodFieldErrors } from "@/lib/validations/zod-helpers";

type ProfileFormProps = {
  initial: { fullName: string; phoneNumber: string; bio: string };
};

export function ProfileForm({ initial }: ProfileFormProps) {
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

    // Client-side validation (repeated on the server).
    const parsed = profileUpdateSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setPending(true);

    const result = await apiRequest<{ profile: unknown }>("/api/profile", {
      method: "PATCH",
      body: {
        fullName: parsed.data.fullName,
        phoneNumber: parsed.data.phoneNumber ?? "",
        bio: parsed.data.bio ?? "",
      },
    });

    setPending(false);

    if (!result.ok) {
      setFieldErrors(result.fields);
      setFeedback({ tone: "error", message: result.message });
      return;
    }

    setFeedback({ tone: "success", message: "Perubahan profil berhasil disimpan." });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}

      <FormField
        id="fullName"
        label="Nama lengkap"
        required
        error={fieldErrors.fullName}
      >
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          className={inputClasses}
          value={values.fullName}
          onChange={(event) => setValues({ ...values, fullName: event.target.value })}
          aria-invalid={Boolean(fieldErrors.fullName)}
          aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
        />
      </FormField>

      <FormField
        id="phoneNumber"
        label="Nomor telepon"
        hint="Nomor bersifat privat dan tidak ditampilkan publik."
        error={fieldErrors.phoneNumber}
      >
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          autoComplete="tel"
          className={inputClasses}
          value={values.phoneNumber}
          onChange={(event) => setValues({ ...values, phoneNumber: event.target.value })}
          aria-invalid={Boolean(fieldErrors.phoneNumber)}
          aria-describedby={fieldErrors.phoneNumber ? "phoneNumber-error" : undefined}
        />
      </FormField>

      <FormField id="bio" label="Bio singkat" error={fieldErrors.bio}>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          className={textareaClasses}
          value={values.bio}
          onChange={(event) => setValues({ ...values, bio: event.target.value })}
          aria-invalid={Boolean(fieldErrors.bio)}
          aria-describedby={fieldErrors.bio ? "bio-error" : undefined}
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {pending ? "Menyimpan..." : "Simpan profil"}
        </Button>
      </div>
    </form>
  );
}
