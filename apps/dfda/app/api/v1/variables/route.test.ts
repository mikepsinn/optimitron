import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireSessionAuthMock } = vi.hoisted(() => ({
  requireSessionAuthMock: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: requireSessionAuthMock,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@optimitron/tracking", () => ({
  setTrackingPrismaProvider: vi.fn(),
  listTrackingVariablesForUser: vi.fn(),
  updateTrackingVariableSettingsForUser: vi.fn(),
}));

import {
  listTrackingVariablesForUser,
  updateTrackingVariableSettingsForUser,
} from "@optimitron/tracking";

import { PATCH } from "./[globalVariableId]/route";
import { GET } from "./route";

const BASE = "http://localhost:3011/api/v1/variables";

describe("REST v1 variables", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionAuthMock.mockResolvedValue({
      userId: "user-1",
      userEmail: "user-1@example.com",
    });
  });

  it("returns 401 when unauthenticated", async () => {
    requireSessionAuthMock.mockRejectedValue(
      new Error("Unauthorized - authentication required"),
    );
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
    expect(listTrackingVariablesForUser).not.toHaveBeenCalled();
  });

  it("GET lists variables with query filter and pagination for the session user", async () => {
    vi.mocked(listTrackingVariablesForUser).mockResolvedValue({
      nextCursor: null,
      variables: [{ id: "n1" }],
    });
    const res = await GET(new Request(`${BASE}?query=vit&limit=10`));
    expect(res.status).toBe(200);
    expect(listTrackingVariablesForUser).toHaveBeenCalledWith(
      { limit: 10, query: "vit" },
      "user-1",
    );
    await expect(res.json()).resolves.toEqual({
      nextCursor: null,
      variables: [{ id: "n1" }],
    });
  });

  it("PATCH merges the path globalVariableId into the settings update", async () => {
    vi.mocked(updateTrackingVariableSettingsForUser).mockResolvedValue({
      fillingType: "ZERO",
      id: "n1",
    });
    const res = await PATCH(
      new Request(`${BASE}/gv1`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fillingType: "ZERO" }),
      }),
      { params: Promise.resolve({ globalVariableId: "gv1" }) },
    );
    expect(res.status).toBe(200);
    expect(updateTrackingVariableSettingsForUser).toHaveBeenCalledWith(
      { fillingType: "ZERO", globalVariableId: "gv1" },
      "user-1",
    );
    await expect(res.json()).resolves.toEqual({
      variable: { fillingType: "ZERO", id: "n1" },
    });
  });
});
