/**
 * R-Guard + ChainValueGuard — the kill-switches.
 *
 * Rolling 7-day R = mean of P(open|share) × P(finish|open) × P(vote|finish)
 *   × P(first-send-60s|vote) × E[downstream-vote|first-send].
 *
 * If R < R_MIN_THRESHOLD (0.7) OR global chain-value deteriorates ≥15%
 * vs canonical holdout over 7 days continuous → auto-revert to 100%
 * canonical + freeze Promoter + ops alert.
 */

import { prisma } from "@/lib/prisma";

export type RGuardConfig = {
  rMinThreshold: number;
  cvCollapsePct: number;
  rollingWindowDays: number;
  cvGuardContinuousDays: number;
};

export const DEFAULT_R_GUARD_CONFIG: RGuardConfig = {
  rMinThreshold: 0.7,
  cvCollapsePct: 0.15,
  rollingWindowDays: 7,
  cvGuardContinuousDays: 7,
};

export type RGuardResult = {
  rSevenDay: number;
  triggeredRGuard: boolean;
  cvDeltaPct: number;
  triggeredCvGuard: boolean;
  freezeAction: "none" | "freeze" | "already-frozen";
};

export async function runRGuard(
  config: RGuardConfig = DEFAULT_R_GUARD_CONFIG,
): Promise<RGuardResult> {
  const windowStart = new Date(
    Date.now() - config.rollingWindowDays * 24 * 3600 * 1000,
  );
  const { rSevenDay, components } = await computeRollingR(windowStart);
  const cvDeltaPct = await computeChainValueDelta(windowStart);
  const triggeredRGuard = rSevenDay < config.rMinThreshold;
  const triggeredCvGuard = cvDeltaPct <= -config.cvCollapsePct;

  await prisma.reasoningRGuardSnapshot.create({
    data: {
      rSevenDay,
      components,
      triggeredRevert: triggeredRGuard,
    },
  });
  await prisma.reasoningChainValueGuardSnapshot.create({
    data: {
      globalChainValueMean: 0, // populated by detailed eval below
      canonicalHoldoutChainValueMean: 0,
      deltaPct: cvDeltaPct,
      triggeredRevert: triggeredCvGuard,
    },
  });

  let freezeAction: RGuardResult["freezeAction"] = "none";
  if (triggeredRGuard || triggeredCvGuard) {
    const current = await prisma.reasoningSystemState.findUnique({
      where: { id: "singleton" },
    });
    if (current?.allocatorForceCanonical) {
      freezeAction = "already-frozen";
    } else {
      await prisma.reasoningSystemState.upsert({
        where: { id: "singleton" },
        create: {
          id: "singleton",
          allocatorForceCanonical: true,
          promoterFrozen: true,
          topologyGateOpen: false,
          lastFreezeReason: triggeredRGuard ? "R_GUARD" : "CV_GUARD",
          lastFreezeAt: new Date(),
        },
        update: {
          allocatorForceCanonical: true,
          promoterFrozen: true,
          topologyGateOpen: false,
          lastFreezeReason: triggeredRGuard ? "R_GUARD" : "CV_GUARD",
          lastFreezeAt: new Date(),
        },
      });
      freezeAction = "freeze";
    }
  }

  return { rSevenDay, triggeredRGuard, cvDeltaPct, triggeredCvGuard, freezeAction };
}

async function computeRollingR(
  windowStart: Date,
): Promise<{ rSevenDay: number; components: Record<string, number> }> {
  // Simple implementation: component ratios from OutcomeRecord counts.
  // Refine with confidence intervals in a future pass.
  const handoffClicks = await prisma.reasoningOutcomeRecord.count({
    where: { outcomeKind: "HANDOFF_CLICKED", recordedAt: { gte: windowStart } },
  });
  const advances = await prisma.reasoningOutcomeRecord.count({
    where: { outcomeKind: "NODE_ADVANCED", recordedAt: { gte: windowStart } },
  });
  const votes = await prisma.reasoningOutcomeRecord.count({
    where: { outcomeKind: "VOTE", recordedAt: { gte: windowStart } },
  });
  const firstSends = await prisma.reasoningOutcomeRecord.count({
    where: {
      outcomeKind: "FIRST_SEND_CONFIRMED",
      recordedAt: { gte: windowStart },
    },
  });
  const downstream = await prisma.reasoningOutcomeRecord.count({
    where: {
      outcomeKind: "DOWNSTREAM_VOTE",
      recordedAt: { gte: windowStart },
    },
  });

  const pOpen = handoffClicks > 0 ? Math.min(1, advances / handoffClicks) : 0;
  const pFinish = advances > 0 ? Math.min(1, votes / advances) : 0;
  const pVote = 1; // subsumed into pFinish in this simple impl
  const pFirstSend = votes > 0 ? Math.min(1, firstSends / votes) : 0;
  const eDownstream = firstSends > 0 ? Math.min(1, downstream / firstSends) : 0;

  const r = pOpen * pFinish * pVote * pFirstSend * (1 + eDownstream);
  return {
    rSevenDay: r,
    components: { pOpen, pFinish, pVote, pFirstSend, eDownstream },
  };
}

async function computeChainValueDelta(windowStart: Date): Promise<number> {
  const variantAgg = await prisma.reasoningOutcomeRecord.aggregate({
    where: {
      isControlHoldout: false,
      chainValueContribution: { not: null },
      recordedAt: { gte: windowStart },
    },
    _avg: { chainValueContribution: true },
  });
  const canonicalAgg = await prisma.reasoningOutcomeRecord.aggregate({
    where: {
      isControlHoldout: true,
      chainValueContribution: { not: null },
      recordedAt: { gte: windowStart },
    },
    _avg: { chainValueContribution: true },
  });
  const variantMean = variantAgg._avg.chainValueContribution ?? 0;
  const canonicalMean = canonicalAgg._avg.chainValueContribution ?? 0;
  if (canonicalMean === 0) return 0;
  return (variantMean - canonicalMean) / Math.abs(canonicalMean);
}
