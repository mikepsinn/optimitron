import { describe, expect, it } from "vitest";
import {
  computeCollapseDate,
  computeCollapseYears,
  generateTrajectoryData,
  PROJECTION_YEARS,
  DYSFUNCTION_TAX_PER_SECOND,
  DESTRUCTIVE_PER_SECOND,
  TRIALS_UNFUNDED_PER_SECOND,
  DEATHS_PER_SECOND,
} from "../collapse-constants";

describe("collapse-constants", () => {
  describe("computeCollapseYears", () => {
    it("returns approximately 7 years", () => {
      const years = computeCollapseYears();
      expect(years).toBeGreaterThan(6);
      expect(years).toBeLessThan(8);
    });
  });

  describe("computeCollapseDate", () => {
    it("returns a date around Jan 2031", () => {
      const date = computeCollapseDate();
      expect(date.getFullYear()).toBeGreaterThanOrEqual(2030);
      expect(date.getFullYear()).toBeLessThanOrEqual(2032);
    });

    it("is in the future relative to baseline", () => {
      const date = computeCollapseDate();
      expect(date.getTime()).toBeGreaterThan(
        new Date("2024-01-01").getTime(),
      );
    });
  });

  describe("generateTrajectoryData", () => {
    it("returns PROJECTION_YEARS + 1 data points", () => {
      const data = generateTrajectoryData();
      expect(data).toHaveLength(PROJECTION_YEARS + 1);
    });

    it("starts at 2024 with baseline values", () => {
      const data = generateTrajectoryData();
      const first = data[0]!;
      expect(first.year).toBe(2024);
      expect(first.productive).toBeCloseTo(115, 0);
      expect(first.destructive).toBeCloseTo(13.2, 1);
    });

    it("has monotonically increasing destructive values", () => {
      const data = generateTrajectoryData();
      for (let i = 1; i < data.length; i++) {
        expect(data[i]!.destructive).toBeGreaterThan(data[i - 1]!.destructive);
      }
    });

    it("ratio crosses COLLAPSE_RATIO around year 7", () => {
      const data = generateTrajectoryData();
      const crossover = data.find((d) => d.ratio >= 0.25);
      expect(crossover).toBeDefined();
      expect(crossover!.year - 2024).toBeGreaterThanOrEqual(6);
      expect(crossover!.year - 2024).toBeLessThanOrEqual(8);
    });
  });

  describe("derived rates", () => {
    it("DEATHS_PER_SECOND is ~1.7", () => {
      expect(DEATHS_PER_SECOND).toBeCloseTo(1.736, 2);
    });

    it("DYSFUNCTION_TAX_PER_SECOND is ~$3.2M", () => {
      expect(DYSFUNCTION_TAX_PER_SECOND).toBeGreaterThan(3e6);
      expect(DYSFUNCTION_TAX_PER_SECOND).toBeLessThan(3.3e6);
    });

    it("DESTRUCTIVE_PER_SECOND is ~$418K", () => {
      expect(DESTRUCTIVE_PER_SECOND).toBeGreaterThan(400e3);
      expect(DESTRUCTIVE_PER_SECOND).toBeLessThan(430e3);
    });

    it("TRIALS_UNFUNDED_PER_SECOND is ~0.064", () => {
      expect(TRIALS_UNFUNDED_PER_SECOND).toBeGreaterThan(0.06);
      expect(TRIALS_UNFUNDED_PER_SECOND).toBeLessThan(0.07);
    });
  });
});
