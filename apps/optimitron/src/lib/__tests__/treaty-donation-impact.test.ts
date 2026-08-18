import { describe, expect, it } from "vitest";
import { getTreatyDonationImpactPerDollar } from "@/lib/treaty-donation-impact";

describe("getTreatyDonationImpactPerDollar", () => {
  it("computes conditional suffering years prevented per campaign dollar", () => {
    const impact = getTreatyDonationImpactPerDollar();

    expect(impact.conditionalSufferingYearsPreventedPerDollar).toBeCloseTo(220.4, 1);
    expect(impact.conditionalSufferingHoursPreventedPerDollar).toBeCloseTo(1_930_000, -4);
    expect(impact.conditionalLivesAvertedPerDollar).toBeCloseTo(10.7, 1);
    expect(impact.successProbability).toBeCloseTo(0.01, 4);
    expect(impact.riskAdjustedSufferingYearsPreventedPerDollar).toBeCloseTo(2.2, 1);
  });
});
