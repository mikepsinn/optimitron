import { describe, expect, it } from "vitest";

import {
  getExplorerPrecomputeIndex,
  getOutcomeMegaStudy,
  getPairSubjectDrilldown,
  getPairStudy,
  listExplorerOutcomes,
  listExplorerPairSummaries,
  listPairSubjectDrilldowns,
  listPairSubjects,
} from "../analysis-explorer-data";

describe("analysis explorer data adapter", () => {
  it("provides non-empty outcomes and pair summaries", () => {
    const outcomes = listExplorerOutcomes();
    const pairs = listExplorerPairSummaries();

    expect(outcomes.length).toBeGreaterThan(0);
    expect(pairs.length).toBeGreaterThan(0);
  });

  it("returns pair studies with adaptive bins and subject coverage", () => {
    const pairs = listExplorerPairSummaries();

    for (const pair of pairs) {
      const study = getPairStudy(pair.outcomeId, pair.predictorId);
      const subjects = listPairSubjects(pair.outcomeId, pair.predictorId);

      expect(study).not.toBeNull();
      expect(study?.adaptiveBinTables.length).toBeGreaterThan(0);
      expect(study?.coverage.includedSubjects).toBeGreaterThan(0);
      expect(subjects.length).toBeGreaterThan(0);
    }
  });

  it("keeps ranking rows connected to pair-study payloads", () => {
    const outcomes = listExplorerOutcomes();

    for (const outcome of outcomes) {
      const ranking = getOutcomeMegaStudy(outcome.id);
      if (!ranking) continue;

      for (const row of ranking.rows) {
        const study = getPairStudy(outcome.id, row.predictorId);
        expect(study).not.toBeNull();
      }
    }
  });

  it("provides precompute cache metadata and subject drilldown diagnostics", () => {
    const precomputeIndex = getExplorerPrecomputeIndex();
    expect(precomputeIndex.cacheKey).toMatch(/^[a-f0-9]{8}$/);
    expect(precomputeIndex.pairCount).toBeGreaterThan(0);
    expect(precomputeIndex.subjectCount).toBeGreaterThan(0);
    expect(precomputeIndex.sourceFingerprints.length).toBeGreaterThan(0);

    const pair = listExplorerPairSummaries()[0];
    expect(pair).toBeDefined();
    if (!pair) return;

    const drilldowns = listPairSubjectDrilldowns(pair.outcomeId, pair.predictorId);
    expect(drilldowns.length).toBeGreaterThan(0);

    for (const drilldown of drilldowns) {
      expect(drilldown.ranking.score).toBeGreaterThanOrEqual(0);
      expect(drilldown.ranking.score).toBeLessThanOrEqual(1);
      expect(drilldown.aggregateComparison.directionAgreement).toMatch(
        /^(aligned|reversed|mixed|insufficient)$/,
      );
    }

    const first = drilldowns[0];
    expect(first).toBeDefined();
    if (!first) return;

    const byId = getPairSubjectDrilldown(
      pair.outcomeId,
      pair.predictorId,
      first.summary.subjectId,
    );
    expect(byId).not.toBeNull();
    expect(byId?.summary.subjectId).toBe(first.summary.subjectId);
  });
});
