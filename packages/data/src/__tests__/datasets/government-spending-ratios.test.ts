import { describe, expect, it } from "vitest";
import {
  getGovernmentMetrics,
  type GovernmentMetrics,
} from "../../datasets/government-report-cards";
import {
  getAnnualDollarFlowPerCapitaPPP,
  getArmsExportsPerCapitaPPP,
  getGovernmentClinicalTrialSpendingPerCapitaPPP,
  getGovernmentMedicalResearchSpendingPerCapitaPPP,
  getMilitarySpendingPerCapitaPPP,
  getMilitaryToGovernmentClinicalTrialRatio,
  getMilitaryToGovernmentMedicalResearchRatio,
} from "../../datasets/government-spending-ratios";

function createGovernment(
  overrides: Partial<GovernmentMetrics>,
): GovernmentMetrics {
  return {
    ...getGovernmentMetrics("US")!,
    ...overrides,
  };
}

describe("government spending ratios", () => {
  it("computes the military-to-government-clinical-trials ratio", () => {
    const us = getGovernmentMetrics("US")!;

    expect(getMilitaryToGovernmentClinicalTrialRatio(us)).toBeCloseTo(
      886_000_000_000 / 810_000_000,
      4,
    );
  });

  it("computes the military-to-government-medical-research ratio", () => {
    const us = getGovernmentMetrics("US")!;

    expect(getMilitaryToGovernmentMedicalResearchRatio(us)).toBeCloseTo(
      886_000_000_000 / 47_100_000_000,
      4,
    );
  });

  it("returns null when clinical trial spending is missing", () => {
    const gov = createGovernment({
      clinicalTrialSpending: null,
    });

    expect(getMilitaryToGovernmentClinicalTrialRatio(gov)).toBeNull();
  });

  it("returns null when medical research spending is not positive", () => {
    const gov = createGovernment({
      govMedicalResearchSpending: {
        value: 0,
        source: "Zero medical research spending",
      },
    });

    expect(getMilitaryToGovernmentMedicalResearchRatio(gov)).toBeNull();
  });

  it("computes military spending per capita in PPP terms", () => {
    const us = getGovernmentMetrics("US")!;

    expect(getMilitarySpendingPerCapitaPPP(us)).toBeCloseTo(
      (3.4 / 100) * 80_035,
      4,
    );
  });

  it("converts annual dollar flows into per-capita PPP values", () => {
    const us = getGovernmentMetrics("US")!;

    expect(
      getAnnualDollarFlowPerCapitaPPP(us, us.govMedicalResearchSpending?.value),
    ).toBeCloseTo(
      ((47_100_000_000 / 886_000_000_000) * (3.4 / 100) * 80_035),
      4,
    );
  });

  it("computes government medical research and clinical trials per capita PPP", () => {
    const us = getGovernmentMetrics("US")!;

    expect(getGovernmentMedicalResearchSpendingPerCapitaPPP(us)).toBeCloseTo(
      ((47_100_000_000 / 886_000_000_000) * (3.4 / 100) * 80_035),
      4,
    );
    expect(getGovernmentClinicalTrialSpendingPerCapitaPPP(us)).toBeCloseTo(
      ((810_000_000 / 886_000_000_000) * (3.4 / 100) * 80_035),
      4,
    );
  });

  it("computes arms exports per capita PPP", () => {
    const us = getGovernmentMetrics("US")!;

    expect(getArmsExportsPerCapitaPPP(us)).toBeCloseTo(
      ((23_800_000_000 / 886_000_000_000) * (3.4 / 100) * 80_035),
      4,
    );
  });
});
