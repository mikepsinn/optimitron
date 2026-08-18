import { describe, expect, it } from "vitest";
import {
  BED_NETS_COST_PER_DALY,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION,
  TREATY_REDUCTION_PCT,
} from "@optimitron/data/parameters";
import { deriveDonationImpact } from "./donation-impact-calc";

const wishoniaDefaults = {
  votesNeeded: THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value,
  costPerVote: 2,
  successProbability: 1,
  treatyReductionPct: TREATY_REDUCTION_PCT.value,
};

describe("deriveDonationImpact", () => {
  it("returns published parameter values at conditional defaults", () => {
    const out = deriveDonationImpact(wishoniaDefaults);
    expect(out.livesSaved).toBeCloseTo(
      DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value,
      0,
    );
    expect(out.dalys).toBeCloseTo(
      DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.value,
      0,
    );
    expect(out.campaignCostUsd).toBe(
      THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value * 2,
    );
  });

  it("scales lives saved linearly with treaty reduction", () => {
    const single = deriveDonationImpact(wishoniaDefaults);
    const doubled = deriveDonationImpact({
      ...wishoniaDefaults,
      treatyReductionPct: TREATY_REDUCTION_PCT.value * 2,
    });
    expect(doubled.livesSaved).toBeCloseTo(single.livesSaved * 2, 0);
  });

  it("scales lives saved linearly with success probability", () => {
    const conditional = deriveDonationImpact(wishoniaDefaults);
    const halved = deriveDonationImpact({
      ...wishoniaDefaults,
      successProbability: 0.5,
    });
    expect(halved.livesSaved).toBeCloseTo(conditional.livesSaved * 0.5, 0);
  });

  it("computes campaign cost from votes × cost per vote", () => {
    const out = deriveDonationImpact({
      ...wishoniaDefaults,
      votesNeeded: 100_000_000,
      costPerVote: 5,
    });
    expect(out.campaignCostUsd).toBe(500_000_000);
  });

  it("beats bed nets even at the skeptical 1% success probability", () => {
    const skeptical = deriveDonationImpact({
      ...wishoniaDefaults,
      successProbability: 0.01,
    });
    expect(skeptical.vsBedNetsMultiplier).toBeGreaterThan(1);
    expect(skeptical.costPerDaly).toBeLessThan(BED_NETS_COST_PER_DALY.value);
  });

  it("returns Infinity cost-per-life when impact is zero", () => {
    const zeroed = deriveDonationImpact({
      ...wishoniaDefaults,
      successProbability: 0,
    });
    expect(zeroed.costPerLife).toBe(Infinity);
    expect(zeroed.costPerDaly).toBe(Infinity);
    expect(zeroed.roi).toBe(0);
  });
});
