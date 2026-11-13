import { describe, expect, it } from "vitest";

import {
  companyWebsiteDomain,
  normalizeCompanyName,
  validateCompanyRegistration,
} from "@/lib/validations/company";

describe("company registration validation", () => {
  it("accepts a complete valid registration", () => {
    const result = validateCompanyRegistration({
      name: "PT Karya Inklusif",
      description: "Perusahaan teknologi yang membangun produk aksesibel.",
      website: "https://karya-inklusif.co.id",
      location: "Bandung",
      logo_path: "companies/abc/logo.png",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("PT Karya Inklusif");
      expect(result.data.website).toBe("https://karya-inklusif.co.id");
      expect(result.data.logo_path).toBe("companies/abc/logo.png");
    }
  });

  it("accepts a minimal registration with only a name", () => {
    const result = validateCompanyRegistration({ name: "Koperasi Maju" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.description).toBeNull();
      expect(result.data.website).toBeNull();
      expect(result.data.location).toBeNull();
    }
  });

  it("rejects an empty or whitespace-only name", () => {
    const empty = validateCompanyRegistration({ name: "" });
    const blank = validateCompanyRegistration({ name: "    " });

    expect(empty.ok).toBe(false);
    expect(blank.ok).toBe(false);
    if (!blank.ok) expect(blank.fieldErrors.name).toBeDefined();
  });

  it("rejects a one-character name", () => {
    const result = validateCompanyRegistration({ name: "A" });
    expect(result.ok).toBe(false);
  });

  it("rejects a website that is not an absolute http(s) URL", () => {
    for (const website of ["example.com", "ftp://example.com", "javascript:alert(1)", "http:/x"]) {
      const result = validateCompanyRegistration({ name: "PT Contoh", website });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fieldErrors.website).toBeDefined();
    }
  });

  it("treats an empty website as absent", () => {
    const result = validateCompanyRegistration({ name: "PT Contoh", website: "   " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.website).toBeNull();
  });

  it("rejects a logo path that is a URL or escapes the bucket", () => {
    for (const logo_path of [
      "https://example.com/logo.png",
      "../../secrets.png",
      "/absolute/logo.png",
      "logo path with spaces.png",
    ]) {
      const result = validateCompanyRegistration({ name: "PT Contoh", logo_path });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.fieldErrors.logo_path).toBeDefined();
    }
  });

  it("rejects an over-long description", () => {
    const result = validateCompanyRegistration({
      name: "PT Contoh",
      description: "a".repeat(2001),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.description).toBeDefined();
  });

  it("normalizes the company name for duplicate detection", () => {
    expect(normalizeCompanyName("  PT   Karya   Inklusif ")).toBe("pt karya inklusif");
  });

  it("normalizes website values to a comparable domain", () => {
    expect(companyWebsiteDomain("https://www.Example.com/tentang?x=1")).toBe("example.com");
    expect(companyWebsiteDomain("http://example.com:8080")).toBe("example.com");
    expect(companyWebsiteDomain("example.co.id")).toBe("example.co.id");
    expect(companyWebsiteDomain("")).toBeNull();
    expect(companyWebsiteDomain(null)).toBeNull();
  });
});
