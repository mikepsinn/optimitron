import { describe, expect, it } from "vitest";

import {
  buildDrugWarSeries,
  evaluateDrugWarTemporalProfiles,
  renderDrugWarOverdoseMarkdown,
  runDrugWarOverdoseStudy,
} from "../drug-war-overdose-study.js";

describe("drug-war-overdose-study", () => {
  it("buildDrugWarSeries converts spending to per-capita USD", () => {
    const series = buildDrugWarSeries();
    const firstPredictor = series.predictorSpendingPerCapita.measurements[0];
    const firstOutcome = series.outcomeOverdoseDeaths.measurements[0];

    expect(firstPredictor?.value).toBeCloseTo(61.28, 1);
    expect(firstPredictor?.unit).toBe("USD/person");
    expect(firstOutcome?.value).toBe(16849);
  });

  it("evaluateDrugWarTemporalProfiles returns scored candidates", () => {
    const series = buildDrugWarSeries();
    const profiles = evaluateDrugWarTemporalProfiles(
      series.predictorSpendingPerCapita,
      series.outcomeOverdoseDeaths,
      [0, 1, 2],
      [1, 2],
    );

    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles[0]?.score ?? 0).toBeGreaterThanOrEqual(profiles[profiles.length - 1]?.score ?? 0);
    expect(profiles[0]?.totalPairs ?? 0).toBeGreaterThan(0);
  });

  it("runDrugWarOverdoseStudy returns a complete study artifact", () => {
    const study = runDrugWarOverdoseStudy();

    expect(study.pairCount).toBeGreaterThan(8);
    expect(study.bestTemporalProfile.durationYears).toBeGreaterThanOrEqual(1);
    expect(study.temporalProfiles.length).toBeGreaterThan(1);
    expect(study.binRows.length).toBeGreaterThan(0);
    expect(study.minimumEffectiveDosePerCapitaUsd).not.toBeNull();
    expect(study.minimumEffectiveDosePerCapitaUsd).toBeGreaterThanOrEqual(0);
    if (study.diminishingReturnsKneePerCapitaUsd != null) {
      expect(study.minimumEffectiveDosePerCapitaUsd!).toBeLessThanOrEqual(
        study.diminishingReturnsKneePerCapitaUsd,
      );
    }
    expect(study.notes.length).toBeGreaterThan(0);
  });

  it("renderDrugWarOverdoseMarkdown includes key sections", () => {
    const study = runDrugWarOverdoseStudy();
    const markdown = renderDrugWarOverdoseMarkdown(study);

    expect(markdown).toContain("# US Drug War Spending vs Overdose Deaths");
    expect(markdown).toContain("## Topline");
    expect(markdown).toContain("## Spending Bins (Observed Data)");
    expect(markdown).toContain("## Lag Sensitivity");
  });
});
