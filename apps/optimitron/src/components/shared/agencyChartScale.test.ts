import { describe, expect, it } from "vitest";
import { formatUsd, formatValue, valueAxis, yearTicks } from "./agencyChartScale";

describe("valueAxis", () => {
  it("starts a dollar axis at $0", () => {
    expect(valueAxis([18e9, 23e9, 47.3e9], true)).toEqual({
      lo: 0,
      hi: 60e9,
      ticks: [0, 20e9, 40e9, 60e9],
    });
  });

  it("starts an outcome axis at 0 when its smallest value is at most half of its largest", () => {
    expect(valueAxis([17_415, 107_941], false).ticks).toEqual([0, 50_000, 100_000, 150_000]);
  });

  // The lowest tick label shows that the axis does not start at 0.
  it("zooms in on an outcome whose values stay above half of its largest value", () => {
    expect(valueAxis([38, 45, 60], false).ticks).toEqual([30, 40, 50, 60]);
  });

  it("keeps negative values on the axis", () => {
    expect(valueAxis([-5, 10], true).ticks).toEqual([-5, 0, 5, 10]);
  });

  // A zero-height axis would divide by zero when the chart scales a point.
  it("gives a constant series an axis with height", () => {
    const axis = valueAxis([0, 0], true);
    expect(axis.hi).toBeGreaterThan(axis.lo);
  });
});

describe("yearTicks", () => {
  it("labels the first year, the last year, and round years between them", () => {
    expect(yearTicks(2000, 2024)).toEqual([2000, 2005, 2010, 2015, 2020, 2024]);
  });

  it("leaves out a round year that is too near the last year", () => {
    expect(yearTicks(2000, 2021)).toEqual([2000, 2005, 2010, 2015, 2021]);
  });

  it("labels a single year once", () => {
    expect(yearTicks(2020, 2020)).toEqual([2020]);
  });
});

describe("formatUsd", () => {
  it("uses K, M, B, and T at each thousandfold threshold", () => {
    expect(formatUsd(999)).toBe("$999");
    expect(formatUsd(1_000)).toBe("$1K");
    expect(formatUsd(1_500_000)).toBe("$1.5M");
    expect(formatUsd(47.3e9)).toBe("$47.3B");
    expect(formatUsd(2.72e12)).toBe("$2.72T");
  });
});

describe("formatValue", () => {
  it("abbreviates values from 10,000", () => {
    expect(formatValue(9_999)).toBe("9,999");
    expect(formatValue(10_000)).toBe("10K");
    expect(formatValue(107_941)).toBe("107.9K");
  });
});
