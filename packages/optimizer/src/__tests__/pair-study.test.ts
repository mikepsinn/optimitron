import { describe, expect, it } from 'vitest';

import {
  PAIR_STUDY_SCHEMA_VERSION,
  PairStudyResultSchema,
  buildPairStudyId,
  collectPairStudyQualityFlags,
  hasBlockingQualityFlags,
  validatePairStudyResult,
  type PairStudyResult,
} from '../pair-study.js';

function createValidPairStudyResult(): PairStudyResult {
  return {
    schemaVersion: PAIR_STUDY_SCHEMA_VERSION,
    studyId: buildPairStudyId({
      scope: 'aggregate_n_of_1',
      predictorId: 'predictor.alpha.level',
      outcomeId: 'outcome.beta.level',
    }),
    generatedAt: '2026-02-13T00:00:00Z',
    scope: {
      scope: 'aggregate_n_of_1',
    },
    predictor: {
      id: 'predictor.alpha.level',
      label: 'Predictor Alpha',
      unit: 'index points',
      transform: 'level',
      lagYears: 1,
    },
    outcome: {
      id: 'outcome.beta.level',
      label: 'Outcome Beta',
      unit: 'score',
      transform: 'yoy_delta',
      lagYears: 1,
    },
    analysis: {
      lagYearsEvaluated: [0, 1, 2, 3],
      predictorTransform: 'level',
      outcomeTransform: 'yoy_delta',
      targetBinCount: 8,
      minBinSize: 25,
      notes: ['yoY delta used to reduce trend confounding'],
    },
    coverage: {
      observations: 1300,
      alignedPairs: 1170,
      includedUnits: 92,
      skippedUnits: 14,
      yearMin: 1980,
      yearMax: 2023,
      predictorMissingFraction: 0.04,
      outcomeMissingFraction: 0.06,
    },
    evidence: {
      evidenceGrade: 'B',
      direction: 'negative',
      predictorImpactScore: 0.62,
      forwardPearson: -0.21,
      reversePearson: -0.08,
      predictivePearson: -0.13,
      pValue: 0.01,
      adjustedPValue: 0.03,
      percentChangeFromBaseline: -1.6,
      consistency: {
        positive: 24,
        negative: 58,
        neutral: 10,
      },
    },
    optimalValue: {
      objective: 'minimum_effective_value',
      centralValue: 18,
      lowerValue: 15,
      upperValue: 22,
      groupedValue: 18,
      predictorUnit: 'index points',
      confidenceLevel: 0.9,
      supportObservations: 740,
      supportUnits: 76,
      expectedOutcomeMetrics: {
        outcome_growth: 0.18,
        outcome_level: 75.6,
      },
      method: 'weighted-unit-median',
    },
    adaptiveBinTables: [
      {
        tableId: 'predictor.level',
        tableLabel: 'Predictor Level Bins',
        predictorUnit: 'index points',
        metricDefinitions: [
          {
            id: 'outcome_level',
            label: 'Outcome Level',
            unit: 'score',
            direction: 'higher_better',
          },
          {
            id: 'outcome_growth',
            label: 'Outcome Growth',
            unit: 'score/year',
            direction: 'higher_better',
          },
        ],
        binning: {
          method: 'adaptive_numeric_bins',
          targetBinCount: 8,
          minBinSize: 25,
          anchors: [20],
          roundTo: 1,
          binsGenerated: 2,
        },
        rows: [
          {
            binIndex: 0,
            label: '10-20',
            lowerBound: 10,
            upperBound: 20,
            isUpperInclusive: false,
            observations: 520,
            units: 63,
            predictorMean: 15.2,
            predictorMedian: 15.0,
            metrics: {
              outcome_level: 76.1,
              outcome_growth: 0.21,
            },
            qualityFlags: [],
          },
          {
            binIndex: 1,
            label: '20-40',
            lowerBound: 20,
            upperBound: 40,
            isUpperInclusive: true,
            observations: 650,
            units: 71,
            predictorMean: 28.4,
            predictorMedian: 27.9,
            metrics: {
              outcome_level: 75.2,
              outcome_growth: 0.11,
            },
            qualityFlags: [
              {
                severity: 'warning',
                code: 'sample.tail.low_coverage',
                message: 'Upper tail has fewer units than central bins.',
              },
            ],
          },
        ],
      },
    ],
    qualityFlags: [
      {
        severity: 'info',
        code: 'outcome.proxy_metric',
        message: 'Outcome level uses a proxy in this dataset.',
      },
    ],
    dataFlow: [
      {
        stepId: 'raw.input',
        label: 'Raw input merge',
        inputCount: 1600,
        outputCount: 1300,
        droppedCount: 300,
      },
      {
        stepId: 'alignment.window',
        label: 'Temporal alignment',
        inputCount: 1300,
        outputCount: 1170,
        droppedCount: 130,
      },
    ],
  };
}

describe('PairStudyResultSchema', () => {
  it('validates a complete pair-study result', () => {
    const parsed = PairStudyResultSchema.parse(createValidPairStudyResult());
    expect(parsed.studyId).toContain('aggregate_n_of_1');
    expect(parsed.adaptiveBinTables[0]?.rows).toHaveLength(2);
  });

  it('applies defaults when optional fields are omitted', () => {
    const base = createValidPairStudyResult();
    const {
      schemaVersion: _schemaVersion,
      qualityFlags: _qualityFlags,
      dataFlow: _dataFlow,
      ...withoutDefaults
    } = base;

    const parsed = PairStudyResultSchema.parse(withoutDefaults);
    expect(parsed.schemaVersion).toBe(PAIR_STUDY_SCHEMA_VERSION);
    expect(parsed.qualityFlags).toEqual([]);
    expect(parsed.dataFlow).toEqual([]);
  });

  it('requires unitId for unit_n_of_1 scope', () => {
    const invalid = createValidPairStudyResult();
    invalid.scope = { scope: 'unit_n_of_1' };

    const parsed = PairStudyResultSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects unknown metrics in bin rows', () => {
    const invalid = createValidPairStudyResult();
    if (invalid.adaptiveBinTables[0]?.rows[0]) {
      invalid.adaptiveBinTables[0].rows[0].metrics.unknown_metric = 99;
    }

    const parsed = PairStudyResultSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects mismatched bin counts', () => {
    const invalid = createValidPairStudyResult();
    if (invalid.adaptiveBinTables[0]) {
      invalid.adaptiveBinTables[0].binning.binsGenerated = 3;
    }

    const parsed = PairStudyResultSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});

describe('pair-study helpers', () => {
  it('buildPairStudyId builds deterministic IDs for aggregate scope', () => {
    const studyId = buildPairStudyId({
      scope: 'aggregate_n_of_1',
      predictorId: 'Predictor Alpha Level',
      outcomeId: 'Outcome Beta Level',
    });

    expect(studyId).toBe(
      'aggregate_n_of_1:predictor-alpha-level:outcome-beta-level',
    );
  });

  it('buildPairStudyId requires unit ID for n-of-1 scope', () => {
    expect(() =>
      buildPairStudyId({
        scope: 'unit_n_of_1',
        predictorId: 'predictor.test',
        outcomeId: 'outcome.test',
      }),
    ).toThrow('unitId is required');
  });

  it('validatePairStudyResult parses valid payloads', () => {
    const parsed = validatePairStudyResult(createValidPairStudyResult());
    expect(parsed.coverage.alignedPairs).toBe(1170);
  });

  it('collectPairStudyQualityFlags combines top-level and bin flags', () => {
    const result = createValidPairStudyResult();
    const flags = collectPairStudyQualityFlags(result);

    expect(flags).toHaveLength(2);
    expect(flags.map(flag => flag.severity)).toEqual(['info', 'warning']);
  });

  it('hasBlockingQualityFlags detects error severity', () => {
    const result = createValidPairStudyResult();
    if (result.adaptiveBinTables[0]?.rows[1]) {
      result.adaptiveBinTables[0].rows[1].qualityFlags.push({
        severity: 'error',
        code: 'bin.empty',
        message: 'Bin has no valid observations after filtering.',
      });
    }

    expect(hasBlockingQualityFlags(result)).toBe(true);
  });
});
