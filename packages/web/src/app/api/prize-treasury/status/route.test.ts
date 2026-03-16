import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  getProvider: vi.fn(),
  getVoterPrizeTreasuryContract: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    prizeTreasuryDeposit: { findMany: mocks.findMany },
    voteTokenMint: { count: mocks.count },
  },
}));

vi.mock("@/lib/contracts/server-client", () => ({
  getProvider: mocks.getProvider,
  getVoterPrizeTreasuryContract: mocks.getVoterPrizeTreasuryContract,
}));

import { GET } from "./route";

describe("GET /api/prize-treasury/status", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: contract not deployed (getVoterPrizeTreasuryContract throws)
    mocks.getVoterPrizeTreasuryContract.mockImplementation(() => {
      throw new Error("VoterPrizeTreasury not deployed on chain 84532");
    });
  });

  it("returns DB-only data when no deposits exist", async () => {
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalDeposited).toBe("0");
    expect(data.depositCount).toBe(0);
    expect(data.uniqueDepositors).toBe(0);
    expect(data.confirmedVoteMints).toBe(0);
  });

  it("aggregates deposits correctly", async () => {
    mocks.findMany.mockResolvedValue([
      { amount: "1000000", depositorAddress: "0xaaa" },
      { amount: "2000000", depositorAddress: "0xbbb" },
      { amount: "500000", depositorAddress: "0xaaa" },
    ]);
    mocks.count.mockResolvedValue(5);

    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalDeposited).toBe("3500000");
    expect(data.depositCount).toBe(3);
    expect(data.uniqueDepositors).toBe(2);
    expect(data.confirmedVoteMints).toBe(5);
  });

  it("includes on-chain data when contract is reachable", async () => {
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const mockContract = {
      totalAssets: vi.fn().mockResolvedValue(5000000n),
      currentHealthMetric: vi.fn().mockResolvedValue(120n),
      currentIncomeMetric: vi.fn().mockResolvedValue(60n),
      thresholdMet: vi.fn().mockResolvedValue(true),
      maturityTimestamp: vi.fn().mockResolvedValue(1900000000n),
      voteTotalSupplySnapshot: vi.fn().mockResolvedValue(100000n),
      sharePrice: vi.fn().mockResolvedValue(1050000n),
      depositorCount: vi.fn().mockResolvedValue(42n),
    };

    mocks.getProvider.mockReturnValue({});
    mocks.getVoterPrizeTreasuryContract.mockReturnValue(mockContract);

    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalAssets).toBe("5000000");
    expect(data.healthMetric).toBe("120");
    expect(data.incomeMetric).toBe("60");
    expect(data.thresholdMet).toBe(true);
    expect(data.maturityTimestamp).toBe("1900000000");
    expect(data.voteTotalSupplySnapshot).toBe("100000");
    expect(data.sharePrice).toBe("1050000");
    expect(data.onChainDepositorCount).toBe("42");
  });

  it("returns DB-only data when contract is unreachable", async () => {
    mocks.findMany.mockResolvedValue([
      { amount: "1000000", depositorAddress: "0xaaa" },
    ]);
    mocks.count.mockResolvedValue(1);

    // Contract throws
    mocks.getVoterPrizeTreasuryContract.mockImplementation(() => {
      throw new Error("Network error");
    });

    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalDeposited).toBe("1000000");
    expect(data.depositCount).toBe(1);
    // on-chain fields should not be present
    expect(data.totalAssets).toBeUndefined();
  });
});
