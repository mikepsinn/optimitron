/**
 * Pure EV math for the persuasion dashboard.
 *
 * The dashboard shows:
 *   1. P(all claims accepted) = ∏ listener-set probabilities
 *   2. Expected lives / forward   = lives_per_vote × P(all) × P(conversion)
 *   3. Expected USD / forward     = lives × $/QALY × years/life × P(all) × P(conversion)
 *   4. Ratio to $0.06 forward cost
 *   5. Breakeven chain-probability (inverse of ratio-at-all-high)
 *
 * All pure — no React, no DB, no network. Unit-tested.
 * Parameter values are injected from the outside so this module stays
 * independently testable; `live-ev-config.ts` wires in the published
 * `@optimitron/data/parameters` values for the production UI.
 */

import type { NodeId } from "./types";

export type EvConfig = {
  /** `VOTER_LIVES_SAVED.value` — expected lives per verified-voter signature. */
  livesPerVote: number;
  /** `VOTER_SUFFERING_HOURS_PREVENTED.value` — hours of suffering. */
  sufferingHoursPerVote: number;
  /** `STANDARD_ECONOMIC_QALY_VALUE_USD.value` — $ per QALY. */
  usdPerQaly: number;
  /** Cost in USD of forwarding once (30s × global median wage). */
  forwardCostUsd: number;
  /** Default probability that a forward converts to a recipient signature. */
  defaultConversionP: number;
  /** Slider bounds on per-claim probability. */
  minProbability: number;
  /** Listener probability slider bounds for conversion rate. */
  conversionBounds: [number, number];
};

export const DEFAULT_EV_CONFIG: EvConfig = {
  // Seeded with published defaults; allocator wires in live Parameter values.
  livesPerVote: 38.376849102141854,
  sufferingHoursPerVote: 6_896_780.305844117,
  usdPerQaly: 150_000,
  forwardCostUsd: 0.06,
  defaultConversionP: 0.1,
  minProbability: 0.01,
  conversionBounds: [0.01, 1.0],
};

/**
 * Multiply per-claim probabilities into a single chain acceptance P.
 * Ignores claims the listener hasn't answered yet (treated as P=1 for
 * computed rows until they interact).
 */
export function computeChainProbability(
  claimProbs: Record<NodeId, number>,
): number {
  let p = 1;
  for (const value of Object.values(claimProbs)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      p *= Math.max(0, Math.min(1, value));
    }
  }
  return p;
}

export function computeExpectedLivesPerForward(
  chainP: number,
  conversionP: number,
  config: EvConfig = DEFAULT_EV_CONFIG,
): number {
  return config.livesPerVote * chainP * conversionP;
}

export function computeExpectedSufferingYearsPerForward(
  chainP: number,
  conversionP: number,
  config: EvConfig = DEFAULT_EV_CONFIG,
): number {
  return (config.sufferingHoursPerVote / 8760) * chainP * conversionP;
}

/**
 * Lives × years-per-life-saved × $/QALY × probabilities.
 * Uses a conservative 1-life-year-per-life assumption for the inline
 * dashboard; the deep-chain explainer shows the full derivation.
 */
export function computeExpectedValueUsdPerForward(
  chainP: number,
  conversionP: number,
  config: EvConfig = DEFAULT_EV_CONFIG,
): number {
  return config.livesPerVote * config.usdPerQaly * chainP * conversionP;
}

export function computeRatioToCost(
  evUsd: number,
  config: EvConfig = DEFAULT_EV_CONFIG,
): number {
  if (config.forwardCostUsd <= 0) return Number.POSITIVE_INFINITY;
  return evUsd / config.forwardCostUsd;
}

/**
 * Minimum chain-probability × conversion-probability product below
 * which forwarding is negative-EV. Inverse of the ratio at P=1.
 */
export function computeBreakevenChainP(
  conversionP: number,
  config: EvConfig = DEFAULT_EV_CONFIG,
): number {
  const maxValuePerForward =
    config.livesPerVote * config.usdPerQaly * conversionP;
  if (maxValuePerForward <= 0) return 1;
  const breakeven = config.forwardCostUsd / maxValuePerForward;
  return Math.min(1, Math.max(0, breakeven));
}

export type EvDashboardSnapshot = {
  chainProbability: number;
  conversionP: number;
  expectedLivesPerForward: number;
  expectedSufferingYearsPerForward: number;
  expectedValueUsdPerForward: number;
  ratioToCost: number;
  breakevenChainP: number;
  isNegativeEv: boolean;
};

export function computeEvDashboard(
  claimProbs: Record<NodeId, number>,
  conversionP: number,
  config: EvConfig = DEFAULT_EV_CONFIG,
): EvDashboardSnapshot {
  const chainProbability = computeChainProbability(claimProbs);
  const expectedLivesPerForward = computeExpectedLivesPerForward(
    chainProbability,
    conversionP,
    config,
  );
  const expectedSufferingYearsPerForward = computeExpectedSufferingYearsPerForward(
    chainProbability,
    conversionP,
    config,
  );
  const expectedValueUsdPerForward = computeExpectedValueUsdPerForward(
    chainProbability,
    conversionP,
    config,
  );
  const ratioToCost = computeRatioToCost(expectedValueUsdPerForward, config);
  const breakevenChainP = computeBreakevenChainP(conversionP, config);
  return {
    chainProbability,
    conversionP,
    expectedLivesPerForward,
    expectedSufferingYearsPerForward,
    expectedValueUsdPerForward,
    ratioToCost,
    breakevenChainP,
    isNegativeEv: expectedValueUsdPerForward < config.forwardCostUsd,
  };
}

/**
 * Map a Parameter.confidence string to a default probability slider value.
 * Used when claim arms don't explicitly declare their defaultProbability.
 */
export function confidenceToProbability(
  confidence: "high" | "medium" | "low" | "estimated" | string | null | undefined,
): number {
  switch (confidence) {
    case "high":
      return 0.9;
    case "medium":
      return 0.7;
    case "low":
      return 0.5;
    case "estimated":
      return 0.5;
    default:
      return 0.7;
  }
}
