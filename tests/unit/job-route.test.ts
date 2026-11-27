import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserMock, createClientMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { POST } from "@/app/api/jobs/route";

const validPayload = {
  companyId: "7b15225c-2a7f-4de7-a634-47c9a4f07a72",
  title: "Backend Engineer",
  description: "Membangun dan memelihara layanan backend untuk platform.",
  location: "Jakarta",
  employmentType: "Penuh waktu",
  skills: ["TypeScript"],
};

function request(body: unknown) {
  return new Request("http://localhost/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/jobs", () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    createClientMock.mockReset();
  });

  it("returns 401 before database access when unauthenticated", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await POST(request(validPayload));

    expect(response.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns 403 before database access for non-recruiters", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1", role: "jobseeker" });

    const response = await POST(request(validPayload));

    expect(response.status).toBe(403);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns 422 and does not call the RPC for invalid skills", async () => {
    const rpc = vi.fn();
    getCurrentUserMock.mockResolvedValue({ id: "recruiter-1", role: "recruiter" });
    createClientMock.mockResolvedValue({ rpc });

    const response = await POST(request({ ...validPayload, skills: ["  "] }));

    expect(response.status).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns 403 when the selected company has no verified membership", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42501" },
    });
    getCurrentUserMock.mockResolvedValue({ id: "recruiter-1", role: "recruiter" });
    createClientMock.mockResolvedValue({ rpc });

    const response = await POST(request(validPayload));

    expect(response.status).toBe(403);
    expect(rpc).toHaveBeenCalledWith(
      "create_job_with_skills",
      expect.objectContaining({ p_company_id: validPayload.companyId }),
    );
  });

  it("creates through the RPC and uses no client-supplied owner field", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "job-1", error: null });
    getCurrentUserMock.mockResolvedValue({ id: "recruiter-1", role: "recruiter" });
    createClientMock.mockResolvedValue({ rpc });

    const response = await POST(request({
      ...validPayload,
      created_by: "attacker-id",
      recruiter_id: "attacker-id",
      status: "draft",
    }));

    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("create_job_with_skills", {
      p_company_id: validPayload.companyId,
      p_title: validPayload.title,
      p_description: validPayload.description,
      p_location: validPayload.location,
      p_employment_type: validPayload.employmentType,
      p_skills: validPayload.skills,
    });
  });
});
