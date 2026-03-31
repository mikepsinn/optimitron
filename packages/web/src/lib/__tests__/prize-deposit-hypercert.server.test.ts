import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTransactionReceipt: vi.fn(),
  parseLog: vi.fn(),
  createAppPasswordAgent: vi.fn(),
  createAtprotoPublisher: vi.fn(),
  createDepositHypercertDraft: vi.fn(),
  publishDepositHypercertDraft: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: any[]) => any) => fn,
}));

vi.mock("@/lib/contracts/server-client", () => ({
  getProvider: vi.fn(() => ({
    getTransactionReceipt: mocks.getTransactionReceipt,
  })),
  getVoterPrizeTreasuryContract: vi.fn(() => ({
    target: "0x0000000000000000000000000000000000000abc",
    interface: {
      parseLog: mocks.parseLog,
    },
  })),
}));

vi.mock("@optimitron/hypercerts", () => ({
  ACTIVITY_COLLECTION: "org.hypercerts.claim.activity",
  buildHyperscanDataUrl: vi.fn(
    (_did: string, _collection: string, rkey?: string) =>
      `https://www.hyperscan.dev/data?rkey=${rkey ?? ""}`,
  ),
  createAppPasswordAgent: mocks.createAppPasswordAgent,
  createAtprotoPublisher: mocks.createAtprotoPublisher,
  createDepositHypercertDraft: mocks.createDepositHypercertDraft,
  publishDepositHypercertDraft: mocks.publishDepositHypercertDraft,
}));

import {
  getPublishedPrizeDepositActivity,
  publishPrizeDepositHypercert,
  resolvePrizeDepositEvent,
} from "../prize-deposit-hypercert.server";

describe("prize-deposit-hypercert helpers", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    process.env.TREASURY_CHAIN_ID = "84532";
    process.env.ATPROTO_DID = "did:plc:optimitron";
    process.env.ATPROTO_PASSWORD = "app-password";
    delete process.env.ATPROTO_PDS_URL;
  });

  it("parses a deposit event from the treasury transaction receipt", async () => {
    mocks.getTransactionReceipt.mockResolvedValueOnce({
      logs: [
        {
          address: "0x0000000000000000000000000000000000000abc",
          topics: ["0x01"],
          data: "0x02",
        },
      ],
    });
    mocks.parseLog.mockReturnValueOnce({
      name: "Deposited",
      args: [
        "0x00000000000000000000000000000000000000aa",
        500_000_000n,
        500_000_000n,
      ],
    });

    const result = await resolvePrizeDepositEvent(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );

    expect(result).toEqual({
      txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      chainId: 84532,
      depositorAddress: "0x00000000000000000000000000000000000000AA",
      amount: "500000000",
      sharesReceived: "500000000",
    });
  });

  it("finds a published deposit activity by deterministic rkey", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          uri: "at://did:plc:optimitron/org.hypercerts.claim.activity/prize-deposit-abc",
          cid: "cid-1",
        }),
      }),
    );

    const result = await getPublishedPrizeDepositActivity(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );

    expect(result).toEqual({
      uri: "at://did:plc:optimitron/org.hypercerts.claim.activity/prize-deposit-abc",
      cid: "cid-1",
      href: "https://www.hyperscan.dev/data?rkey=prize-deposit-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      rkey: "prize-deposit-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
  });

  it("publishes with deterministic activity and measurement rkeys", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );
    mocks.createAppPasswordAgent.mockResolvedValueOnce({ com: { atproto: { repo: {} } } });
    mocks.createAtprotoPublisher.mockReturnValueOnce({ createRecord: vi.fn() });
    mocks.createDepositHypercertDraft.mockReturnValueOnce({ activity: {}, measurement: {} });
    mocks.publishDepositHypercertDraft.mockResolvedValueOnce({
      refs: {
        activity: {
          uri: "at://did:plc:optimitron/org.hypercerts.claim.activity/prize-deposit-abc",
          cid: "cid-activity",
        },
        measurement: {
          uri: "at://did:plc:optimitron/org.hypercerts.context.measurement/prize-deposit-m-abc",
          cid: "cid-measurement",
        },
      },
    });

    const result = await publishPrizeDepositHypercert({
      txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      chainId: 84532,
      depositorAddress: "0x00000000000000000000000000000000000000AA",
      amount: "500000000",
      sharesReceived: "500000000",
    });

    expect(mocks.publishDepositHypercertDraft).toHaveBeenCalledWith(
      expect.anything(),
      "did:plc:optimitron",
      { activity: {}, measurement: {} },
      {
        activityRkey: "prize-deposit-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        measurementRkey: "prize-deposit-m-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    );
    expect(result).toEqual({
      status: "published",
      ref: {
        uri: "at://did:plc:optimitron/org.hypercerts.claim.activity/prize-deposit-abc",
        cid: "cid-activity",
        href: "https://www.hyperscan.dev/data?rkey=prize-deposit-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        rkey: "prize-deposit-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    });
  });
});
