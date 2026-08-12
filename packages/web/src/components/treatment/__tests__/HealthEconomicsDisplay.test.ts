import { describe, expect, it } from "vitest";
import {
  getCostEffectivenessColors,
  isFiniteNumber,
} from "@/components/treatment/HealthEconomicsDisplay";

describe("isFiniteNumber", () => {
  it("accepts finite numbers including zero", () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(-12.5)).toBe(true);
    expect(isFiniteNumber(1_000)).toBe(true);
  });

  it("rejects null, undefined, NaN, Infinity, and non-numbers", () => {
    expect(isFiniteNumber(null)).toBe(false);
    expect(isFiniteNumber(undefined)).toBe(false);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isFiniteNumber("12")).toBe(false);
  });
});

describe("getCostEffectivenessColors", () => {
  it("returns the known rating swatch", () => {
    expect(getCostEffectivenessColors("excellent").badge).toBe("default");
    expect(getCostEffectivenessColors("dominated").badge).toBe("destructive");
  });

  it("falls back to moderate for missing or unknown ratings", () => {
    const fallback = getCostEffectivenessColors("moderate");
    expect(getCostEffectivenessColors(null).badge).toBe(fallback.badge);
    expect(getCostEffectivenessColors(undefined).badge).toBe(fallback.badge);
    expect(getCostEffectivenessColors("unknown").badge).toBe(fallback.badge);
    expect(getCostEffectivenessColors("").badge).toBe(fallback.badge);
  });

  it("normalizes title-case ratings from medical datasets", () => {
    expect(getCostEffectivenessColors("Excellent").badge).toBe("default");
    expect(getCostEffectivenessColors("Good").badge).toBe("secondary");
    expect(getCostEffectivenessColors("Poor").badge).toBe("outline");
  });
});
