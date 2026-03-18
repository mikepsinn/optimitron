import { describe, expect, it } from "vitest";

import type { AggregatedNOf1DrugEnforcementRow } from "@optimitron/data";
import {
  buildAggregatedDrugWarProxySubjects,
  renderAggregatedDrugWarProxyMarkdown,
  runAggregatedDrugWarProxyStudy,
} from "../drug-war-proxy-aggregated-study.js";

function buildSyntheticRows(): AggregatedNOf1DrugEnforcementRow[] {
  const rows: AggregatedNOf1DrugEnforcementRow[] = [];
  const subjects = ["AAA", "BBB", "CCC"];
  for (const [subjectIndex, iso3] of subjects.entries()) {
    for (let year = 2000; year <= 2018; year += 1) {
      const yearOffset = year - 2000;
      const publicOrderSpending = 350 + subjectIndex * 20 + yearOffset * 6;
      const traffickingShare = 0.08 + subjectIndex * 0.01 + yearOffset * 0.0005;
      const lawShare = traffickingShare + 0.07;
      const estimatedTraffickingSpend = publicOrderSpending * traffickingShare;
      const estimatedLawSpend = publicOrderSpending * lawShare;
      const outcome = 28 - estimatedTraffickingSpend * 0.04 + subjectIndex * 0.4;
      rows.push({
        iso3,
        year,
        publicOrderSafetySpendingLcu: null,
        publicOrderSafetySpendingPctGdp: null,
        publicOrderSafetySpendingPerCapitaPpp: publicOrderSpending,
        drugTraffickingArrestsCount: 1000 + yearOffset * 10,
        drugPossessionArrestsCount: 700 + yearOffset * 8,
        totalArrestsCount: 12000 + yearOffset * 40,
        drugTraffickingArrestShare: traffickingShare,
        drugLawArrestShare: lawShare,
        estimatedDrugTraffickingEnforcementSpendingPerCapitaPpp: estimatedTraffickingSpend,
        estimatedDrugLawEnforcementSpendingPerCapitaPpp: estimatedLawSpend,
        oecdAccidentalPoisoningDeathsPer100k: outcome,
        wbUnintentionalPoisoningDeathsPer100k: outcome,
        spendingCurrency: "XCU",
      });
    }
  }
  return rows;
}

describe("drug-war-proxy-aggregated-study", () => {
  it("builds one subject series per jurisdiction", () => {
    const rows = buildSyntheticRows();
    const subjects = buildAggregatedDrugWarProxySubjects(
      rows,
      "oecd_accidental_poisoning",
      "estimated_drug_trafficking_enforcement",
      10,
    );
    expect(subjects).toHaveLength(3);
    expect(subjects[0]?.predictor.measurements.length).toBe(19);
    expect(subjects[0]?.outcome.measurements.length).toBe(19);
  });

  it("runs aggregated analysis on synthetic panel data", () => {
    const rows = buildSyntheticRows();
    const study = runAggregatedDrugWarProxyStudy({
      rows,
      lagYears: [0, 1],
      durationYears: [1],
      minimumPairs: 8,
      minimumYearsPerSubject: 10,
      outcomeSource: "oecd_accidental_poisoning",
      predictorSource: "estimated_drug_trafficking_enforcement",
    });
    expect(study.subjectCount).toBe(3);
    expect(study.includedSubjects).toBe(3);
    expect(study.pairCount).toBeGreaterThan(20);
    expect(study.temporalProfiles.length).toBeGreaterThan(0);
    expect(study.binRows.length).toBeGreaterThan(0);
    expect(study.suggestedSpendingPerCapitaPpp).not.toBeNull();
  });

  it("renders markdown with core sections", () => {
    const rows = buildSyntheticRows();
    const study = runAggregatedDrugWarProxyStudy({
      rows,
      lagYears: [0],
      durationYears: [1],
      minimumPairs: 8,
      minimumYearsPerSubject: 10,
      predictorSource: "estimated_drug_trafficking_enforcement",
    });
    const markdown = renderAggregatedDrugWarProxyMarkdown(study);
    expect(markdown).toContain(
      "# Aggregated N-of-1: Estimated Drug Enforcement Spending vs Poisoning Deaths",
    );
    expect(markdown).toContain("## ELI5 Summary");
    expect(markdown).toContain("### What These Numbers Mean");
    expect(markdown).toContain("## Topline");
    expect(markdown).toContain("## Spending Bins");
    expect(markdown).toContain("## Lag Sensitivity");
  });
});
