import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetBlock = vi.fn();
const mockQueryFilter = vi.fn();
const mockDepositedFilter = vi.fn((walletAddress: string) => walletAddress);

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: any[]) => any) => fn,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    voteTokenMint: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/personhood.server", () => ({
  getPersonhoodSummary: vi.fn(),
}));

vi.mock("@/lib/verified-votes.server", () => ({
  getVerifiedVoteStats: vi.fn(),
}));

vi.mock("@/lib/prize-deposit-hypercert.server", () => ({
  getPublishedPrizeDepositActivity: vi.fn(),
}));

vi.mock("@/lib/contracts/server-client", () => ({
  getProvider: vi.fn(() => ({
    getBlock: mockGetBlock,
  })),
  getVoterPrizeTreasuryContract: vi.fn(() => ({
    filters: {
      Deposited: mockDepositedFilter,
    },
    queryFilter: mockQueryFilter,
  })),
}));

import { prisma } from "@/lib/prisma";
import { getPersonhoodSummary } from "@/lib/personhood.server";
import { getPublishedPrizeDepositActivity } from "@/lib/prize-deposit-hypercert.server";
import { getVerifiedVoteStats } from "@/lib/verified-votes.server";
import { getImpactReceipts } from "../impact-receipts.server";

describe("getImpactReceipts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.TREASURY_CHAIN_ID = "84532";
    vi.mocked(getPublishedPrizeDepositActivity).mockResolvedValue(null);
  });

  it("combines personhood, referral, and on-chain prize deposit receipts", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      socialAccounts: [
        { walletAddress: "0x00000000000000000000000000000000000000aa" },
      ],
    } as any);
    vi.mocked(prisma.voteTokenMint.findMany).mockResolvedValueOnce([
      { walletAddress: "0x00000000000000000000000000000000000000aa" },
    ] as any);
    vi.mocked(getPersonhoodSummary).mockResolvedValueOnce({
      isVerified: true,
      personhoodProvider: "WORLD_ID",
      personhoodVerifiedAt: "2026-03-30T12:00:00.000Z",
      personhoodVerificationLevel: null,
      verifiedProviders: ["WORLD_ID"],
    });
    vi.mocked(getVerifiedVoteStats).mockResolvedValueOnce({
      totalReferrals: 5,
      verifiedVotes: 3,
      pendingVerification: 2,
    });
    mockQueryFilter.mockResolvedValueOnce([
      {
        args: [
          "0x00000000000000000000000000000000000000aa",
          250_000_000n,
          250_000_000n,
        ],
        blockNumber: 123,
        transactionHash:
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    ]);
    mockGetBlock.mockResolvedValueOnce({
      timestamp: Math.floor(new Date("2026-03-29T12:00:00.000Z").getTime() / 1000),
    });
    vi.mocked(getPublishedPrizeDepositActivity).mockResolvedValueOnce({
      uri: "at://did:plc:optimitron/org.hypercerts.claim.activity/prize-deposit-aaa",
      cid: "cid-activity",
      href: "https://www.hyperscan.dev/data?did=did%3Aplc%3Aoptimitron&collection=org.hypercerts.claim.activity&rkey=prize-deposit-aaa",
      rkey: "prize-deposit-aaa",
    });

    const result = await getImpactReceipts("user_1");

    expect(result.walletCount).toBe(1);
    expect(result.items).toHaveLength(3);
    expect(result.items[0]).toMatchObject({
      title: "Verified personhood",
      statusLabel: "VERIFIED",
      href: "/profile",
    });
    expect(result.items[1]).toMatchObject({
      title: "Referral impact: 3 verified voters",
      statusLabel: "TRACKED",
      href: "#referral",
    });
    expect(result.items[2]?.title).toContain("$250");
    expect(result.items[2]).toMatchObject({
      statusLabel: "PUBLISHED",
      external: true,
      href:
        "https://www.hyperscan.dev/data?did=did%3Aplc%3Aoptimitron&collection=org.hypercerts.claim.activity&rkey=prize-deposit-aaa",
    });
    expect(mockQueryFilter).toHaveBeenCalledTimes(1);
  });

  it("shows pending referral receipts even before personhood verification lands", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      socialAccounts: [],
    } as any);
    vi.mocked(prisma.voteTokenMint.findMany).mockResolvedValueOnce([]);
    vi.mocked(getPersonhoodSummary).mockResolvedValueOnce({
      isVerified: false,
      personhoodProvider: null,
      personhoodVerifiedAt: null,
      personhoodVerificationLevel: null,
      verifiedProviders: [],
    });
    vi.mocked(getVerifiedVoteStats).mockResolvedValueOnce({
      totalReferrals: 2,
      verifiedVotes: 0,
      pendingVerification: 2,
    });

    const result = await getImpactReceipts("user_2");

    expect(result.walletCount).toBe(0);
    expect(result.items).toEqual([
      expect.objectContaining({
        title: "Referral pipeline: 2 signups",
        statusLabel: "PENDING",
        statusTone: "muted",
      }),
    ]);
  });

  it("keeps off-chain receipts when chain scanning fails", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      socialAccounts: [
        { walletAddress: "0x00000000000000000000000000000000000000bb" },
      ],
    } as any);
    vi.mocked(prisma.voteTokenMint.findMany).mockResolvedValueOnce([]);
    vi.mocked(getPersonhoodSummary).mockResolvedValueOnce({
      isVerified: true,
      personhoodProvider: "WORLD_ID",
      personhoodVerifiedAt: "2026-03-30T12:00:00.000Z",
      personhoodVerificationLevel: null,
      verifiedProviders: ["WORLD_ID"],
    });
    vi.mocked(getVerifiedVoteStats).mockResolvedValueOnce({
      totalReferrals: 0,
      verifiedVotes: 0,
      pendingVerification: 0,
    });
    mockQueryFilter.mockRejectedValueOnce(new Error("rpc down"));

    const result = await getImpactReceipts("user_3");

    expect(result.walletCount).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      title: "Verified personhood",
      statusLabel: "VERIFIED",
    });
  });
});
