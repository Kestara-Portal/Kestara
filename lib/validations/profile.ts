import { z } from "zod";

const optionalTrimmmed = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const optionalDate = (message: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || isRealDate(value), message);

/** Update of the user's own profile (public.users safe columns only). */
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter.")
    .max(120, "Nama lengkap maksimal 120 karakter."),
  phoneNumber: optionalTrimmmed(30, "Nomor telepon maksimal 30 karakter."),
  bio: optionalTrimmmed(1000, "Bio maksimal 1000 karakter."),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/**
 * Skill matrix item. `proficiency_level` is intentionally NOT included: its
 * value domain is not defined by the Project Owner (OPEN-013).
 */
export const skillInputSchema = z.object({
  skillName: z
    .string()
    .trim()
    .min(1, "Nama keahlian wajib diisi.")
    .max(100, "Nama keahlian maksimal 100 karakter."),
  category: optionalTrimmmed(80, "Kategori maksimal 80 karakter."),
  description: optionalTrimmmed(500, "Deskripsi keahlian maksimal 500 karakter."),
});

export type SkillInput = z.infer<typeof skillInputSchema>;

/** Portfolio item. URL and date ordering are validated. */
export const portfolioInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Judul portofolio wajib diisi.")
      .max(150, "Judul portofolio maksimal 150 karakter."),
    description: optionalTrimmmed(2000, "Deskripsi portofolio maksimal 2000 karakter."),
    projectUrl: optionalTrimmmed(2048, "URL proyek terlalu panjang.").refine(
      (value) => value === null || /^https?:\/\//i.test(value),
      "URL proyek harus diawali http:// atau https://.",
    ),
    startDate: optionalDate("Tanggal mulai tidak valid."),
    endDate: optionalDate("Tanggal selesai tidak valid."),
  })
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.endDate >= value.startDate,
    {
      message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
      path: ["endDate"],
    },
  );

export type PortfolioInput = z.infer<typeof portfolioInputSchema>;

/** Password change. Current password is re-verified server-side. */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    newPassword: z
      .string()
      .min(8, "Kata sandi baru minimal 8 karakter.")
      .max(72, "Kata sandi baru maksimal 72 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: "Kata sandi baru harus berbeda dari kata sandi saat ini.",
    path: ["newPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
