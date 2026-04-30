import { describe, expect, it } from "vitest";
import { buildTriggerParams } from "@/lib/triggers/context";

describe("buildTriggerParams", () => {
  const params = buildTriggerParams();

  it("emits raw + Linked variants for every parameter", () => {
    const linkedKeys = [
      "militaryVsResearchRatio",
      "statusQuoYears",
      "dfdaYears",
      "apocalypseCount",
      "annualLivesSaved",
      "healthYearsGain",
      "lifetimeIncomeGain",
    ];
    const rawOnlyKeys = [
      "globalHumanity",
      "majorityHumanity",
      "doublingRoundsToTarget",
      "requiredPhoneCalls",
      "directHumanAssignments",
      "propagationAsksPerHuman",
    ];
    for (const key of linkedKeys) {
      expect(params).toHaveProperty(key);
      expect(params).toHaveProperty(`${key}Linked`);
    }
    for (const key of rawOnlyKeys) {
      expect(params).toHaveProperty(key);
    }
  });

  it("raw variants are plain numbers (no markdown syntax)", () => {
    expect(params.militaryVsResearchRatio).not.toContain("[");
    expect(params.statusQuoYears).not.toContain("[");
    expect(params.apocalypseCount).not.toContain("[");
    // Numeric-or-currency-formatted strings; never markdown.
    expect(params.militaryVsResearchRatio).toMatch(/^\d+$/);
    expect(params.statusQuoYears).toMatch(/^\d+$/);
    expect(params.lifetimeIncomeGain).toMatch(/^\$\d+(\.\d+)?M$/);
  });

  it("Linked variants are markdown links with manual.warondisease.org URL", () => {
    // Format: [<value>](<https://...>)
    expect(params.militaryVsResearchRatioLinked).toMatch(/^\[\d+\]\(https?:\/\/.+\)$/);
    expect(params.statusQuoYearsLinked).toMatch(/^\[\d+\]\(https?:\/\/.+\)$/);
    expect(params.dfdaYearsLinked).toMatch(/^\[\d+\]\(https?:\/\/.+\)$/);
    expect(params.apocalypseCountLinked).toMatch(/^\[\d+\]\(https?:\/\/.+\)$/);
    expect(params.lifetimeIncomeGainLinked).toMatch(/^\[\$\d+(\.\d+)?M\]\(https?:\/\/.+\)$/);
  });

  it("Linked variant URLs prefer manualPageUrl over calculationsUrl over sourceUrl", () => {
    // Each known parameter has a manualPageUrl in the dataset, so the
    // linked variant should land on `manual.warondisease.org/...`. If a
    // parameter loses its manualPageUrl in the future, the test catches
    // a silent fallback to a less-friendly URL surface.
    const linkedValues = [
      params.militaryVsResearchRatioLinked,
      params.statusQuoYearsLinked,
      params.dfdaYearsLinked,
      params.apocalypseCountLinked,
      params.healthYearsGainLinked,
      params.lifetimeIncomeGainLinked,
    ];
    for (const linked of linkedValues) {
      expect(linked.toLowerCase()).toContain("manual.warondisease.org");
    }
  });

  it("Linked value text matches the raw variant exactly (so substituting either is safe)", () => {
    expect(params.militaryVsResearchRatioLinked).toContain(`[${params.militaryVsResearchRatio}]`);
    expect(params.statusQuoYearsLinked).toContain(`[${params.statusQuoYears}]`);
    expect(params.lifetimeIncomeGainLinked).toContain(`[${params.lifetimeIncomeGain}]`);
  });
});
