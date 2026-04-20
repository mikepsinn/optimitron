import { describe, expect, it } from "vitest";
import {
  DEFAULT_EV_CONFIG,
  computeBreakevenChainP,
  computeChainProbability,
  computeEvDashboard,
  computeExpectedLivesPerForward,
  computeExpectedValueUsdPerForward,
  computeRatioToCost,
  confidenceToProbability,
} from "../reasoning/ev";

describe("computeChainProbability", () => {
  it("returns 1 for empty input", () => {
    expect(computeChainProbability({})).toBe(1);
  });

  it("multiplies independent probabilities", () => {
    expect(computeChainProbability({ a: 0.9, b: 0.9, c: 0.9 })).toBeCloseTo(
      0.9 * 0.9 * 0.9,
      10,
    );
  });

  it("clamps to [0,1]", () => {
    expect(computeChainProbability({ a: 1.5, b: 0.5 })).toBeCloseTo(0.5, 10);
    expect(computeChainProbability({ a: -0.1, b: 0.5 })).toBe(0);
  });

  it("ignores NaN/undefined values", () => {
    expect(
      computeChainProbability({ a: 0.5, b: Number.NaN, c: 0.5 }),
    ).toBeCloseTo(0.25, 10);
  });
});

describe("EV at high probability", () => {
  it("realistic probabilities (all claims P=0.9, conversion=0.1) produce a ratio-to-cost > 1M", () => {
    const chainP = 0.9 ** 5; // 5 claims, each P=0.9
    const conversionP = 0.1;
    const ev = computeExpectedValueUsdPerForward(chainP, conversionP);
    const ratio = computeRatioToCost(ev);
    // At realistic probabilities, per-forward EV ratio is several million:1.
    // h2ewd.md:454's 245.6M:1 is a different calc (lifetime benefit / cost).
    expect(ratio).toBeGreaterThan(1e6);
  });

  it("max-probability (chainP=1, conversion=1) produces a ratio > 50M", () => {
    const ev = computeExpectedValueUsdPerForward(1, 1);
    const ratio = computeRatioToCost(ev);
    expect(ratio).toBeGreaterThan(5e7);
  });
});

describe("computeEvDashboard", () => {
  it("reports positive EV with high probabilities", () => {
    const snapshot = computeEvDashboard(
      {
        a: 0.9,
        b: 0.9,
        c: 0.9,
        d: 0.9,
        e: 0.9,
      },
      0.1,
    );
    expect(snapshot.isNegativeEv).toBe(false);
    expect(snapshot.ratioToCost).toBeGreaterThan(1);
  });

  it("collapses EV when a single claim drops to ~0", () => {
    const highProbs = { a: 0.9, b: 0.9, c: 0.9, d: 0.9, e: 0.9 };
    const snapshotHigh = computeEvDashboard(highProbs, 0.1);
    const snapshotLow = computeEvDashboard(
      { ...highProbs, e: 0.001 },
      0.1,
    );
    expect(snapshotLow.expectedValueUsdPerForward).toBeLessThan(
      snapshotHigh.expectedValueUsdPerForward / 100,
    );
  });

  it("flips to negative-EV when ratio < 1", () => {
    const allLow = { a: 1e-9, b: 1e-9, c: 1e-9, d: 1e-9, e: 1e-9 };
    const snapshot = computeEvDashboard(allLow, 1e-6);
    expect(snapshot.isNegativeEv).toBe(true);
  });
});

describe("computeBreakevenChainP", () => {
  it("is the inverse of the ratio at chain-P = 1", () => {
    const conversionP = 0.1;
    const fullRatio = computeRatioToCost(
      computeExpectedValueUsdPerForward(1, conversionP),
    );
    const breakeven = computeBreakevenChainP(conversionP);
    expect(breakeven * fullRatio).toBeCloseTo(1, 6);
  });

  it("returns 1 when conversionP is 0 (always negative EV)", () => {
    expect(computeBreakevenChainP(0)).toBe(1);
  });

  it("stays in [0,1]", () => {
    for (const cp of [0.001, 0.1, 0.5, 1]) {
      const b = computeBreakevenChainP(cp);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(1);
    }
  });
});

describe("computeExpectedLivesPerForward", () => {
  it("scales linearly with both probabilities", () => {
    const lives1 = computeExpectedLivesPerForward(0.5, 0.1);
    const lives2 = computeExpectedLivesPerForward(1, 0.2);
    // lives2 should be 4x lives1
    expect(lives2 / lives1).toBeCloseTo(4, 6);
  });

  it("returns 0 when chainP is 0", () => {
    expect(computeExpectedLivesPerForward(0, 0.1)).toBe(0);
  });
});

describe("confidenceToProbability", () => {
  it("maps known confidence strings", () => {
    expect(confidenceToProbability("high")).toBe(0.9);
    expect(confidenceToProbability("medium")).toBe(0.7);
    expect(confidenceToProbability("low")).toBe(0.5);
    expect(confidenceToProbability("estimated")).toBe(0.5);
  });

  it("defaults unknown values to medium", () => {
    expect(confidenceToProbability(null)).toBe(0.7);
    expect(confidenceToProbability(undefined)).toBe(0.7);
    expect(confidenceToProbability("weird")).toBe(0.7);
  });
});

describe("DEFAULT_EV_CONFIG", () => {
  it("reflects documented constants", () => {
    expect(DEFAULT_EV_CONFIG.forwardCostUsd).toBe(0.06);
    expect(DEFAULT_EV_CONFIG.defaultConversionP).toBe(0.1);
    expect(DEFAULT_EV_CONFIG.conversionBounds[0]).toBe(0.01);
  });
});
