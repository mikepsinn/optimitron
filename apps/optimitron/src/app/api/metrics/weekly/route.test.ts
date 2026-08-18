import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthorizedCronRequest: vi.fn(),
  getWeeklyMetricsSnapshot: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  isAuthorizedCronRequest: mocks.isAuthorizedCronRequest,
}));

vi.mock("@/lib/weekly-metrics.server", () => ({
  getWeeklyMetricsSnapshot: mocks.getWeeklyMetricsSnapshot,
}));

import { GET } from "./route";

describe("weekly metrics route", () => {
  beforeEach(() => {
    mocks.isAuthorizedCronRequest.mockReset();
    mocks.getWeeklyMetricsSnapshot.mockReset();
  });

  it("returns 401 for unauthorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(false);

    const response = await GET(new Request("http://localhost/api/metrics/weekly"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.getWeeklyMetricsSnapshot).not.toHaveBeenCalled();
  });

  it("returns the snapshot for authorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    const snapshot = {
      generatedAt: "2026-07-27T13:00:00.000Z",
      current: {
        start: "2026-07-20T13:00:00.000Z",
        end: "2026-07-27T13:00:00.000Z",
        votes: 10,
        verifiedVotes: 4,
        referrals: 3,
        signups: 6,
        externalActionsPending: 2,
      },
      previous: {
        start: "2026-07-13T13:00:00.000Z",
        end: "2026-07-20T13:00:00.000Z",
        votes: 8,
        verifiedVotes: 3,
        referrals: 2,
        signups: 5,
        externalActionsPending: 4,
      },
    };
    mocks.getWeeklyMetricsSnapshot.mockResolvedValue(snapshot);

    const response = await GET(new Request("http://localhost/api/metrics/weekly"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(snapshot);
  });

  it("returns 500 when the snapshot query fails", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.getWeeklyMetricsSnapshot.mockRejectedValue(new Error("db down"));

    const response = await GET(new Request("http://localhost/api/metrics/weekly"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to compute weekly metrics.",
    });
  });
});
