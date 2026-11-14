// Data contoh untuk KP-39. Nanti cukup ganti isi getActiveVacancies()
// dengan query ke database; API dan UI tidak perlu diubah.

export type Vacancy = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: "Full-time" | "Magang" | "Hybrid" | "Remote";
  postedAt: string; // ISO date
  isActive: boolean;
  noExperienceRequired: boolean;
};

export type VacancyPage = {
  data: Vacancy[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const BASE = [
  { title: "UI/UX Designer", companyName: "Nusantara Tech", location: "Jakarta", employmentType: "Hybrid" },
  { title: "Frontend Developer", companyName: "Kreasi Digital", location: "Bandung", employmentType: "Full-time" },
  { title: "Data Analyst Intern", companyName: "Data Maju", location: "Yogyakarta", employmentType: "Magang" },
  { title: "Customer Support", companyName: "Layanan Prima", location: "Surabaya", employmentType: "Full-time" },
  { title: "Content Writer", companyName: "Media Kita", location: "Remote", employmentType: "Remote" },
  { title: "QA Tester", companyName: "Solusi Teknologi", location: "Semarang", employmentType: "Hybrid" },
  { title: "Admin Operasional", companyName: "Bina Usaha", location: "Medan", employmentType: "Full-time" },
] as const;

const VACANCIES: Vacancy[] = Array.from({ length: 23 }, (_, i) => {
  const b = BASE[i % BASE.length];
  return {
    id: String(i + 1),
    title: b.title,
    companyName: b.companyName,
    location: b.location,
    employmentType: b.employmentType,
    postedAt: new Date(Date.UTC(2026, 10, 12) - i * 86_400_000).toISOString(),
    isActive: i % 7 !== 6, // beberapa lowongan nonaktif untuk menguji filter
    noExperienceRequired: i % 3 === 0,
  };
});

// Hanya lowongan aktif, terbaru dulu, dengan pagination.
export function getActiveVacancies(page: number, limit: number): VacancyPage {
  const active = VACANCIES.filter((v) => v.isActive).sort((a, b) =>
    b.postedAt.localeCompare(a.postedAt)
  );
  const total = active.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: active.slice(start, start + limit), page: safePage, limit, total, totalPages };
}
