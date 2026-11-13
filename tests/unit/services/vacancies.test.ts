import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/session";
import {
  type UpdateVacancyInput,
  type VacancyDeps,
  canManageVacancy,
  getVacancyForEdit,
  updateVacancy,
} from "@/lib/services/vacancies";
import { AppError } from "@/lib/utils/errors";
import type { JobVacancyRow } from "@/types/database";

const OWN_COMPANY_ID = "company-own";
const OTHER_COMPANY_ID = "company-other";

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

function makeVacancy(overrides: Partial<JobVacancyRow> = {}): JobVacancyRow {
  return {
    id: "vacancy-1",
    company_id: OWN_COMPANY_ID,
    recruiter_id: "user-recruiter",
    title: "Backend Engineer",
    description: "Membangun layanan API.",
    required_skills: ["TypeScript"],
    employment_type: "full_time",
    location: "Jakarta",
    is_active: true,
    created_at: "2026-11-13T00:00:00.000Z",
    updated_at: "2026-11-13T00:00:00.000Z",
    ...overrides,
  };
}

function makeInput(overrides: Partial<UpdateVacancyInput> = {}): UpdateVacancyInput {
  return {
    title: "Senior Backend Engineer",
    description: "Membangun dan merawat layanan API.",
    required_skills: ["TypeScript", "PostgreSQL"],
    employment_type: "full_time",
    location: "Jakarta",
    is_active: true,
    confirm_reopen: false,
    ...overrides,
  };
}

function createDeps(options: {
  vacancy?: JobVacancyRow | null;
  isMember?: boolean;
} = {}) {
  const vacancy = options.vacancy === undefined ? makeVacancy() : options.vacancy;
  const isMember = options.isMember ?? true;

  const findVacancy = vi.fn(async () => vacancy);
  const isCompanyMember = vi.fn(async () => isMember);
  const applyUpdate = vi.fn(async (id: string, patch: Partial<JobVacancyRow>) =>
    makeVacancy({ ...patch, id }),
  );

  const deps: VacancyDeps = { findVacancy, isCompanyMember, applyUpdate };

  return { deps, findVacancy, isCompanyMember, applyUpdate };
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => null,
    (error: unknown) => error,
  );
}

describe("updateVacancy — company scope isolation", () => {
  it("lets a recruiter update a vacancy owned by their company", async () => {
    const { deps, isCompanyMember } = createDeps({ isMember: true });
    const actor = makeActor();

    const updated = await updateVacancy("vacancy-1", makeInput(), actor, deps);

    expect(isCompanyMember).toHaveBeenCalledWith(OWN_COMPANY_ID, actor.id);
    expect(updated.title).toBe("Senior Backend Engineer");
    expect(updated.required_skills).toEqual(["TypeScript", "PostgreSQL"]);
  });

  it("blocks a recruiter from another company", async () => {
    const { deps, applyUpdate } = createDeps({
      vacancy: makeVacancy({ company_id: OTHER_COMPANY_ID, recruiter_id: "user-other" }),
      isMember: false,
    });

    const error = await captureError(updateVacancy("vacancy-1", makeInput(), makeActor(), deps));

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("VACANCY_FORBIDDEN");
    expect((error as AppError).status).toBe(403);
    // Nothing is written when the scope check fails.
    expect(applyUpdate).not.toHaveBeenCalled();
  });

  it("checks membership against the vacancy's company, not a client-supplied value", async () => {
    const { deps, isCompanyMember } = createDeps({
      vacancy: makeVacancy({ company_id: OTHER_COMPANY_ID }),
      isMember: false,
    });

    const input = { ...makeInput(), company_id: OWN_COMPANY_ID } as UpdateVacancyInput;
    await captureError(updateVacancy("vacancy-1", input, makeActor(), deps));

    expect(isCompanyMember).toHaveBeenCalledWith(OTHER_COMPANY_ID, "user-recruiter");
  });

  it("never sends company_id or recruiter_id in the update patch", async () => {
    const { deps, applyUpdate } = createDeps();

    await updateVacancy("vacancy-1", makeInput(), makeActor(), deps);

    const patch = applyUpdate.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(Object.keys(patch).sort()).toEqual([
      "description",
      "employment_type",
      "is_active",
      "location",
      "required_skills",
      "title",
    ]);
  });

  it("blocks a jobseeker even when the vacancy is public", async () => {
    const { deps, isCompanyMember, applyUpdate } = createDeps();

    const error = await captureError(
      updateVacancy("vacancy-1", makeInput(), makeActor({ role: "jobseeker" }), deps),
    );

    expect((error as AppError).code).toBe("VACANCY_FORBIDDEN");
    expect(isCompanyMember).not.toHaveBeenCalled();
    expect(applyUpdate).not.toHaveBeenCalled();
  });

  it("blocks a mentor", async () => {
    const { deps, applyUpdate } = createDeps();

    const error = await captureError(
      updateVacancy("vacancy-1", makeInput(), makeActor({ role: "mentor" }), deps),
    );

    expect((error as AppError).status).toBe(403);
    expect(applyUpdate).not.toHaveBeenCalled();
  });

  it("lets an admin update any vacancy without a membership row", async () => {
    const { deps, isCompanyMember, applyUpdate } = createDeps({
      vacancy: makeVacancy({ company_id: OTHER_COMPANY_ID }),
      isMember: false,
    });

    await updateVacancy("vacancy-1", makeInput(), makeActor({ role: "admin" }), deps);

    expect(isCompanyMember).not.toHaveBeenCalled();
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });

  it("reports an unknown vacancy as not found", async () => {
    const { deps, applyUpdate } = createDeps({ vacancy: null });

    const error = await captureError(updateVacancy("missing", makeInput(), makeActor(), deps));

    expect((error as AppError).code).toBe("VACANCY_NOT_FOUND");
    expect((error as AppError).status).toBe(404);
    expect(applyUpdate).not.toHaveBeenCalled();
  });
});

describe("updateVacancy — closed vacancy lifecycle", () => {
  it("requires confirmation before editing a closed vacancy", async () => {
    const { deps, applyUpdate } = createDeps({
      vacancy: makeVacancy({ is_active: false }),
    });

    const error = await captureError(updateVacancy("vacancy-1", makeInput(), makeActor(), deps));

    expect((error as AppError).code).toBe("VACANCY_CLOSED_CONFIRMATION_REQUIRED");
    expect((error as AppError).status).toBe(409);
    expect(applyUpdate).not.toHaveBeenCalled();
  });

  it("applies the update once the recruiter confirms reopening", async () => {
    const { deps, applyUpdate } = createDeps({
      vacancy: makeVacancy({ is_active: false }),
    });

    const updated = await updateVacancy(
      "vacancy-1",
      makeInput({ confirm_reopen: true, is_active: true }),
      makeActor(),
      deps,
    );

    expect(applyUpdate).toHaveBeenCalledTimes(1);
    expect(updated.is_active).toBe(true);
  });

  it("allows closing an active vacancy without the reopen confirmation", async () => {
    const { deps } = createDeps({ vacancy: makeVacancy({ is_active: true }) });

    const updated = await updateVacancy(
      "vacancy-1",
      makeInput({ is_active: false, confirm_reopen: false }),
      makeActor(),
      deps,
    );

    expect(updated.is_active).toBe(false);
  });
});

describe("getVacancyForEdit", () => {
  it("returns the vacancy for an authorized recruiter", async () => {
    const { deps } = createDeps();

    const vacancy = await getVacancyForEdit("vacancy-1", makeActor(), deps);

    expect(vacancy.id).toBe("vacancy-1");
  });

  it("refuses a recruiter outside the vacancy's company", async () => {
    const { deps } = createDeps({ isMember: false });

    const error = await captureError(getVacancyForEdit("vacancy-1", makeActor(), deps));

    expect((error as AppError).status).toBe(403);
  });
});

describe("canManageVacancy", () => {
  it("allows admins, member recruiters only", () => {
    expect(canManageVacancy(makeActor({ role: "admin" }), false)).toBe(true);
    expect(canManageVacancy(makeActor(), true)).toBe(true);
    expect(canManageVacancy(makeActor(), false)).toBe(false);
    expect(canManageVacancy(makeActor({ role: "jobseeker" }), true)).toBe(false);
    expect(canManageVacancy(makeActor({ role: "mentor" }), true)).toBe(false);
  });
});
