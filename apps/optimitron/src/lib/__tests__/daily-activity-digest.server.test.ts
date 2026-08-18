import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetBlock = vi.fn();
const mockPutRecord = vi.fn();
const mockQueryFilter = vi.fn();
const mockDepositedFilter = vi.fn(() => "all-deposits");

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: any[]) => any) => fn,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    referendumVote: {
      count: vi.fn(),
    },
    referral: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/contracts/server-client", () => ({
  getProvider: vi.fn(() => ({
    getBlock: mockGetBlock,
  })),
  getVoterPrizeTreasuryContract: vi.fn(() => ({
    target: "0x00000000000000000000000000000000000000ff",
    filters: {
      Deposited: mockDepositedFilter,
    },
    queryFilter: mockQueryFilter,
  })),
}));

vi.mock("@optimitron/treasury-shared/addresses", () => ({
  getContracts: vi.fn(() => ({
    voterPrizeTreasury: "0x00000000000000000000000000000000000000ff",
  })),
}));

vi.mock("@optimitron/hypercerts", () => ({
  createAppPasswordAgent: vi.fn(),
}));

import { PersonhoodVerificationStatus } from "@optimitron/db";
import { createAppPasswordAgent } from "@optimitron/hypercerts";
import { prisma } from "@/lib/prisma";
import { OPTIMITRON_CANONICAL_ORIGIN } from "@/lib/site";
import {
  buildDailyActivityDigestText,
  getDailyActivityDigestSummary,
  getDailyActivityDigestWindow,
  publishDailyActivityDigest,
} from "../daily-activity-digest.server";

describe("daily activity digest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-31T13:00:00.000Z"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    process.env.ATPROTO_DID = "did:plc:optimitron";
    process.env.ATPROTO_PASSWORD = "app-password";
    process.env.NEXTAUTH_URL = OPTIMITRON_CANONICAL_ORIGIN;
    process.env.TREASURY_CHAIN_ID = "84532";
    delete process.env.DAILY_DIGEST_TIME_ZONE;
    delete process.env.ATPROTO_PDS_URL;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("summarizes the previous Chicago day and includes on-chain deposits", async () => {
    vi.mocked(prisma.referendumVote.count)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(5);
    vi.mocked(prisma.referral.count).mockResolvedValueOnce(3);
    mockQueryFilter.mockResolvedValueOnce([
      {
        args: [
          "0x00000000000000000000000000000000000000aa",
          250_000_000n,
          250_000_000n,
        ],
        blockNumber: 100,
      },
      {
        args: [
          "0x00000000000000000000000000000000000000bb",
          100_000_000n,
          100_000_000n,
        ],
        blockNumber: 101,
      },
    ]);
    mockGetBlock
      .mockResolvedValueOnce({
        timestamp: Math.floor(new Date("2026-03-30T18:00:00.000Z").getTime() / 1000),
      })
      .mockResolvedValueOnce({
        timestamp: Math.floor(new Date("2026-03-31T07:00:00.000Z").getTime() / 1000),
      });

    const summary = await getDailyActivityDigestSummary();

    expect(summary).toEqual({
      dateKey: "2026-03-30",
      label: "Mar 30, 2026",
      timeZone: "America/Chicago",
      totalVotes: 12,
      verifiedVotes: 5,
      referralSignups: 3,
      prizeDepositCount: 1,
      prizeDepositAmount: "250000000",
      hasActivity: true,
    });
    expect(prisma.referendumVote.count).toHaveBeenNthCalledWith(1, {
      where: {
        deletedAt: null,
        createdAt: {
          gte: new Date("2026-03-30T05:00:00.000Z"),
          lt: new Date("2026-03-31T05:00:00.000Z"),
        },
        person: {
          deletedAt: null,
          lifeStatus: "LIVING",
        },
        voteSource: "SELF",
      },
    });
    expect(prisma.referendumVote.count).toHaveBeenNthCalledWith(2, {
      where: {
        deletedAt: null,
        createdAt: {
          gte: new Date("2026-03-30T05:00:00.000Z"),
          lt: new Date("2026-03-31T05:00:00.000Z"),
        },
        person: {
          deletedAt: null,
          lifeStatus: "LIVING",
        },
        user: {
          personhoodVerifications: {
            some: {
              status: PersonhoodVerificationStatus.VERIFIED,
              deletedAt: null,
            },
          },
        },
        voteSource: "SELF",
      },
    });
  });

  it("builds a compact multiline Bluesky post", () => {
    const text = buildDailyActivityDigestText(
      {
        dateKey: "2026-03-30",
        label: "Mar 30, 2026",
        timeZone: "America/Chicago",
        totalVotes: 12,
        verifiedVotes: 5,
        referralSignups: 3,
        prizeDepositCount: 2,
        prizeDepositAmount: "1250000000",
        hasActivity: true,
      },
      OPTIMITRON_CANONICAL_ORIGIN,
    );

    expect(text).toBe(
      [
        "Optimitron daily digest for Mar 30, 2026",
        "12 votes cast",
        "5 verified with personhood checks",
        "3 referrals captured",
        "2 PRIZE deposits totaling $1,250",
        `${OPTIMITRON_CANONICAL_ORIGIN}/scoreboard`,
      ].join("\n"),
    );
  });

  it("upserts one post per day with a deterministic rkey", async () => {
    vi.mocked(prisma.referendumVote.count)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1);
    vi.mocked(prisma.referral.count).mockResolvedValueOnce(0);
    mockQueryFilter.mockResolvedValueOnce([]);
    vi.mocked(createAppPasswordAgent).mockResolvedValueOnce({
      com: {
        atproto: {
          repo: {
            putRecord: mockPutRecord.mockResolvedValue({
              data: {
                uri: "at://did:plc:optimitron/app.bsky.feed.post/daily-digest-2026-03-30",
                cid: "bafytest",
              },
            }),
          },
        },
      },
    } as any);

    const result = await publishDailyActivityDigest();

    expect(mockPutRecord).toHaveBeenCalledWith({
      repo: "did:plc:optimitron",
      collection: "app.bsky.feed.post",
      rkey: "daily-digest-2026-03-30",
      record: expect.objectContaining({
        $type: "app.bsky.feed.post",
        text: [
          "Optimitron daily digest for Mar 30, 2026",
          "4 votes cast",
          "1 verified with personhood checks",
          `${OPTIMITRON_CANONICAL_ORIGIN}/scoreboard`,
        ].join("\n"),
        langs: ["en"],
      }),
    });
    expect(result).toEqual({
      status: "published",
      reason: null,
      summary: {
        dateKey: "2026-03-30",
        label: "Mar 30, 2026",
        timeZone: "America/Chicago",
        totalVotes: 4,
        verifiedVotes: 1,
        referralSignups: 0,
        prizeDepositCount: 0,
        prizeDepositAmount: "0",
        hasActivity: true,
      },
      text: [
        "Optimitron daily digest for Mar 30, 2026",
        "4 votes cast",
        "1 verified with personhood checks",
        `${OPTIMITRON_CANONICAL_ORIGIN}/scoreboard`,
      ].join("\n"),
      ref: {
        uri: "at://did:plc:optimitron/app.bsky.feed.post/daily-digest-2026-03-30",
        cid: "bafytest",
        href: "https://bsky.app/profile/did:plc:optimitron/post/daily-digest-2026-03-30",
        rkey: "daily-digest-2026-03-30",
      },
    });
  });

  it("skips publication when the day has no activity", async () => {
    vi.mocked(prisma.referendumVote.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    vi.mocked(prisma.referral.count).mockResolvedValueOnce(0);
    mockQueryFilter.mockResolvedValueOnce([]);

    const result = await publishDailyActivityDigest();

    expect(result).toEqual({
      status: "skipped",
      reason: "no-activity",
      summary: {
        dateKey: "2026-03-30",
        label: "Mar 30, 2026",
        timeZone: "America/Chicago",
        totalVotes: 0,
        verifiedVotes: 0,
        referralSignups: 0,
        prizeDepositCount: 0,
        prizeDepositAmount: "0",
        hasActivity: false,
      },
      text: null,
      ref: null,
    });
    expect(createAppPasswordAgent).not.toHaveBeenCalled();
  });

  it("computes the previous local-day window in America/Chicago", () => {
    const window = getDailyActivityDigestWindow(new Date("2026-03-31T13:00:00.000Z"));

    expect(window).toEqual({
      dateKey: "2026-03-30",
      label: "Mar 30, 2026",
      timeZone: "America/Chicago",
      start: new Date("2026-03-30T05:00:00.000Z"),
      end: new Date("2026-03-31T05:00:00.000Z"),
    });
  });
});
