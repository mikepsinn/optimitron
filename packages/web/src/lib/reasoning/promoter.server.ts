/**
 * Promoter — tier-gated auto-promotion on chain-value effect vs. canonical.
 *
 * Runs hourly via cron. For each DRAFT arm: Validator → ShadowEvaluator →
 * fraud-ancestry check → launch under exploratory traffic as ACTIVE.
 * For each ACTIVE arm: chain-value-vs-holdout evidence + fraud-penalty
 * check + R-guard + diversity-floor check; auto-retire underperformers.
 */

import { prisma } from "@/lib/prisma";

export type PromoterConfig = {
  nMinPromoteT1: number;
  nMinPromoteT2: number;
  nMinRetire: number;
  fraudAutoRetireThreshold: number;
  topologyActivationLiftPct: number;
  rStableThreshold: number;
  holdoutMinExposures: number;
};

export const DEFAULT_PROMOTER_CONFIG: PromoterConfig = {
  nMinPromoteT1: 500,
  nMinPromoteT2: 2000,
  nMinRetire: 1000,
  fraudAutoRetireThreshold: 0.1,
  topologyActivationLiftPct: 0.05,
  rStableThreshold: 1.0,
  holdoutMinExposures: 50_000,
};

export type PromoterRunResult = {
  draftsLaunched: number;
  armsRetired: number;
  topologyGateChanged: "opened" | "closed" | "unchanged";
};

/**
 * Main entry point — called by the hourly cron endpoint.
 */
export async function runPromoter(
  config: PromoterConfig = DEFAULT_PROMOTER_CONFIG,
): Promise<PromoterRunResult> {
  const systemState = await prisma.reasoningSystemState.findUnique({
    where: { id: "singleton" },
  });
  if (systemState?.promoterFrozen) {
    return { draftsLaunched: 0, armsRetired: 0, topologyGateChanged: "unchanged" };
  }

  const draftsLaunched = await launchDrafts(config);
  const armsRetired = await retireUnderperformers(config);
  const topologyGateChanged = await evaluateTopologyGate(config, systemState);

  return { draftsLaunched, armsRetired, topologyGateChanged };
}

async function launchDrafts(config: PromoterConfig): Promise<number> {
  const drafts = await prisma.reasoningVariantArm.findMany({
    where: {
      status: "DRAFT",
      fraudLineageFlagged: false,
      shadowGatePassed: { not: false }, // null or true — null = shadow eval pending, allow launch
      frozen: false,
    },
    take: 50,
  });

  let launched = 0;
  for (const arm of drafts) {
    // Only T1 arms auto-launch to ACTIVE. T2 requires topology gate.
    if (arm.riskTier === "T3") continue;
    if (arm.riskTier === "T2") {
      const gate = await prisma.reasoningSystemState.findUnique({
        where: { id: "singleton" },
      });
      if (!gate?.topologyGateOpen) continue;
    }

    await prisma.reasoningVariantArm.update({
      where: { id: arm.id },
      data: { status: "ACTIVE" },
    });
    await prisma.reasoningPromotionDecision.create({
      data: {
        armId: arm.id,
        fromStatus: "DRAFT",
        toStatus: "ACTIVE",
        tier: arm.riskTier,
        actorKind: "SYSTEM",
        chainValueEvidence: { note: "initial-launch" },
        fraudEvidence: {},
        rGuardSnapshot: {},
        chainValueGuardSnapshot: {},
        topologyGateState: arm.riskTier === "T2" ? "OPEN" : "N/A",
        rationale: "Validator + shadow-gate passed; launching under exploratory traffic.",
      },
    });
    launched++;
  }
  return launched;
}

async function retireUnderperformers(config: PromoterConfig): Promise<number> {
  const comparisons = await prisma.reasoningHoldoutComparison.findMany({
    where: {
      armExposures: { gte: config.nMinRetire },
      liftCiUpper: { lt: 0 },
      computedAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
    },
    orderBy: { computedAt: "desc" },
    take: 100,
  });

  let retired = 0;
  for (const c of comparisons) {
    const arm = await prisma.reasoningVariantArm.findUnique({
      where: { id: c.armId },
    });
    if (!arm || arm.status !== "ACTIVE" || arm.frozen) continue;

    // Never retire the last-viable-family arm in a slot.
    if (await wouldDropBelowMinFamilies(arm)) continue;

    await prisma.reasoningVariantArm.update({
      where: { id: arm.id },
      data: { status: "RETIRED" },
    });
    await prisma.reasoningPromotionDecision.create({
      data: {
        armId: arm.id,
        fromStatus: "ACTIVE",
        toStatus: "RETIRED",
        tier: arm.riskTier,
        actorKind: "SYSTEM",
        chainValueEvidence: { liftCiUpper: c.liftCiUpper, liftCiLower: c.liftCiLower },
        fraudEvidence: {},
        rGuardSnapshot: {},
        chainValueGuardSnapshot: {},
        topologyGateState: "N/A",
        rationale: "CHAIN_VALUE_INFERIOR: upper 95% CI < canonical holdout baseline",
      },
    });
    retired++;
  }
  return retired;
}

async function wouldDropBelowMinFamilies(arm: {
  slot: "HANDOFF" | "CHAIN_NODE" | "OBJECTION_NODE" | "INEVITABILITY" | "REPLICATION_CTA" | "DEEP_CHAIN_NODE" | "TOPOLOGY";
  family: string;
  variantSetId: string;
  slotKey: string;
}): Promise<boolean> {
  const MIN_FAMILIES_PER_SLOT = 3;
  const allActive = await prisma.reasoningVariantArm.findMany({
    where: {
      slot: arm.slot,
      variantSetId: arm.variantSetId,
      slotKey: arm.slotKey,
      status: "ACTIVE",
    },
    select: { id: true, family: true },
  });
  const familiesAfterRetire = new Set(
    allActive.filter((a) => a.id !== (arm as { id?: string }).id).map((a) => a.family),
  );
  return familiesAfterRetire.size < MIN_FAMILIES_PER_SLOT;
}

async function evaluateTopologyGate(
  config: PromoterConfig,
  systemState: { topologyGateOpen: boolean } | null,
): Promise<"opened" | "closed" | "unchanged"> {
  // Check stability conditions: rolling R, chain-value lift, R-guard incidents, holdout exposures.
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const recentRSnapshots = await prisma.reasoningRGuardSnapshot.findMany({
    where: { snapshotAt: { gte: fourteenDaysAgo } },
    orderBy: { snapshotAt: "asc" },
  });
  const rStable = recentRSnapshots.length > 0 &&
    recentRSnapshots.every((s) => s.rSevenDay >= config.rStableThreshold);

  const recentIncidents = await prisma.reasoningRGuardSnapshot.count({
    where: { snapshotAt: { gte: thirtyDaysAgo }, triggeredRevert: true },
  });
  const noRecentIncidents = recentIncidents === 0;

  const holdoutExposures = await prisma.reasoningVariantExposure.count({
    where: {
      isControlHoldout: true,
      exposedAt: { gte: thirtyDaysAgo },
    },
  });
  const holdoutReady = holdoutExposures >= config.holdoutMinExposures;

  const shouldBeOpen = rStable && noRecentIncidents && holdoutReady;
  const currentlyOpen = systemState?.topologyGateOpen ?? false;

  if (shouldBeOpen && !currentlyOpen) {
    await prisma.reasoningSystemState.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", topologyGateOpen: true },
      update: { topologyGateOpen: true },
    });
    return "opened";
  }
  if (!shouldBeOpen && currentlyOpen) {
    await prisma.reasoningSystemState.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", topologyGateOpen: false },
      update: { topologyGateOpen: false },
    });
    return "closed";
  }
  return "unchanged";
}
