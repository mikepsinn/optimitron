import { describe, expect, it } from "vitest";

import {
  calculateRightToTrialImpact,
  calculateTrialBudgetComparison,
  RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT,
  RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MAX,
  RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MIN,
} from "@/lib/right-to-trial-impact";

describe("right-to-trial impact calculations", () => {
  it("reproduces the published central scenario", () => {
    const impact = calculateRightToTrialImpact(
      RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_DEFAULT,
    );

    expect(impact.averageWaitYears).toBeCloseTo(40.45, 2);
    expect(impact.yearsEarlier).toBeCloseTo(181.22, 2);
    expect(impact.livesSaved).toBeCloseTo(9.19e9, -7);
    expect(impact.dalysAverted).toBeCloseTo(4.834e11, -8);
    expect(impact.costPerDaly).toBeCloseTo(0.00013446, 8);
  });

  it("clamps the discovery multiplier to the published range", () => {
    expect(calculateRightToTrialImpact(0).multiplier).toBe(
      RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MIN,
    );
    expect(calculateRightToTrialImpact(100).multiplier).toBe(
      RIGHT_TO_TRIAL_DISCOVERY_MULTIPLIER_MAX,
    );
  });

  it("compares the patient reach of the same trial budget", () => {
    const comparison = calculateTrialBudgetComparison(1_000_000);

    expect(comparison.conventionalParticipants).toBe(24);
    expect(comparison.pragmaticParticipants).toBe(1076);
    expect(comparison.costReductionMultiplier).toBeCloseTo(44.1, 1);
  });
});
