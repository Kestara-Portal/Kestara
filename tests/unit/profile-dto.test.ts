import { describe, expect, it } from "vitest";

import { toOwnProfile } from "../../lib/services/profile-dto";

const userRow = {
  id: "11111111-1111-1111-1111-111111111111",
  full_name: "Pengguna Uji",
  role: "jobseeker" as const,
  phone_number: "081234567890",
  bio: "Bio uji",
  created_at: "2026-11-07T16:02:08.447Z",
};

describe("toOwnProfile", () => {
  it("memetakan kolom snake_case ke camelCase dan memakai email dari sesi", () => {
    const profile = toOwnProfile(
      "uji@example.com",
      userRow,
      [
        {
          id: "s1",
          skill_name: "SQL",
          category: "Data",
          proficiency_level: "Menengah",
          description: null,
        },
      ],
      [
        {
          id: "p1",
          title: "Proyek Uji",
          description: null,
          project_url: "https://example.com",
          start_date: "2026-01-01",
          end_date: null,
        },
      ],
    );

    expect(profile.fullName).toBe("Pengguna Uji");
    expect(profile.email).toBe("uji@example.com");
    expect(profile.role).toBe("jobseeker");
    expect(profile.skills[0]).toEqual({
      id: "s1",
      name: "SQL",
      category: "Data",
      level: "Menengah",
      description: null,
    });
    expect(profile.portfolio[0].url).toBe("https://example.com");
    expect(profile.portfolio[0].endDate).toBeNull();
  });

  it("tidak membocorkan field sensitif walau ada di baris masukan", () => {
    const rowWithExtras = {
      ...userRow,
      account_status: "active",
      avatar_path: "private/avatar.png",
      password: "rahasia",
    };
    const portfolioWithExtras = {
      id: "p1",
      title: "Proyek",
      description: null,
      project_url: null,
      start_date: null,
      end_date: null,
      media_path: "private/file.pdf",
    };

    const profile = toOwnProfile("uji@example.com", rowWithExtras, [], [portfolioWithExtras]);
    const json = JSON.stringify(profile);

    expect(json).not.toContain("account_status");
    expect(json).not.toContain("accountStatus");
    expect(json).not.toContain("avatar");
    expect(json).not.toContain("password");
    expect(json).not.toContain("media_path");
    expect(json).not.toContain("private/");
  });

  it("mengembalikan daftar kosong jika belum ada keahlian atau portofolio", () => {
    const profile = toOwnProfile(null, userRow, [], []);

    expect(profile.email).toBeNull();
    expect(profile.skills).toEqual([]);
    expect(profile.portfolio).toEqual([]);
  });
});
