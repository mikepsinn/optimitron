import { describe, it, expect } from "vitest";
import {
  fmtParam,
  fmtParamValueOnly,
  formatConfidenceInterval,
} from "../parameters/format-parameter";
import type { Parameter } from "../parameters/parameters-calculations-citations";

function makeParam(overrides: Partial<Parameter> & { value: number }): Parameter {
  return {
    displayName: "Test",
    description: "test param",
    value: overrides.value,
    unit: overrides.unit ?? "",
    ...overrides,
  } as Parameter;
}

describe("fmtParamValueOnly", () => {
  it("keeps $ prefix for USD", () => {
    const p = makeParam({ value: 2.72e12, unit: "USD" });
    expect(fmtParamValueOnly(p)).toBe("$2.72 trillion");
  });

  it("keeps % for percentages", () => {
    const p = makeParam({ value: 0.861, unit: "percentage" });
    expect(fmtParamValueOnly(p)).toBe("86.1%");
  });

  it("strips x suffix from ratios", () => {
    const p = makeParam({ value: 604, unit: "ratio" });
    expect(fmtParamValueOnly(p)).toBe("604");
  });

  it("strips trailing unit words", () => {
    const p = makeParam({ value: 97e6, unit: "deaths" });
    expect(fmtParamValueOnly(p)).toBe("97.0 million");
  });

  it("strips compound unit words", () => {
    const p = makeParam({ value: 50000, unit: "deaths/year" });
    expect(fmtParamValueOnly(p)).toBe("50,000");
  });

  it("passes through dimensionless values", () => {
    const p = makeParam({ value: 42, unit: "" });
    expect(fmtParamValueOnly(p)).toBe("42.0");
  });

  it("keeps USD/patient per-unit suffix", () => {
    const p = makeParam({ value: 929, unit: "USD/patient" });
    expect(fmtParamValueOnly(p)).toBe("$929/patient");
  });
});

describe("formatConfidenceInterval", () => {
  it("returns null when no CI", () => {
    const p = makeParam({ value: 100 });
    expect(formatConfidenceInterval(p)).toBeNull();
  });

  it("formats CI range", () => {
    const p = makeParam({
      value: 50e6,
      unit: "deaths",
      confidenceInterval: [40e6, 60e6],
    });
    const result = formatConfidenceInterval(p);
    expect(result).toBe("40.0 million deaths – 60.0 million deaths");
  });
});
