import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserMock, createClientMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { GET } from "@/app/api/jobs/companies/route";

function query(result: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe("GET /api/jobs/companies", () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    createClientMock.mockReset();
  });

  it("returns 401 before database access when unauthenticated", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns 403 for non-recruiters", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1", role: "jobseeker" });

    const response = await GET();

    expect(response.status).toBe(403);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("filters memberships by the session recruiter and returns only verified companies", async () => {
    const memberships = query({
      data: [{ company_id: "company-1" }, { company_id: "company-1" }],
      error: null,
    });
    const companies = query({
      data: [{ id: "company-1", name: "Kestara Example" }],
      error: null,
    });
    getCurrentUserMock.mockResolvedValue({ id: "recruiter-1", role: "recruiter" });
    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) =>
        table === "company_memberships" ? memberships : companies,
      ),
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(memberships.eq).toHaveBeenNthCalledWith(1, "user_id", "recruiter-1");
    expect(memberships.eq).toHaveBeenNthCalledWith(2, "membership_status", "verified");
    expect(companies.in).toHaveBeenCalledWith("id", ["company-1"]);
    expect(payload.data.companies).toEqual([{ id: "company-1", name: "Kestara Example" }]);
  });

  it("returns an empty list without querying company data when no verified memberships exist", async () => {
    const memberships = query({ data: [], error: null });
    const from = vi.fn(() => memberships);
    getCurrentUserMock.mockResolvedValue({ id: "recruiter-1", role: "recruiter" });
    createClientMock.mockResolvedValue({ from });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.companies).toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("surfaces database failures as an error response", async () => {
    const memberships = query({ data: null, error: { message: "database unavailable" } });
    getCurrentUserMock.mockResolvedValue({ id: "recruiter-1", role: "recruiter" });
    createClientMock.mockResolvedValue({ from: vi.fn(() => memberships) });

    const response = await GET();

    expect(response.status).toBe(500);
  });
});
