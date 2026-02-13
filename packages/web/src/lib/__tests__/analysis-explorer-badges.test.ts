import { describe, expect, it } from "vitest";

import { buildOutcomeQualityBadges, buildPairStudyQualityBadges } from "../analysis-explorer-badges";
import {
  getOutcomeMegaStudy,
  getPairStudy,
  listExplorerOutcomes,
  listExplorerPairSummaries,
} from "../analysis-explorer-data";

describe("analysis explorer quality badges", () => {
  it("builds outcome-row badges with significance, certainty, and direction", () => {
    const outcomes = listExplorerOutcomes();
    expect(outcomes.length).toBeGreaterThan(0);

    const ranking = outcomes
      .map(outcome => getOutcomeMegaStudy(outcome.id))
      .find(result => !!result && result.rows.length > 0);
    expect(ranking).toBeDefined();
    if (!ranking) return;

    const row = ranking.rows[0];
    expect(row).toBeDefined();
    if (!row) return;

    const badges = buildOutcomeQualityBadges(row);
    expect(badges.map(badge => badge.key)).toEqual([
      "significance",
      "certainty",
      "direction",
    ]);
  });

  it("builds pair-study badges with evidence and quality warning status", () => {
    const pair = listExplorerPairSummaries()[0];
    expect(pair).toBeDefined();
    if (!pair) return;

    const study = getPairStudy(pair.outcomeId, pair.predictorId);
    expect(study).not.toBeNull();
    if (!study) return;

    const badges = buildPairStudyQualityBadges(study);
    const badgeKeys = badges.map(badge => badge.key);

    expect(badgeKeys).toContain("evidence_grade");
    expect(badgeKeys).toContain("direction");
    expect(
      badgeKeys.includes("quality_errors") ||
        badgeKeys.includes("quality_warnings") ||
        badgeKeys.includes("quality_clean"),
    ).toBe(true);
  });
});
