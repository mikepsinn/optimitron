import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getPersonalAlignmentState: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/alignment-report.server", () => ({
  getPersonalAlignmentState: mocks.getPersonalAlignmentState,
}));

import { GET } from "./route";

describe("alignment route", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset();
    mocks.getPersonalAlignmentState.mockReset();
  });

  it("returns 401 when the user is not authenticated", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the authenticated user's personal alignment state", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    mocks.getPersonalAlignmentState.mockResolvedValue({
      status: "ready",
      report: {
        generatedAt: "2026-03-12T00:00:00.000Z",
        allocationCount: 3,
        selectedItemCount: 3,
        totalPossiblePairs: 3,
        completionRatio: 1,
        isPreliminary: false,
        topPriorities: [],
        ranking: [],
        politicians: [],
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.getPersonalAlignmentState).toHaveBeenCalledWith("user-1");
    await expect(response.json()).resolves.toMatchObject({
      status: "ready",
    });
  });
});
