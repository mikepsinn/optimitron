/**
 * Bundle experiments — T2-gated multi-slot interaction tests.
 *
 * Per-slot optimization misses cross-slot interaction effects. Bundle
 * variants fix a concrete combination of per-slot arms and allocate a
 * small bounded traffic share to them — ONLY when the topology
 * activation gate is OPEN.
 */

import { prisma } from "@/lib/prisma";

export const BUNDLE_EXPLORATION_PCT = 0.005; // 0.5% of traffic when gate is open

export type BundleAllocationDecision = {
  bundleId: string | null;
  bundleArmBindings: Record<string, string> | null;
};

/**
 * Given a decision seed, decide whether this request is allocated to a
 * bundle variant. Returns null if no bundle is selected.
 */
export async function maybePickBundle(params: {
  decisionIdSeed: string;
}): Promise<BundleAllocationDecision> {
  const systemState = await prisma.reasoningSystemState.findUnique({
    where: { id: "singleton" },
  });
  if (!systemState?.topologyGateOpen) {
    return { bundleId: null, bundleArmBindings: null };
  }

  if (!withinBundleBudget(params.decisionIdSeed)) {
    return { bundleId: null, bundleArmBindings: null };
  }

  const activeBundles = await prisma.reasoningBundleVariant.findMany({
    where: { status: "ACTIVE" },
  });
  if (activeBundles.length === 0) {
    return { bundleId: null, bundleArmBindings: null };
  }

  // Thompson-style sampling over bundle posteriors. Approximation: use
  // Normal(bundleMean, bundleStdErr) per bundle.
  let bestId: string | null = null;
  let bestSample = Number.NEGATIVE_INFINITY;
  for (const b of activeBundles) {
    if (b.exposures === 0) {
      const sample = Math.random() * 2; // wide exploration prior
      if (sample > bestSample) {
        bestSample = sample;
        bestId = b.id;
      }
      continue;
    }
    const mean = b.chainValueSum / b.exposures;
    const variance =
      b.exposures > 1
        ? (b.chainValueSumSq / b.exposures - mean * mean) *
          (b.exposures / (b.exposures - 1))
        : 1;
    const stdErr = Math.sqrt(Math.max(variance, 1e-9) / Math.max(1, b.exposures));
    const sample = mean + stdErr * standardNormal();
    if (sample > bestSample) {
      bestSample = sample;
      bestId = b.id;
    }
  }
  if (!bestId) return { bundleId: null, bundleArmBindings: null };

  const chosen = activeBundles.find((b) => b.id === bestId)!;
  return {
    bundleId: chosen.id,
    bundleArmBindings: chosen.armBindings as Record<string, string>,
  };
}

function withinBundleBudget(seed: string): boolean {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const normalized = (h >>> 0) / 0xffff_ffff;
  return normalized < BUNDLE_EXPLORATION_PCT;
}

function standardNormal(): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Record a bundle outcome — separate from per-arm posterior updates
 * so we can measure bundle interaction effects independently.
 */
export async function recordBundleOutcome(params: {
  bundleId: string;
  chainValue: number;
}): Promise<void> {
  const bundle = await prisma.reasoningBundleVariant.findUnique({
    where: { id: params.bundleId },
  });
  if (!bundle) return;
  await prisma.reasoningBundleVariant.update({
    where: { id: bundle.id },
    data: {
      exposures: bundle.exposures + 1,
      chainValueSum: bundle.chainValueSum + params.chainValue,
      chainValueSumSq:
        bundle.chainValueSumSq + params.chainValue * params.chainValue,
    },
  });
}
