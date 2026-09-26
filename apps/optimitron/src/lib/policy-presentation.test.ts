import { describe, expect, it } from "vitest";
import { formatPolicyEffect } from "./policy-presentation";

describe("policy effect units", () => {
  it("retains fractional inputs as percentages without inventing a baseline or horizon", () => {
    expect(formatPolicyEffect(0.3)).toBe("+30%");
    expect(formatPolicyEffect(0.05)).toBe("+5%");
    expect(formatPolicyEffect(-0.125)).toBe("-12.5%");
  });
  it("distinguishes an unestimated effect from a measured zero", () => {
    expect(formatPolicyEffect(null)).toBe("Not estimated");
    expect(formatPolicyEffect(Number.NaN)).toBe("Not estimated");
    expect(formatPolicyEffect(0)).toBe("0%");
  });
});
