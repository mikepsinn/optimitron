import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthorizedCronRequest: vi.fn(),
  syncAlignmentBenchmarkPoliticians: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  isAuthorizedCronRequest: mocks.isAuthorizedCronRequest,
}));

vi.mock("@/lib/alignment-politicians.server", () => ({
  syncAlignmentBenchmarkPoliticians: mocks.syncAlignmentBenchmarkPoliticians,
}));

import { GET } from "./route";

describe("alignment politician cron route", () => {
  beforeEach(() => {
    mocks.isAuthorizedCronRequest.mockReset();
    mocks.syncAlignmentBenchmarkPoliticians.mockReset();
  });

  it("rejects unauthorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(false);

    const response = await GET(new Request("http://localhost/api/cron/alignment-politicians"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns sync results for authorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.syncAlignmentBenchmarkPoliticians.mockResolvedValue({
      skipped: false,
      syncedPoliticians: 6,
      syncedVotes: 60,
      updatedExternalIds: ["S000033"],
    });

    const response = await GET(new Request("http://localhost/api/cron/alignment-politicians"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      skipped: false,
      syncedPoliticians: 6,
    });
  });
});
