/**
 * Winners — per-slot per-segment leaderboard queries.
 *
 * Surfaces the top-performing arms by chain-value lift vs canonical
 * holdout; flags underperformers for retirement review.
 */

import { prisma } from "@/lib/prisma";
import type { VariantSlot } from "./types";

export type ArmLeaderboardEntry = {
  armId: string;
  liftPointEstimate: number;
  liftCiLower: number;
  liftCiUpper: number;
  armExposures: number;
  canonicalExposures: number;
  armChainValueMean: number;
};

/**
 * Top N arms for a slot, ranked by chain-value lift lower bound.
 * Filters to arms with sufficient exposures for reliable inference.
 */
export async function topArmsForSlot(params: {
  slot: VariantSlot;
  segmentKey?: string;
  minExposures?: number;
  limit?: number;
}): Promise<ArmLeaderboardEntry[]> {
  const minExposures = params.minExposures ?? 500;
  const limit = params.limit ?? 10;
  const comparisons = await prisma.reasoningHoldoutComparison.findMany({
    where: {
      slot: params.slot,
      ...(params.segmentKey ? { segmentKey: params.segmentKey } : {}),
      armExposures: { gte: minExposures },
    },
    orderBy: [{ computedAt: "desc" }],
    take: 500,
  });

  // Dedupe by armId, keeping most recent.
  const byArm = new Map<string, typeof comparisons[number]>();
  for (const c of comparisons) {
    if (!byArm.has(c.armId)) byArm.set(c.armId, c);
  }
  const latest = Array.from(byArm.values());
  latest.sort((a, b) => b.liftCiLower - a.liftCiLower);
  return latest.slice(0, limit).map((c) => ({
    armId: c.armId,
    liftPointEstimate: c.liftPointEstimate,
    liftCiLower: c.liftCiLower,
    liftCiUpper: c.liftCiUpper,
    armExposures: c.armExposures,
    canonicalExposures: c.canonicalExposures,
    armChainValueMean: c.armChainValueMean,
  }));
}

/**
 * Arms flagged for retirement: upper CI bound below canonical baseline
 * with sufficient evidence. Human review required before retirement.
 */
export async function underperformingArms(params: {
  slot?: VariantSlot;
  minExposures?: number;
  limit?: number;
}): Promise<ArmLeaderboardEntry[]> {
  const minExposures = params.minExposures ?? 1000;
  const limit = params.limit ?? 20;
  const comparisons = await prisma.reasoningHoldoutComparison.findMany({
    where: {
      ...(params.slot ? { slot: params.slot } : {}),
      armExposures: { gte: minExposures },
      liftCiUpper: { lt: 0 },
    },
    orderBy: [{ liftCiUpper: "asc" }],
    take: limit,
  });
  return comparisons.map((c) => ({
    armId: c.armId,
    liftPointEstimate: c.liftPointEstimate,
    liftCiLower: c.liftCiLower,
    liftCiUpper: c.liftCiUpper,
    armExposures: c.armExposures,
    canonicalExposures: c.canonicalExposures,
    armChainValueMean: c.armChainValueMean,
  }));
}
