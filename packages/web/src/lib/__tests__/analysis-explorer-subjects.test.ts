import { describe, expect, it } from "vitest";

import { getPairStudy, listExplorerPairSummaries } from "../analysis-explorer-data";
import { buildSubjectDrilldowns } from "../analysis-explorer-subjects";
import type { ExplorerSubjectSummary } from "../analysis-explorer-types";

describe("analysis explorer subject diagnostics", () => {
  it("applies quality gates and deterministic ranking order", () => {
    const firstPair = listExplorerPairSummaries()[0];
    expect(firstPair).toBeDefined();
    if (!firstPair) return;

    const study = getPairStudy(firstPair.outcomeId, firstPair.predictorId);
    expect(study).not.toBeNull();
    if (!study) return;

    const subjects: ExplorerSubjectSummary[] = [
      {
        subjectId: "strong_subject",
        subjectName: "Strong Subject",
        optimalPredictorValue: 22,
        forwardPearson: 0.34,
        predictivePearson: 0.27,
        percentChangeFromBaseline: 4.8,
        numberOfPairs: 44,
        evidenceGrade: "A",
      },
      {
        subjectId: "weak_subject",
        subjectName: "Weak Subject",
        optimalPredictorValue: 18,
        forwardPearson: 0.01,
        predictivePearson: 0.0,
        percentChangeFromBaseline: 0.04,
        numberOfPairs: 3,
        evidenceGrade: "D",
      },
      {
        subjectId: "borderline_subject",
        subjectName: "Borderline Subject",
        optimalPredictorValue: 19,
        forwardPearson: 0.06,
        predictivePearson: 0.04,
        percentChangeFromBaseline: 0.4,
        numberOfPairs: 10,
        evidenceGrade: "C",
      },
    ];

    const drilldownsA = buildSubjectDrilldowns(study, subjects, {
      minimumPairs: 10,
      minAbsForwardPearson: 0.05,
      minAbsPredictivePearson: 0.05,
      minAbsPercentChange: 0.25,
    });
    const drilldownsB = buildSubjectDrilldowns(study, subjects, {
      minimumPairs: 10,
      minAbsForwardPearson: 0.05,
      minAbsPredictivePearson: 0.05,
      minAbsPercentChange: 0.25,
    });

    expect(drilldownsA.map(row => row.summary.subjectId)).toEqual(
      drilldownsB.map(row => row.summary.subjectId),
    );

    const strong = drilldownsA.find(row => row.summary.subjectId === "strong_subject");
    const weak = drilldownsA.find(row => row.summary.subjectId === "weak_subject");
    expect(strong?.qualityGate.passed).toBe(true);
    expect(weak?.qualityGate.passed).toBe(false);
    expect(weak?.qualityGate.reasons.map(reason => reason.code)).toContain("coverage.low_pairs");
    expect(weak?.qualityGate.reasons.map(reason => reason.code)).toContain("signal.weak");

    expect(drilldownsA[0]?.summary.subjectId).toBe("strong_subject");
    expect(drilldownsA[0]?.ranking.score).toBeGreaterThan(
      drilldownsA[drilldownsA.length - 1]?.ranking.score ?? 0,
    );
  });
});
