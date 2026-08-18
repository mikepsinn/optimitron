import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthorizedCronRequest: vi.fn(),
  publishDailyActivityDigest: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  isAuthorizedCronRequest: mocks.isAuthorizedCronRequest,
}));

vi.mock("@/lib/daily-activity-digest.server", () => ({
  publishDailyActivityDigest: mocks.publishDailyActivityDigest,
}));

import { GET } from "./route";

describe("daily activity digest cron route", () => {
  beforeEach(() => {
    mocks.isAuthorizedCronRequest.mockReset();
    mocks.publishDailyActivityDigest.mockReset();
  });

  it("returns 401 for unauthorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(false);

    const response = await GET(new Request("http://localhost/api/cron/daily-activity-digest"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the publication summary for authorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.publishDailyActivityDigest.mockResolvedValue({
      status: "published",
      reason: null,
      summary: {
        dateKey: "2026-03-30",
        label: "Mar 30, 2026",
        timeZone: "America/Chicago",
        totalVotes: 12,
        verifiedVotes: 5,
        referralSignups: 3,
        prizeDepositCount: 1,
        prizeDepositAmount: "250000000",
        hasActivity: true,
      },
      text: "Optimitron daily digest for Mar 30, 2026",
      ref: {
        uri: "at://did:plc:optimitron/app.bsky.feed.post/daily-digest-2026-03-30",
        cid: "bafytest",
        href: "https://bsky.app/profile/did:plc:optimitron/post/daily-digest-2026-03-30",
        rkey: "daily-digest-2026-03-30",
      },
    });

    const response = await GET(new Request("http://localhost/api/cron/daily-activity-digest"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "published",
      reason: null,
      summary: {
        dateKey: "2026-03-30",
        label: "Mar 30, 2026",
        timeZone: "America/Chicago",
        totalVotes: 12,
        verifiedVotes: 5,
        referralSignups: 3,
        prizeDepositCount: 1,
        prizeDepositAmount: "250000000",
        hasActivity: true,
      },
      text: "Optimitron daily digest for Mar 30, 2026",
      ref: {
        uri: "at://did:plc:optimitron/app.bsky.feed.post/daily-digest-2026-03-30",
        cid: "bafytest",
        href: "https://bsky.app/profile/did:plc:optimitron/post/daily-digest-2026-03-30",
        rkey: "daily-digest-2026-03-30",
      },
    });
  });
});
