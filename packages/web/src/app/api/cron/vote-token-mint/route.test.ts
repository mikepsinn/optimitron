import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthorizedCronRequest: vi.fn(),
  findMany: vi.fn(),
  updateMany: vi.fn(),
  getMinterWallet: vi.fn(),
  getVoteTokenContract: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  isAuthorizedCronRequest: mocks.isAuthorizedCronRequest,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    voteTokenMint: {
      findMany: mocks.findMany,
      updateMany: mocks.updateMany,
    },
  },
}));

vi.mock("ethers", () => ({
  ethers: {
    keccak256: (data: Uint8Array) => `0x${Buffer.from(data).toString("hex").padEnd(64, "0")}`,
    toUtf8Bytes: (str: string) => new TextEncoder().encode(str),
  },
}));

vi.mock("@/lib/contracts/server-client", () => ({
  getMinterWallet: mocks.getMinterWallet,
  getVoteTokenContract: mocks.getVoteTokenContract,
}));

import { GET } from "./route";

function makeRequest() {
  return new Request("http://localhost/api/cron/vote-token-mint");
}

describe("GET /api/cron/vote-token-mint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 401 for unauthorized requests", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(false);

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 0 processed when no pending mints", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.findMany.mockResolvedValue([]);

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      processed: 0,
      message: "No pending mints",
    });
  });

  it("processes pending mints and confirms on successful tx", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.findMany.mockResolvedValue([
      {
        id: "mint_1",
        walletAddress: "0xabc",
        referendumId: "ref_1",
        nullifierHash: "null_1",
        amount: "1000000000000000000",
      },
      {
        id: "mint_2",
        walletAddress: "0xdef",
        referendumId: "ref_2",
        nullifierHash: "null_2",
        amount: "1000000000000000000",
      },
    ]);
    mocks.updateMany.mockResolvedValue({ count: 2 });

    const mockTx = { wait: vi.fn().mockResolvedValue({ hash: "0xtxhash" }) };
    const mockContract = {
      batchMintForVoters: vi.fn().mockResolvedValue(mockTx),
    };
    mocks.getMinterWallet.mockReturnValue({});
    mocks.getVoteTokenContract.mockReturnValue(mockContract);

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.processed).toBe(2);
    expect(data.ids).toEqual(["mint_1", "mint_2"]);
    expect(data.txHash).toBe("0xtxhash");

    // Should have marked SUBMITTED then CONFIRMED
    expect(mocks.updateMany).toHaveBeenCalledTimes(2);
    expect(mocks.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: ["mint_1", "mint_2"] } },
      data: { status: "SUBMITTED" },
    });
    expect(mocks.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: { in: ["mint_1", "mint_2"] } },
      data: { status: "CONFIRMED", txHash: "0xtxhash" },
    });
  });

  it("marks mints as FAILED when on-chain call fails", async () => {
    mocks.isAuthorizedCronRequest.mockReturnValue(true);
    mocks.findMany.mockResolvedValue([
      {
        id: "mint_1",
        walletAddress: "0xabc",
        referendumId: "ref_1",
        nullifierHash: "null_1",
        amount: "1000000000000000000",
      },
    ]);
    mocks.updateMany.mockResolvedValue({ count: 1 });

    // Minter wallet creation fails
    mocks.getMinterWallet.mockImplementation(() => {
      throw new Error("VOTE_TOKEN_MINTER_PRIVATE_KEY is not set");
    });

    const res = await GET(makeRequest());

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe("On-chain minting failed");
    expect(data.failedIds).toEqual(["mint_1"]);

    // Should have marked SUBMITTED then FAILED
    expect(mocks.updateMany).toHaveBeenCalledTimes(2);
    expect(mocks.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: { in: ["mint_1"] } },
      data: { status: "FAILED" },
    });
  });
});
