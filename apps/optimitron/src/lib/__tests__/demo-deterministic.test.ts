import { describe, expect, it } from "vitest";
import {
  DEMO_REFERENCE_YEAR,
  buildDrugPolicyEmojiPositions,
  buildTerminalMatrixColumns,
  deterministicUnit,
  getCollapseYearsLeft,
} from "@/lib/demo/deterministic";

describe("demo deterministic helpers", () => {
  it("returns a stable unit interval value for a given seed", () => {
    expect(deterministicUnit(42)).toBe(deterministicUnit(42));
    expect(deterministicUnit(42)).toBeGreaterThanOrEqual(0);
    expect(deterministicUnit(42)).toBeLessThan(1);
  });

  it("builds stable terminal columns without runtime randomness", () => {
    const first = buildTerminalMatrixColumns(2, 3);
    const second = buildTerminalMatrixColumns(2, 3);

    expect(first).toEqual(second);
    expect(first).toHaveLength(2);
    expect(first[0]?.glyphs).toHaveLength(3);
    expect(first[1]?.leftPct).toBe(50);
    expect(first.every((column) => column.durationSeconds >= 3)).toBe(true);
    expect(first.every((column) => column.delaySeconds >= 0)).toBe(true);
  });

  it("builds stable emoji positions within the viewport bounds", () => {
    const first = buildDrugPolicyEmojiPositions(3);
    const second = buildDrugPolicyEmojiPositions(3);

    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    expect(first[0]?.delayMs).toBe(0);
    expect(first[1]?.delayMs).toBe(120);
    expect(first.every((position) => position.xPct >= 8 && position.xPct <= 92)).toBe(true);
    expect(first.every((position) => position.yPct >= 8 && position.yPct <= 92)).toBe(true);
  });

  it("computes collapse years from the demo reference year", () => {
    expect(getCollapseYearsLeft(2040)).toBe(2040 - DEMO_REFERENCE_YEAR);
    expect(getCollapseYearsLeft(2040, 2030)).toBe(10);
  });
});
