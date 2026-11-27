import { z } from "zod";

/**
 * Create + publish a job vacancy. The employment-type value set is not yet
 * defined by the product owner, so it is accepted as optional free text.
 */
export const jobCreateSchema = z.object({
  companyId: z.string().uuid("Pilih perusahaan yang valid."),
  title: z
    .string()
    .trim()
    .min(3, "Judul lowongan minimal 3 karakter.")
    .max(150, "Judul lowongan maksimal 150 karakter."),
  description: z
    .string()
    .trim()
    .min(20, "Deskripsi lowongan minimal 20 karakter.")
    .max(5000, "Deskripsi lowongan maksimal 5000 karakter."),
  location: z
    .string()
    .trim()
    .min(2, "Lokasi wajib diisi.")
    .max(120, "Lokasi maksimal 120 karakter."),
  employmentType: z
    .string()
    .trim()
    .max(60, "Tipe pekerjaan maksimal 60 karakter.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  skills: z
    .array(
      z
        .string()
        .trim()
        .max(100, "Nama keahlian maksimal 100 karakter.")
        .refine((value) => value.length > 0, "Nama keahlian tidak boleh kosong."),
    )
    .min(1, "Tambahkan minimal satu kriteria keahlian.")
    .max(30, "Maksimal 30 kriteria keahlian.")
    .transform((skills) => {
      const seen = new Set<string>();
      const result: string[] = [];
      for (const raw of skills) {
        const value = raw.trim();
        const key = value.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(value);
        }
      }
      return result;
    }),
});

export type JobCreateInput = z.infer<typeof jobCreateSchema>;
