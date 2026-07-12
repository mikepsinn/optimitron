import { describe, expect, it } from "vitest";
import { GPU_FLEET_CATALOG, type GpuFleetCard } from "@optimitron/data";
import {
  computeFleetEconomics,
  DEFAULT_FLEET_STATE,
  glmFit,
  scenariosFor,
  taperedPath,
  taperFactor,
  utilizationAgeFactor,
} from "../gpu-fleet-sim";

function card(id: string): GpuFleetCard {
  const found = GPU_FLEET_CATALOG.find((c) => c.id === id);
  if (!found) throw new Error(`missing catalog card ${id}`);
  return found;
}

function baseEconomicsAtDefaults(id: string) {
  const g = card(id);
  const sc = scenariosFor(g, DEFAULT_FLEET_STATE, false);
  return computeFleetEconomics(g, sc.base, DEFAULT_FLEET_STATE);
}

describe("computeFleetEconomics golden values ($100K, defaults, 36-month horizon)", () => {
  // Verified by re-running the reference analyzer's formulas.
  // Tolerances: ±$2 on dollar values, ±0.2pp on annualized %.
  const GOLDENS = [
    { id: "rtx3090", units: 53, capital: 98_225, leftover: 1_775, gross: 4_604, power: 2_320, net: 756, value36: 64_613, ann36: -13.5 },
    { id: "rtx4090", units: 31, capital: 98_995, leftover: 1_005, gross: 4_752, power: 1_745, net: 1_240, value36: 73_529, ann36: -9.7 },
    { id: "rtx5090", units: 21, capital: 97_838, leftover: 2_162, gross: 4_829, power: 1_510, net: 1_447, value36: 135_142, ann36: 10.6 },
    { id: "pro6000", units: 6, capital: 87_950, leftover: 12_050, gross: 3_219, power: 450, net: 1_360, value36: 141_097, ann36: 12.2 },
    { id: "h100", units: 3, capital: 97_850, leftover: 2_150, gross: 3_986, power: 263, net: 1_946, value36: 185_138, ann36: 22.8 },
  ] as const;

  for (const g of GOLDENS) {
    it(`matches the reference for ${g.id}`, () => {
      const e = baseEconomicsAtDefaults(g.id);
      expect(e.units).toBe(g.units);
      expect(Math.abs(e.capitalUsd - g.capital)).toBeLessThanOrEqual(2);
      expect(Math.abs(e.leftoverUsd - g.leftover)).toBeLessThanOrEqual(2);
      expect(Math.abs(e.monthlyGrossUsd - g.gross)).toBeLessThanOrEqual(2);
      expect(Math.abs(e.monthlyPowerUsd - g.power)).toBeLessThanOrEqual(2);
      expect(Math.abs(e.monthlyNetUsd - g.net)).toBeLessThanOrEqual(2);
      expect(Math.abs(e.valueAt(36) - g.value36)).toBeLessThanOrEqual(2);
      expect(Math.abs(e.annualizedAt(36) * 100 - g.ann36)).toBeLessThanOrEqual(0.2);
    });
  }

  it("finds no payback within 60 months at defaults for any fleet", () => {
    for (const g of GOLDENS) {
      expect(baseEconomicsAtDefaults(g.id).paybackMonths).toBeNull();
    }
  });

  it("buys zero units when the budget cannot cover one H100 system", () => {
    const g = card("h100");
    const state = { ...DEFAULT_FLEET_STATE, investUsd: 2_000 };
    const e = computeFleetEconomics(g, scenariosFor(g, state, false).base, state);
    expect(e.units).toBe(0);
    expect(e.monthlyGrossUsd).toBe(0);
    expect(e.annualizedAt(36)).toBe(0);
    expect(e.paybackMonths).toBeNull();
  });
});

describe("scenariosFor", () => {
  it("shifts lo/hi rate, utilization, and drifts off the base scenario", () => {
    const g = card("rtx5090");
    const sc = scenariosFor(g, DEFAULT_FLEET_STATE, false);
    expect(sc.base.ratePerHourUsd).toBe(g.ratePerHourUsd);
    expect(sc.base.cardDriftPctPerYear).toBe(g.resaleDriftPctPerYear);
    expect(sc.lo).toMatchObject({
      ratePerHourUsd: g.rateLowPerHourUsd,
      utilizationPct: 55,
      cardDriftPctPerYear: g.resaleDriftPctPerYear - 12,
      rateDriftPctPerYear: -25,
    });
    expect(sc.hi).toMatchObject({
      ratePerHourUsd: g.rateHighPerHourUsd,
      utilizationPct: 80,
      cardDriftPctPerYear: g.resaleDriftPctPerYear + 10,
      rateDriftPctPerYear: 0,
    });
  });

  it("clamps lo utilization at 20 and hi at 95", () => {
    const g = card("rtx3090");
    const lowState = { ...DEFAULT_FLEET_STATE, utilizationPct: 30 };
    const highState = { ...DEFAULT_FLEET_STATE, utilizationPct: 92 };
    expect(scenariosFor(g, lowState, false).lo.utilizationPct).toBe(20);
    expect(scenariosFor(g, highState, false).hi.utilizationPct).toBe(95);
  });
});

describe("taperFactor", () => {
  it("holds full strength through month 9", () => {
    expect(taperFactor(1)).toBe(1);
    expect(taperFactor(9)).toBe(1);
  });

  it("declines linearly to the 15% residual by month 30 and holds", () => {
    expect(taperFactor(19.5)).toBeCloseTo(1 - (0.85 * 10.5) / 21, 10);
    expect(taperFactor(30)).toBe(0.15);
    expect(taperFactor(60)).toBe(0.15);
  });
});

describe("taperedPath", () => {
  it("compounds negative trends untapered", () => {
    const path = taperedPath(-0.1, false);
    expect(path[12]).toBeCloseTo(0.9, 10);
    expect(path[24]).toBeCloseTo(0.81, 10);
  });

  it("tapers positive trends after month 9", () => {
    const path = taperedPath(0.24, false);
    const untapered = taperedPath(0.24, true);
    // First 9 months run at full strength (taper evaluated mid-month).
    expect(path[9]).toBeCloseTo(Math.pow(1.24, 9 / 12), 10);
    // By month 60 the tapered path lags the untapered one badly.
    expect(path[60]!).toBeLessThan(untapered[60]! * 0.6);
    expect(untapered[60]).toBeCloseTo(Math.pow(1.24, 5), 8);
  });

  it("noTaper only affects positive trends", () => {
    expect(taperedPath(-0.2, true)).toEqual(taperedPath(-0.2, false));
  });
});

describe("utilizationAgeFactor", () => {
  it("holds 100% through month 12, then declines linearly to 70% at month 60", () => {
    expect(utilizationAgeFactor(1)).toBe(1);
    expect(utilizationAgeFactor(12)).toBe(1);
    expect(utilizationAgeFactor(36)).toBeCloseTo(0.85, 10);
    expect(utilizationAgeFactor(60)).toBe(0.7);
    expect(utilizationAgeFactor(120)).toBe(0.7);
  });
});

describe("glmFit", () => {
  it("issues the reference verdicts at q4 with $100K default fleets", () => {
    const expected: Record<string, string> = {
      rtx3090: "Impractical",
      rtx4090: "Impractical",
      rtx5090: "Yes, with effort",
      pro6000: "Yes — clean fit",
      h100: "Fleet too small",
    };
    for (const [id, verdict] of Object.entries(expected)) {
      const g = card(id);
      const fleet = baseEconomicsAtDefaults(id);
      expect(glmFit(g, "q4", fleet.units).verdict).toBe(verdict);
    }
  });

  it("computes cards needed from memory need / VRAM", () => {
    const fit = glmFit(card("pro6000"), "fp8", 20);
    expect(fit.cardsNeeded).toBe(Math.ceil(800 / 96));
    expect(fit.hardwareCostUsd).toBe(fit.cardsNeeded * (13_250 + 1_100));
    expect(fit.powerKw).toBeCloseTo((fit.cardsNeeded * 600 * 1.25) / 1000, 10);
  });
});
