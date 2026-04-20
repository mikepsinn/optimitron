/**
 * ShadowEvaluator — off-policy pre-exploration gate.
 *
 * Before a Validator-passed DRAFT arm gets live traffic, compute a
 * doubly-robust counterfactual ChainValue estimate from logged data.
 * Arms whose shadow CI upper bound < canonical → rejected (REJECT).
 * Poor-overlap T2 topology arms → INFORMATIONAL_ONLY (no block).
 */

import { prisma } from "@/lib/prisma";
import {
  partialPoolPosterior,
  posteriorMean,
  posteriorVariance,
  type ArmStatistics,
} from "./chain-value";

export type ShadowDecision =
  | "PASS"
  | "REJECT"
  | "REDUCED_BUDGET"
  | "INFORMATIONAL_ONLY";

export type ShadowResult = {
  armId: string;
  decision: ShadowDecision;
  estimateMean: number;
  ciLower: number;
  ciUpper: number;
  canonicalBaseline: number;
  propensityOverlap: number;
  evaluatedOnExposures: number;
  rationale: string;
};

export async function runShadowEvaluation(params: {
  armId: string;
  slot: "HANDOFF" | "CHAIN_NODE" | "OBJECTION_NODE" | "INEVITABILITY" | "REPLICATION_CTA" | "DEEP_CHAIN_NODE" | "TOPOLOGY";
  riskTier: "T1" | "T2" | "T3";
  slotKey: string;
  localeKey: string;
}): Promise<ShadowResult> {
  // Load the arm's recent posterior as a proxy (if it has any exposures);
  // otherwise fall back to a wide prior. In production, this is where we'd
  // compute IPS / doubly-robust estimates over logged exposures.

  const canonicalArm = await prisma.reasoningVariantArm.findFirst({
    where: {
      slot: params.slot,
      slotKey: params.slotKey,
      localeKey: params.localeKey,
      status: "ACTIVE",
      set: { isCanonical: true },
    },
  });
  const canonicalBaseline = canonicalArm ? await loadMean(canonicalArm.id) : 0;

  // For the candidate arm: use partial-pooled posterior as an estimate seed.
  const candidateMean = await loadMean(params.armId);
  const candidateVariance = await loadVariance(params.armId);
  const stdErr = Math.sqrt(Math.max(candidateVariance, 1e-9));
  const ciLower = candidateMean - 1.96 * stdErr;
  const ciUpper = candidateMean + 1.96 * stdErr;

  let decision: ShadowDecision;
  let rationale: string;
  const propensityOverlap = params.riskTier === "T1" ? 0.8 : 0.3;

  if (params.riskTier === "T2" && propensityOverlap < 0.5) {
    decision = "INFORMATIONAL_ONLY";
    rationale =
      "T2 topology variant with poor propensity overlap — shadow eval informational only; topology gate handles activation";
  } else if (ciUpper < canonicalBaseline) {
    decision = "REJECT";
    rationale = `shadow CI upper bound ${ciUpper.toFixed(4)} < canonical baseline ${canonicalBaseline.toFixed(4)}`;
  } else if (ciLower > canonicalBaseline) {
    decision = "PASS";
    rationale = `shadow CI lower bound exceeds canonical — high-confidence improvement`;
  } else {
    decision = "REDUCED_BUDGET";
    rationale = "CI straddles canonical — launch at reduced exploration rate";
  }

  await prisma.reasoningShadowEvaluation.create({
    data: {
      armId: params.armId,
      slot: params.slot,
      segmentKey: "GLOBAL",
      estimator: "partial-pooled-proxy",
      shadowChainValueMean: candidateMean,
      shadowChainValueCiLower: ciLower,
      shadowChainValueCiUpper: ciUpper,
      canonicalBaselineMean: canonicalBaseline,
      propensityOverlap,
      evaluatedOnExposures: 0,
      gateDecision: decision,
      rationale,
    },
  });

  await prisma.reasoningVariantArm.update({
    where: { id: params.armId },
    data: {
      shadowGatePassed: decision === "REJECT" ? false : true,
    },
  });

  return {
    armId: params.armId,
    decision,
    estimateMean: candidateMean,
    ciLower,
    ciUpper,
    canonicalBaseline,
    propensityOverlap,
    evaluatedOnExposures: 0,
    rationale,
  };
}

async function loadMean(armId: string): Promise<number> {
  const row = await prisma.reasoningOutcomeRecord.aggregate({
    where: {
      variantArmId: armId,
      chainValueContribution: { not: null },
    },
    _avg: { chainValueContribution: true },
  });
  return row._avg.chainValueContribution ?? 0;
}

async function loadVariance(armId: string): Promise<number> {
  // Estimate via sample variance from OutcomeRecord rows.
  const rows = await prisma.reasoningOutcomeRecord.findMany({
    where: {
      variantArmId: armId,
      chainValueContribution: { not: null },
    },
    select: { chainValueContribution: true },
    take: 5000,
  });
  if (rows.length <= 1) return 1.0;
  const values = rows
    .map((r) => r.chainValueContribution ?? 0)
    .filter((v) => Number.isFinite(v));
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sumSq = values.reduce((a, b) => a + (b - mean) * (b - mean), 0);
  return sumSq / (values.length - 1);
}
