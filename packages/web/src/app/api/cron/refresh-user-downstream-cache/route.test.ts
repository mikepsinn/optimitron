import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthorizedCronRequest: vi.fn(),
  refreshUserDownstreamCache: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  isAuthorizedCronRequest: mocks.isAuthorizedCronRequest,
}));

vi.mock("@/lib/jobs/refresh-user-downstream-cache.server", () => ({
  refreshUserDownstreamCache: mocks.refreshUserDownstreamCache,
}));

import { GET } from "./route";

describe("refresh user downstream cache cron route", () => {
  beforeEach(() => {
    mocks.isAuthorizedCronRequest.mockReset();
    mocks.refreshUserDownstreamCache.mockReset();
  });

  it("rejects unauthorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(false);

    const response = await GET(
      new Request("http://localhost/api/cron/refresh-user-downstream-cache"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the cache refresh summary for authorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.refreshUserDownstreamCache.mockResolvedValue({
      refreshedUsers: 3,
      resetUsers: 12,
    });

    const response = await GET(
      new Request("http://localhost/api/cron/refresh-user-downstream-cache"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      refreshedUsers: 3,
      resetUsers: 12,
    });
  });
});
