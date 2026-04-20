/**
 * DistributionOptimizer — allocates effort across distribution slices.
 *
 * Reads DistributionTarget (human-managed: enabled, ceilings, live status)
 * and writes DistributionPolicyState (optimizer-managed: generation budget,
 * exploration multipliers, onboarding priority).
 */

import { prisma } from "@/lib/prisma";

export type DistributionOptimizerResult = {
  slicesUpdated: number;
  topOnboardingPriorities: Array<{
    organizationId: string | null;
    localeKey: string | null;
    channel: string | null;
    surface: string | null;
    priority: number;
  }>;
};

export async function runDistributionOptimizer(): Promise<DistributionOptimizerResult> {
  const targets = await prisma.reasoningDistributionTarget.findMany();

  let slicesUpdated = 0;
  for (const t of targets) {
    const yield_ = await computeSliceYield(t);
    const supply = await computeSliceSupply(t);
    const onboardingPriority = t.enabled
      ? null
      : estimateOnboardingPriority(t.ceilingEstimate, yield_);
    const generationBudgetWeight = estimateGenerationBudgetWeight(
      yield_,
      supply,
      t.ceilingEstimate,
    );
    const explorationRateMultiplier = estimateExplorationMultiplier(
      yield_,
      supply,
    );

    await prisma.reasoningDistributionPolicyState.upsert({
      where: {
        organizationId_localeKey_channel_surface: {
          organizationId: t.organizationId ?? "",
          localeKey: t.localeKey ?? "",
          channel: t.channel ?? "",
          surface: t.surface ?? "",
        },
      },
      create: {
        organizationId: t.organizationId,
        localeKey: t.localeKey,
        channel: t.channel,
        surface: t.surface,
        currentYield: yield_,
        currentSupply: supply,
        generationBudgetWeight,
        explorationRateMultiplier,
        onboardingPriority,
      },
      update: {
        currentYield: yield_,
        currentSupply: supply,
        generationBudgetWeight,
        explorationRateMultiplier,
        onboardingPriority,
      },
    });
    slicesUpdated++;
  }

  const topOnboardingPriorities = await prisma.reasoningDistributionPolicyState.findMany({
    where: { onboardingPriority: { not: null } },
    orderBy: { onboardingPriority: "desc" },
    take: 10,
  });

  return {
    slicesUpdated,
    topOnboardingPriorities: topOnboardingPriorities.map((p) => ({
      organizationId: p.organizationId,
      localeKey: p.localeKey,
      channel: p.channel,
      surface: p.surface,
      priority: p.onboardingPriority ?? 0,
    })),
  };
}

async function computeSliceYield(t: {
  organizationId: string | null;
  localeKey: string | null;
  channel: string | null;
  surface: string | null;
}): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const agg = await prisma.reasoningOutcomeRecord.aggregate({
    where: {
      ...(t.organizationId ? { organizationId: t.organizationId } : {}),
      ...(t.localeKey ? { localeKey: t.localeKey } : {}),
      ...(t.channel ? { channel: t.channel } : {}),
      ...(t.surface ? { surface: t.surface } : {}),
      chainValueContribution: { not: null },
      recordedAt: { gte: thirtyDaysAgo },
    },
    _avg: { chainValueContribution: true },
  });
  return agg._avg.chainValueContribution ?? 0;
}

async function computeSliceSupply(t: {
  organizationId: string | null;
  localeKey: string | null;
  channel: string | null;
  surface: string | null;
}): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  return prisma.reasoningVariantExposure.count({
    where: {
      ...(t.organizationId ? { organizationId: t.organizationId } : {}),
      ...(t.localeKey ? { localeKey: t.localeKey } : {}),
      ...(t.surface ? { surface: t.surface } : {}),
      exposedAt: { gte: thirtyDaysAgo },
    },
  });
}

function estimateOnboardingPriority(
  ceilingEstimate: number,
  yieldSignal: number,
): number {
  // Priority = audience ceiling × (expected yield if launched).
  // For non-live slices we use a default yield signal of 1.0 when no data.
  const y = yieldSignal > 0 ? yieldSignal : 1.0;
  return Math.log10(Math.max(1, ceilingEstimate)) * y;
}

function estimateGenerationBudgetWeight(
  yieldSignal: number,
  supply: number,
  ceilingEstimate: number,
): number {
  // Favor slices where yield is high + supply is low (room to grow).
  const headroom = Math.max(0, 1 - supply / Math.max(1, ceilingEstimate));
  const ySig = Math.max(0, yieldSignal);
  return 0.5 + ySig * 0.5 + headroom * 0.5;
}

function estimateExplorationMultiplier(
  yieldSignal: number,
  supply: number,
): number {
  // Saturated slices get less exploration.
  if (supply > 100_000) return 0.5;
  if (yieldSignal <= 0) return 1.5; // no signal yet — explore more
  return 1.0;
}
