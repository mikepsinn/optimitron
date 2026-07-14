import { TaskFundingTargetStatus, TaskStatus } from "@optimitron/db/enums";
import { describe, expect, it } from "vitest";
import type { TaskFundingStatus } from "./status.server";
import {
  type FundingTask,
  getFundingDenominator,
  rankFundingTasks,
} from "./fundable-tasks.server";

function task(input: {
  compensationCents?: bigint;
  expectedValueUsd?: number | null;
  id: string;
  targetCents?: bigint;
  title?: string;
}) {
  return {
    compensationMaxAmountMinorUnits: input.compensationCents ?? null,
    fundingTarget:
      input.targetCents == null
        ? null
        : { targetAmountCents: input.targetCents },
    id: input.id,
    isPublic: true,
    marginalImpactFrame: {
      expectedEconomicValueUsdBase: input.expectedValueUsd ?? null,
    },
    selectedImpactFrame: {
      expectedEconomicValueUsdBase: 999_999_999,
    },
    status: TaskStatus.ACTIVE,
    title: input.title ?? input.id,
  } as unknown as FundingTask;
}

function funding(
  status: TaskFundingTargetStatus,
  remainingUsdCents: bigint,
): TaskFundingStatus {
  return {
    committedUsdCents: 0n,
    individualCount: 0,
    latestPledgeAt: null,
    organizationCount: 0,
    paidUsdCents: 0n,
    percentToTarget: 0,
    pledgedUsdCents: 0n,
    pledgerCount: 0,
    remainingUsdCents,
    status,
    targetUsdCents: remainingUsdCents,
    unitBreakdown: [],
  };
}

describe("fundable task ranking", () => {
  it("uses the remaining open target as the next-dollar denominator", () => {
    const candidate = task({
      expectedValueUsd: 3_000,
      id: "open",
      targetCents: 100_000n,
    });

    expect(
      getFundingDenominator(
        candidate,
        funding(TaskFundingTargetStatus.OPEN, 30_000n),
      ),
    ).toEqual({ denominatorCents: 30_000n, fundingSource: "target" });
  });

  it("excludes closed, fully funded, and unestimated targets", () => {
    const closed = task({
      expectedValueUsd: 10_000,
      id: "closed",
      targetCents: 100_000n,
    });
    const full = task({
      expectedValueUsd: 10_000,
      id: "full",
      targetCents: 100_000n,
    });
    const unestimated = task({ id: "unestimated", targetCents: 100_000n });
    const statuses = new Map([
      [closed.id, funding(TaskFundingTargetStatus.THRESHOLD_MET, 50_000n)],
      [full.id, funding(TaskFundingTargetStatus.OPEN, 0n)],
      [unestimated.id, funding(TaskFundingTargetStatus.OPEN, 100_000n)],
    ]);

    expect(rankFundingTasks([closed, full, unestimated], statuses)).toEqual([]);
  });

  it("ranks open targets and fixed worker payouts by expected value per dollar", () => {
    const target = task({
      expectedValueUsd: 30_000,
      id: "target",
      targetCents: 100_000n,
    });
    const payout = task({
      compensationCents: 10_000n,
      expectedValueUsd: 20_000,
      id: "payout",
    });
    const statuses = new Map([
      [target.id, funding(TaskFundingTargetStatus.OPEN, 20_000n)],
    ]);

    expect(
      rankFundingTasks([target, payout], statuses).map(({ task }) => task.id),
    ).toEqual(["payout", "target"]);
  });

  it("does not price a task from inherited downstream value", () => {
    const candidate = task({
      id: "unestimated-marginal-value",
      targetCents: 100_000n,
    });

    expect(
      rankFundingTasks(
        [candidate],
        new Map([
          [candidate.id, funding(TaskFundingTargetStatus.OPEN, 100_000n)],
        ]),
      ),
    ).toEqual([]);
  });
});
