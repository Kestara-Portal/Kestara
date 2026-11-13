import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/session";
import { type CompanyDeps, type CompanyInsert, registerCompany } from "@/lib/services/companies";
import { AppError } from "@/lib/utils/errors";
import type { CompanyRow } from "@/types/database";

function makeActor(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "user-recruiter",
    email: "rekruter@example.com",
    fullName: "Rina Rekruter",
    role: "recruiter",
    accountStatus: "active",
    ...overrides,
  };
}

function makeCompany(overrides: Partial<CompanyRow> = {}): CompanyRow {
  return {
    id: "company-1",
    name: "PT Contoh",
    description: null,
    website: null,
    location: null,
    logo_path: null,
    created_by: "user-recruiter",
    created_at: "2026-11-13T00:00:00.000Z",
    updated_at: "2026-11-13T00:00:00.000Z",
    ...overrides,
  };
}

function createDeps(overrides: Partial<CompanyDeps> = {}) {
  const duplicateExists = vi.fn(async () => false);
  const insertCompany = vi.fn(async (values: CompanyInsert) => makeCompany(values));

  const deps: CompanyDeps = { duplicateExists, insertCompany, ...overrides };

  return { deps, duplicateExists, insertCompany };
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => null,
    (error: unknown) => error,
  );
}

describe("registerCompany", () => {
  it("registers a company for a recruiter and attributes it to the caller", async () => {
    const { deps, duplicateExists, insertCompany } = createDeps();
    const actor = makeActor();

    const company = await registerCompany(
      {
        name: "  PT Karya Inklusif  ",
        description: "Teknologi aksesibel.",
        website: "https://www.karya-inklusif.co.id/tentang",
        location: "Bandung",
        logo_path: null,
      },
      actor,
      deps,
    );

    expect(company.id).toBe("company-1");
    expect(duplicateExists).toHaveBeenCalledWith({
      name: "pt karya inklusif",
      domain: "karya-inklusif.co.id",
    });
    expect(insertCompany).toHaveBeenCalledWith({
      name: "PT Karya Inklusif",
      description: "Teknologi aksesibel.",
      website: "https://www.karya-inklusif.co.id/tentang",
      location: "Bandung",
      logo_path: null,
      // Never taken from the request body.
      created_by: "user-recruiter",
    });
  });

  it("allows an admin to register a company", async () => {
    const { deps, insertCompany } = createDeps();

    await registerCompany({ name: "PT Contoh" }, makeActor({ id: "user-admin", role: "admin" }), deps);

    expect(insertCompany).toHaveBeenCalledWith(
      expect.objectContaining({ created_by: "user-admin" }),
    );
  });

  it.each(["jobseeker", "mentor"] as const)("blocks a %s from registering", async (role) => {
    const { deps, duplicateExists, insertCompany } = createDeps();

    const error = await captureError(
      registerCompany({ name: "PT Contoh" }, makeActor({ role }), deps),
    );

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("FORBIDDEN");
    expect((error as AppError).status).toBe(403);
    expect(duplicateExists).not.toHaveBeenCalled();
    expect(insertCompany).not.toHaveBeenCalled();
  });

  it("rejects a duplicate company before writing", async () => {
    const { deps, insertCompany } = createDeps({
      duplicateExists: vi.fn(async () => true),
    });

    const error = await captureError(registerCompany({ name: "PT Contoh" }, makeActor(), deps));

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("DUPLICATE_COMPANY");
    expect((error as AppError).status).toBe(409);
    expect(insertCompany).not.toHaveBeenCalled();
  });

  it("maps a database unique violation to a duplicate error", async () => {
    // Exercises the real adapter mapping (unique index → 409), not just the
    // use case's own duplicate pre-check.
    const { createCompanyDeps } = await import("@/lib/services/companies-deps");

    const client = {
      rpc: async () => ({ data: false, error: null }),
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: {
                code: "23505",
                message:
                  'duplicate key value violates unique constraint "companies_name_normalized_key"',
              },
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof createCompanyDeps>[0];

    const error = await captureError(
      registerCompany({ name: "PT Contoh" }, makeActor(), createCompanyDeps(client)),
    );

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("DUPLICATE_COMPANY");
    expect((error as AppError).status).toBe(409);
  });

  it("maps a row-level-security denial to a forbidden error", async () => {
    const { createCompanyDeps } = await import("@/lib/services/companies-deps");

    const client = {
      rpc: async () => ({ data: false, error: null }),
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: {
                code: "42501",
                message: 'new row violates row-level security policy for table "companies"',
              },
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof createCompanyDeps>[0];

    const error = await captureError(
      registerCompany({ name: "PT Contoh" }, makeActor(), createCompanyDeps(client)),
    );

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("FORBIDDEN");
    expect((error as AppError).status).toBe(403);
  });
});
