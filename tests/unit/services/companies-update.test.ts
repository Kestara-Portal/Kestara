import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/session";
import {
  assertNoCompanyCollision,
  authorizeCompanyUpdate,
  updateCompany,
  type UpdateCompanyDeps,
} from "@/lib/services/companies";
import type { UpdateCompanyInput } from "@/lib/validations/company";
import { AppError } from "@/lib/utils/errors";
import type { CompanyRow } from "@/types/database";

const COMPANY_ID = "3f6c8a1e-1c2b-4a8f-9d7e-6b5a4c3d2e1f";
const RECRUITER_ID = "11111111-2222-4333-8444-555555555555";
const ADMIN_ID = "99999999-8888-4777-8666-555555555555";

function makeCompany(overrides: Partial<CompanyRow> = {}): CompanyRow {
  return {
    id: COMPANY_ID,
    name: "PT Mitra Inovasi",
    description: "Perusahaan teknologi.",
    industry: "Teknologi",
    location: "Bandung",
    website: "https://mitra-inovasi.co.id",
    size: "50-100",
    logo_path: null,
    status: "active",
    created_by: ADMIN_ID,
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

const recruiter: CurrentUser = {
  id: RECRUITER_ID,
  email: "recruiter@example.com",
  fullName: "Rani Rekruter",
  role: "recruiter",
  accountStatus: "active",
};

const admin: CurrentUser = {
  id: ADMIN_ID,
  email: "admin@example.com",
  fullName: "Andi Admin",
  role: "admin",
  accountStatus: "active",
};

const jobseeker: CurrentUser = {
  id: "77777777-6666-4555-8444-333333333333",
  email: "jobseeker@example.com",
  fullName: "Joko Pencari",
  role: "jobseeker",
  accountStatus: "active",
};

const payload: UpdateCompanyInput = {
  name: "PT Mitra Inovasi Baru",
  description: "Deskripsi baru.",
  website: "https://mitra-inovasi.co.id",
  location: "Jakarta",
  logo_path: null,
};

function makeDeps(overrides: Partial<UpdateCompanyDeps> = {}) {
  const deps: UpdateCompanyDeps = {
    findCompany: vi.fn(async () => makeCompany()),
    isCompanyMember: vi.fn(async () => true),
    findConflict: vi.fn(async () => null),
    saveCompany: vi.fn(async (_companyId: string, patch: UpdateCompanyInput) =>
      makeCompany({ ...patch }),
    ),
    ...overrides,
  };

  return deps;
}

async function expectAppError(promise: Promise<unknown>, code: string, status: number) {
  await expect(promise).rejects.toBeInstanceOf(AppError);
  try {
    await promise;
  } catch (error) {
    const appError = error as AppError;
    expect(appError.code).toBe(code);
    expect(appError.status).toBe(status);
  }
}

describe("KP-27: authorizeCompanyUpdate", () => {
  it("allows an admin regardless of membership", () => {
    expect(() => authorizeCompanyUpdate("admin", false)).not.toThrow();
  });

  it("allows a recruiter who holds an active membership", () => {
    expect(() => authorizeCompanyUpdate("recruiter", true)).not.toThrow();
  });

  it("rejects a recruiter without membership with 403 FORBIDDEN", () => {
    try {
      authorizeCompanyUpdate("recruiter", false);
      throw new Error("should have thrown");
    } catch (error) {
      const appError = error as AppError;
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.code).toBe("FORBIDDEN");
      expect(appError.status).toBe(403);
    }
  });

  it("rejects jobseeker and mentor roles", () => {
    for (const role of ["jobseeker", "mentor"]) {
      expect(() => authorizeCompanyUpdate(role, true)).toThrow(AppError);
    }
  });
});

describe("KP-27: assertNoCompanyCollision", () => {
  it("passes when there is no conflict", () => {
    expect(() => assertNoCompanyCollision(null)).not.toThrow();
  });

  it("maps a name collision to 409 COMPANY_NAME_TAKEN", () => {
    try {
      assertNoCompanyCollision({ field: "name", existingName: "PT Mitra Inovasi" });
      throw new Error("should have thrown");
    } catch (error) {
      const appError = error as AppError;
      expect(appError.code).toBe("COMPANY_NAME_TAKEN");
      expect(appError.status).toBe(409);
      expect(appError.message).toContain("PT Mitra Inovasi");
    }
  });

  it("maps a website collision to 409 COMPANY_WEBSITE_TAKEN", () => {
    try {
      assertNoCompanyCollision({ field: "website", existingName: "PT Lain" });
      throw new Error("should have thrown");
    } catch (error) {
      const appError = error as AppError;
      expect(appError.code).toBe("COMPANY_WEBSITE_TAKEN");
      expect(appError.status).toBe(409);
    }
  });
});

describe("KP-27: updateCompany use case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a company for a recruiter who is a member", async () => {
    const deps = makeDeps();

    const updated = await updateCompany(COMPANY_ID, payload, recruiter, deps);

    expect(updated.name).toBe(payload.name);
    expect(deps.isCompanyMember).toHaveBeenCalledWith(COMPANY_ID, RECRUITER_ID);
    expect(deps.saveCompany).toHaveBeenCalledWith(COMPANY_ID, payload);
  });

  it("rejects a recruiter who is not a member of that company", async () => {
    const deps = makeDeps({ isCompanyMember: vi.fn(async () => false) });

    await expectAppError(updateCompany(COMPANY_ID, payload, recruiter, deps), "FORBIDDEN", 403);
    expect(deps.saveCompany).not.toHaveBeenCalled();
  });

  it("lets an admin update any company without a membership row", async () => {
    const deps = makeDeps({ isCompanyMember: vi.fn(async () => false) });

    await updateCompany(COMPANY_ID, payload, admin, deps);

    expect(deps.isCompanyMember).not.toHaveBeenCalled();
    expect(deps.saveCompany).toHaveBeenCalledTimes(1);
  });

  it("rejects a jobseeker before touching any data", async () => {
    const deps = makeDeps();

    await expectAppError(updateCompany(COMPANY_ID, payload, jobseeker, deps), "FORBIDDEN", 403);
    expect(deps.findCompany).not.toHaveBeenCalled();
    expect(deps.saveCompany).not.toHaveBeenCalled();
  });

  it("returns 404 for a company that does not exist", async () => {
    const deps = makeDeps({ findCompany: vi.fn(async () => null) });

    await expectAppError(updateCompany(COMPANY_ID, payload, admin, deps), "NOT_FOUND", 404);
    expect(deps.saveCompany).not.toHaveBeenCalled();
  });

  it("treats a soft-deleted company as not found", async () => {
    const deps = makeDeps({
      findCompany: vi.fn(async () => makeCompany({ status: "deleted" })),
    });

    await expectAppError(updateCompany(COMPANY_ID, payload, admin, deps), "NOT_FOUND", 404);
    expect(deps.saveCompany).not.toHaveBeenCalled();
  });

  it("rejects an invalid company id with 400", async () => {
    const deps = makeDeps();

    await expectAppError(updateCompany("bukan-uuid", payload, admin, deps), "BAD_REQUEST", 400);
    expect(deps.saveCompany).not.toHaveBeenCalled();
  });

  it("checks for a name collision when the name changes", async () => {
    const deps = makeDeps({
      findConflict: vi.fn(async () => ({ field: "name" as const, existingName: "PT Kembar" })),
    });

    await expectAppError(
      updateCompany(COMPANY_ID, payload, recruiter, deps),
      "COMPANY_NAME_TAKEN",
      409,
    );
    expect(deps.findConflict).toHaveBeenCalledWith({
      companyId: COMPANY_ID,
      normalizedName: "pt mitra inovasi baru",
      normalizedWebsite: "https://mitra-inovasi.co.id",
    });
    expect(deps.saveCompany).not.toHaveBeenCalled();
  });

  it("checks for a website collision when only the website changes", async () => {
    const deps = makeDeps({
      findConflict: vi.fn(async () => ({
        field: "website" as const,
        existingName: "PT Situs Kembar",
      })),
    });

    const input: UpdateCompanyInput = {
      ...payload,
      name: "PT Mitra Inovasi",
      website: "https://situs-kembar.co.id",
    };

    await expectAppError(
      updateCompany(COMPANY_ID, input, recruiter, deps),
      "COMPANY_WEBSITE_TAKEN",
      409,
    );
    expect(deps.saveCompany).not.toHaveBeenCalled();
  });

  it("skips the collision query when name and website are unchanged", async () => {
    const deps = makeDeps();

    await updateCompany(
      COMPANY_ID,
      {
        name: "  pt mitra inovasi ",
        description: "Deskripsi lain.",
        website: "https://MITRA-INOVASI.co.id/",
        location: "Bandung",
        logo_path: null,
      },
      recruiter,
      deps,
    );

    expect(deps.findConflict).not.toHaveBeenCalled();
    expect(deps.saveCompany).toHaveBeenCalledTimes(1);
  });

  it("still resolves membership before persisting, so an unrelated company cannot be edited", async () => {
    const otherCompanyId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const deps = makeDeps({
      findCompany: vi.fn(async () => makeCompany({ id: otherCompanyId, name: "PT Lain" })),
      isCompanyMember: vi.fn(async (companyId: string) => companyId === COMPANY_ID),
    });

    await expectAppError(
      updateCompany(otherCompanyId, payload, recruiter, deps),
      "FORBIDDEN",
      403,
    );
    expect(deps.saveCompany).not.toHaveBeenCalled();
  });
});
