import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserMock, createClientMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: getCurrentUserMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { PATCH } from "@/app/api/profile/route";

function request(body: unknown) {
  return new Request("http://localhost/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    createClientMock.mockReset();
  });

  it("returns 401 before database access when unauthenticated", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await PATCH(request({ fullName: "Budi" }));

    expect(response.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("always scopes profile writes to the authenticated user and safe columns", async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "session-user",
          full_name: "Budi Santoso",
          phone_number: null,
          bio: null,
          role: "jobseeker",
        },
        error: null,
      }),
    };
    getCurrentUserMock.mockResolvedValue({ id: "session-user", role: "jobseeker" });
    createClientMock.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });

    const response = await PATCH(request({
      fullName: "Budi Santoso",
      phoneNumber: "",
      bio: "",
      id: "another-user",
      role: "admin",
    }));

    expect(response.status).toBe(200);
    expect(query.update).toHaveBeenCalledWith({
      full_name: "Budi Santoso",
      phone_number: null,
      bio: null,
    });
    expect(query.eq).toHaveBeenCalledWith("id", "session-user");
  });
});
