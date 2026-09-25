import { describe, expect, it } from "vitest";
import { incomeMultipleAt, type IncomeAnchor } from "./income-futures";

const path: IncomeAnchor[] = [
  { year: 2025, multiple: 1 },
  { year: 2040, multiple: 4 },
  { year: 2045, multiple: 8 },
];

describe("incomeMultipleAt", () => {
  it("returns the anchor multiple on an anchor year", () => {
    expect(incomeMultipleAt(path, 2025)).toBe(1);
    expect(incomeMultipleAt(path, 2040)).toBe(4);
    expect(incomeMultipleAt(path, 2045)).toBe(8);
  });

  it("grows at a constant rate between anchors", () => {
    // Halfway from 1x to 4x at constant growth is 2x, not the linear 2.5x.
    expect(incomeMultipleAt(path, 2032.5)).toBeCloseTo(2, 10);
    // The second segment uses its own rate: 4x to 8x over 5 years.
    expect(incomeMultipleAt(path, 2042.5)).toBeCloseTo(4 * Math.SQRT2, 10);
  });

  it("clamps years outside the anchors", () => {
    expect(incomeMultipleAt(path, 2000)).toBe(1);
    expect(incomeMultipleAt(path, 2100)).toBe(8);
  });
});
