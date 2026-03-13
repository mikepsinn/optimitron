import { describe, expect, it } from "vitest";
import {
  computeCollapseDate,
  computeCollapseYears,
  generateTrajectoryData,
  PROJECTION_YEARS,
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
});
