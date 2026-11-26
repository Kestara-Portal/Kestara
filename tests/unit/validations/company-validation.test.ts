import { describe, expect, it } from "vitest";

import {
  COMPANY_DESCRIPTION_MAX,
  isSafeLogoPath,
  normalizeCompanyWebsite,
  validateCompanyId,
  validateUpdateCompany,
} from "@/lib/validations/company";

const VALID_COMPANY_ID = "3f6c8a1e-1c2b-4a8f-9d7e-6b5a4c3d2e1f";

describe("KP-27: company profile update validation", () => {
  it("accepts a complete, valid payload and trims text fields", () => {
    const result = validateUpdateCompany({
      name: "  PT Mitra Inovasi  ",
      description: "  Kami bergerak di bidang teknologi.  ",
      website: "https://mitra-inovasi.co.id",
      location: "  Bandung  ",
      logo_path: "logos/mitra.png",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.name).toBe("PT Mitra Inovasi");
    expect(result.data.description).toBe("Kami bergerak di bidang teknologi.");
    expect(result.data.location).toBe("Bandung");
    expect(result.data.website).toBe("https://mitra-inovasi.co.id");
    expect(result.data.logo_path).toBe("logos/mitra.png");
  });

  it("requires a company name of at least 2 characters", () => {
    const missing = validateUpdateCompany({ name: "" });
    expect(missing.success).toBe(false);
    if (!missing.success) expect(missing.fieldErrors.name).toContain("wajib diisi");

    const tooShort = validateUpdateCompany({ name: " A " });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) expect(tooShort.fieldErrors.name).toContain("minimal 2 karakter");
  });

  it("rejects a name longer than 255 characters", () => {
    const result = validateUpdateCompany({ name: "a".repeat(256) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.name).toContain("maksimal 255 karakter");
  });

  it("treats blank optional fields as null instead of empty strings", () => {
    const result = validateUpdateCompany({
      name: "PT Kosong",
      description: "   ",
      website: "",
      location: null,
      logo_path: undefined,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.description).toBeNull();
    expect(result.data.website).toBeNull();
    expect(result.data.location).toBeNull();
    expect(result.data.logo_path).toBeNull();
  });

  it("enforces the 2000 character description limit", () => {
    const result = validateUpdateCompany({
      name: "PT Panjang",
      description: "x".repeat(COMPANY_DESCRIPTION_MAX + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.description).toContain("maksimal 2000");
  });

  it("normalizes a website to its canonical origin", () => {
    const result = validateUpdateCompany({
      name: "PT Web",
      website: "HTTPS://Mitra-Inovasi.co.id/tentang-kami?ref=1",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.website).toBe("https://mitra-inovasi.co.id");
  });

  it("rejects a website that is not an http(s) address", () => {
    for (const website of ["javascript:alert(1)", "ftp://example.com", "bukan url", "localhost"]) {
      const result = validateUpdateCompany({ name: "PT Web", website });
      expect(result.success, website).toBe(false);
      if (!result.success) {
        expect(result.fieldErrors.website).toContain("tidak valid");
      }
    }
  });

  it("rejects an absolute URL or traversal in logo_path", () => {
    for (const logoPath of [
      "https://evil.example/logo.png",
      "../../etc/passwd",
      "/absolute/path.png",
    ]) {
      const result = validateUpdateCompany({ name: "PT Logo", logo_path: logoPath });
      expect(result.success, logoPath).toBe(false);
      if (!result.success) expect(result.fieldErrors.logo_path).toBeDefined();
    }
  });

  it("never accepts fields the schema does not define", () => {
    const result = validateUpdateCompany({
      name: "PT Aman",
      status: "deleted",
      created_by: "00000000-0000-0000-0000-000000000000",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(Object.keys(result.data).sort()).toEqual([
      "description",
      "location",
      "logo_path",
      "name",
      "website",
    ]);
  });

  it("handles a non-object body without throwing", () => {
    for (const body of [null, undefined, "text", 42]) {
      const result = validateUpdateCompany(body);
      expect(result.success).toBe(false);
      if (!result.success) expect(Object.keys(result.fieldErrors).length).toBeGreaterThan(0);
    }
  });
});

describe("KP-27: company helpers", () => {
  it("normalizes website forms consistently", () => {
    expect(normalizeCompanyWebsite("mitra.co.id")).toBe("https://mitra.co.id");
    expect(normalizeCompanyWebsite("  https://Mitra.co.id/  ")).toBe("https://mitra.co.id");
    expect(normalizeCompanyWebsite("http://mitra.co.id:8080/a/b")).toBe(
      "http://mitra.co.id:8080",
    );
    expect(normalizeCompanyWebsite("")).toBeNull();
    expect(normalizeCompanyWebsite("mailto:hrd@mitra.co.id")).toBeNull();
  });

  it("accepts only relative, traversal-free storage paths", () => {
    expect(isSafeLogoPath("logos/mitra-inovasi.png")).toBe(true);
    expect(isSafeLogoPath("company/3f6c8a1e/logo.webp")).toBe(true);
    expect(isSafeLogoPath("../logo.png")).toBe(false);
    expect(isSafeLogoPath("company/../../secret.png")).toBe(false);
    expect(isSafeLogoPath("https://cdn.example.com/logo.png")).toBe(false);
  });

  it("validates the company id format", () => {
    expect(validateCompanyId(VALID_COMPANY_ID)).toBeNull();
    expect(validateCompanyId("not-a-uuid")).toContain("tidak valid");
    expect(validateCompanyId("")).toContain("wajib diisi");
    expect(validateCompanyId(undefined)).toContain("wajib diisi");
  });
});
