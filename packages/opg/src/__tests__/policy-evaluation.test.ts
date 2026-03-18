import { describe, expect, it } from 'vitest';
import { NATURAL_EXPERIMENTS } from '@optimitron/data';
import {
  convertNaturalExperimentData,
  runNaturalExperiment,
  evaluatePolicy,
  aggregateEffectSizes,
  deriveEvidenceGrade,
  buildPanelAnalysis,
} from '../policy-evaluation.js';
import type { NaturalExperimentDef, OutcomeMetric } from '../policy-evaluation.js';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const PORTUGAL = NATURAL_EXPERIMENTS.find(e => e.jurisdictionCode === 'PRT')!;
const AUSTRALIA = NATURAL_EXPERIMENTS.find(e => e.jurisdictionCode === 'AUS')!;

// Tiny dataset that should be skipped (< 3 points)
const INSUFFICIENT_EXPERIMENT: NaturalExperimentDef = {
  policy: 'Test Policy',
  jurisdiction: 'Testland',
  jurisdictionCode: 'TST',
  interventionYear: 2010,
  outcomes: [
    {
      metric: { name: 'Some Metric', id: 'some-metric', unit: 'count', direction: 'lower' },
      data: [
        { year: 2009, value: 10 },
        { year: 2011, value: 8 },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// convertNaturalExperimentData
// ---------------------------------------------------------------------------

describe('convertNaturalExperimentData', () => {
  it('converts Portugal data with correct structure', () => {
    const def = convertNaturalExperimentData(PORTUGAL);

    expect(def.policy).toBe('Drug Decriminalization');
    expect(def.jurisdiction).toBe('Portugal');
    expect(def.jurisdictionCode).toBe('PRT');
    expect(def.interventionYear).toBe(2001);
    expect(def.outcomes).toHaveLength(PORTUGAL.outcomes.length);
  });

  it('generates valid OutcomeMetric ids from metric strings', () => {
    const def = convertNaturalExperimentData(PORTUGAL);

    expect(def.outcomes[0]!.metric.id).toBe('drug-induced-deaths');
    expect(def.outcomes[0]!.metric.name).toBe('Drug-Induced Deaths');
    expect(def.outcomes[0]!.metric.unit).toBe('deaths per million population');
    expect(def.outcomes[0]!.metric.direction).toBe('lower');
  });

  it('generates kebab-case ids for multi-word metrics', () => {
    const def = convertNaturalExperimentData(AUSTRALIA);

    expect(def.outcomes[0]!.metric.id).toBe('gun-homicide-rate');
  });

  it('preserves all data points', () => {
    const def = convertNaturalExperimentData(PORTUGAL);

    expect(def.outcomes[0]!.data.length).toBe(PORTUGAL.outcomes[0]!.data.length);
    expect(def.outcomes[0]!.data[0]).toEqual(PORTUGAL.outcomes[0]!.data[0]);
  });
});

// ---------------------------------------------------------------------------
// runNaturalExperiment
// ---------------------------------------------------------------------------

describe('runNaturalExperiment', () => {
  it('analyzes Portugal drug decriminalization — deaths decrease', () => {
    const def = convertNaturalExperimentData(PORTUGAL);
    const results = runNaturalExperiment(def);

    expect(results.length).toBeGreaterThan(0);

    const deaths = results.find(r => r.outcomeMetric.id === 'drug-induced-deaths');
    expect(deaths).toBeDefined();
    expect(deaths!.jurisdiction).toBe('Portugal');
    expect(deaths!.policy).toBe('Drug Decriminalization');
    expect(deaths!.interventionDate).toBe('2001-01-01');

    // Drug deaths should decrease after decriminalization
    expect(deaths!.postMean).toBeLessThan(deaths!.preMean);
    expect(deaths!.percentChange).toBeLessThan(0);
    expect(deaths!.preDataPoints).toBeGreaterThan(0);
    expect(deaths!.postDataPoints).toBeGreaterThan(0);

    // analysisResult should be a valid FullAnalysisResult
    expect(deaths!.analysisResult).toHaveProperty('forwardPearson');
    expect(deaths!.analysisResult).toHaveProperty('bradfordHill');
    expect(deaths!.analysisResult).toHaveProperty('pis');
  });

  it('analyzes Australia gun buyback — gun deaths decrease', () => {
    const def = convertNaturalExperimentData(AUSTRALIA);
    const results = runNaturalExperiment(def);

    expect(results.length).toBeGreaterThan(0);

    const homicide = results.find(r => r.outcomeMetric.id === 'gun-homicide-rate');
    expect(homicide).toBeDefined();
    expect(homicide!.postMean).toBeLessThan(homicide!.preMean);
    expect(homicide!.percentChange).toBeLessThan(0);
  });

  it('returns empty array for insufficient data (< 3 points)', () => {
    const results = runNaturalExperiment(INSUFFICIENT_EXPERIMENT);
    expect(results).toEqual([]);
  });

  it('returns one result per outcome metric', () => {
    const def = convertNaturalExperimentData(PORTUGAL);
    const results = runNaturalExperiment(def);

    // Portugal has 2 outcomes: Drug-Induced Deaths, HIV Diagnoses
    expect(results).toHaveLength(def.outcomes.length);
  });

  it('populates yearRange correctly', () => {
    const def = convertNaturalExperimentData(PORTUGAL);
    const results = runNaturalExperiment(def);

    const deaths = results.find(r => r.outcomeMetric.id === 'drug-induced-deaths')!;
    expect(deaths.yearRange).toBe('1995-2019');
  });
});

// ---------------------------------------------------------------------------
// aggregateEffectSizes
// ---------------------------------------------------------------------------

describe('aggregateEffectSizes', () => {
  it('returns zeros for empty input', () => {
    const result = aggregateEffectSizes([]);
    expect(result.weightedEffect).toBe(0);
    expect(result.consistency).toBe(0);
    expect(result.totalWeight).toBe(0);
  });

  it('computes weighted average for known inputs', () => {
    const result = aggregateEffectSizes([
      { effectSize: 0.5, dataPoints: 100, direction: 'lower', correlation: -0.6 },
      { effectSize: 0.3, dataPoints: 25, direction: 'lower', correlation: -0.4 },
    ]);

    // Both have negative correlation + lower direction → normalized positive
    expect(result.weightedEffect).toBeGreaterThan(0);
    expect(result.consistency).toBe(1); // both positive after normalization
    expect(result.totalWeight).toBeGreaterThan(0);
  });

  it('reflects mixed directions in consistency', () => {
    const result = aggregateEffectSizes([
      { effectSize: 0.5, dataPoints: 100, direction: 'lower', correlation: -0.6 },
      { effectSize: 0.3, dataPoints: 100, direction: 'lower', correlation: 0.4 }, // wrong direction
    ]);

    expect(result.consistency).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// deriveEvidenceGrade
// ---------------------------------------------------------------------------

describe('deriveEvidenceGrade', () => {
  it('grade A for strong multi-jurisdiction evidence', () => {
    const result = deriveEvidenceGrade(0.6, 4, 4, 0.9);
    expect(result.grade).toBe('A');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('grade B for good evidence', () => {
    const result = deriveEvidenceGrade(0.4, 2, 2, 0.8);
    expect(result.grade).toBe('B');
  });

  it('grade C for moderate evidence', () => {
    const result = deriveEvidenceGrade(0.25, 1, 1, 0.6);
    expect(result.grade).toBe('C');
  });

  it('grade D for weak evidence', () => {
    const result = deriveEvidenceGrade(0.05, 1, 1, 0.5);
    expect(result.grade).toBe('D');
  });

  it('grade F for counterproductive policy', () => {
    const result = deriveEvidenceGrade(-0.5, 3, 3, 0.8);
    expect(result.grade).toBe('F');
    expect(result.verdict).toContain('counterproductive');
  });
});

// ---------------------------------------------------------------------------
// evaluatePolicy (integration)
// ---------------------------------------------------------------------------

describe('evaluatePolicy', () => {
  it('assembles a complete PolicyEvaluation from Layer 2 experiments', () => {
    const portugalDef = convertNaturalExperimentData(PORTUGAL);
    const australiaDef = convertNaturalExperimentData(AUSTRALIA);

    const expectedOutcomes: OutcomeMetric[] = [
      { name: 'Drug-Induced Deaths', id: 'drug-induced-deaths', unit: 'per million', direction: 'lower' },
    ];

    const evaluation = evaluatePolicy({
      policy: 'Harm Reduction',
      description: 'Decriminalization + treatment approach',
      category: 'health',
      expectedOutcomes,
      naturalExperiments: [portugalDef, australiaDef],
    });

    expect(evaluation.policy).toBe('Harm Reduction');
    expect(evaluation.category).toBe('health');
    expect(evaluation.withinJurisdiction).toBeNull();
    expect(evaluation.crossJurisdiction).toBeNull();

    // Should have natural experiment results from both countries
    expect(evaluation.naturalExperiments.length).toBeGreaterThan(0);
    const jurisdictions = new Set(evaluation.naturalExperiments.map(r => r.jurisdiction));
    expect(jurisdictions.has('Portugal')).toBe(true);
    expect(jurisdictions.has('Australia')).toBe(true);

    // Aggregate should be populated
    expect(evaluation.aggregate.evidenceSources).toBeGreaterThan(0);
    expect(evaluation.aggregate.jurisdictionCount).toBe(2);
    expect(evaluation.aggregate.evidenceGrade).toBeDefined();
    expect(['A', 'B', 'C', 'D', 'F']).toContain(evaluation.aggregate.evidenceGrade);
    expect(evaluation.aggregate.confidence).toBeGreaterThan(0);
    expect(evaluation.aggregate.verdict.length).toBeGreaterThan(0);
  });

  it('works with no experiments (empty evaluation)', () => {
    const evaluation = evaluatePolicy({
      policy: 'Empty Policy',
      description: 'No data',
      category: 'test',
      expectedOutcomes: [],
    });

    expect(evaluation.naturalExperiments).toEqual([]);
    expect(evaluation.aggregate.evidenceSources).toBe(0);
    expect(evaluation.aggregate.weightedEffectSize).toBe(0);
  });

  it('includes Layer 3 panel as an evidence source', () => {
    const portugalDef = convertNaturalExperimentData(PORTUGAL);
    const expectedOutcomes: OutcomeMetric[] = [
      { name: 'Drug-Induced Deaths', id: 'drug-induced-deaths', unit: 'per million', direction: 'lower' },
    ];

    const panel = buildPanelAnalysis({
      jurisdictionCount: 15,
      jurisdictions: ['USA', 'GBR', 'DEU', 'FRA', 'CAN'],
      spendingCategory: 'Drug Enforcement',
      averageCorrelation: -0.45,
    });

    const evaluation = evaluatePolicy({
      policy: 'Drug Enforcement Spending',
      description: 'Cross-jurisdiction drug enforcement analysis',
      category: 'justice',
      expectedOutcomes,
      naturalExperiments: [portugalDef],
      crossJurisdiction: panel,
    });

    // Panel adds 1 evidence source beyond natural experiment results
    const naturalCount = evaluation.naturalExperiments.length;
    expect(evaluation.aggregate.evidenceSources).toBe(naturalCount + 1);

    // Panel jurisdictions should be counted
    expect(evaluation.aggregate.jurisdictionCount).toBeGreaterThanOrEqual(5);

    // Should still produce a valid grade
    expect(['A', 'B', 'C', 'D', 'F']).toContain(evaluation.aggregate.evidenceGrade);
  });
});

// ---------------------------------------------------------------------------
// buildPanelAnalysis
// ---------------------------------------------------------------------------

describe('buildPanelAnalysis', () => {
  it('maps all fields correctly', () => {
    const panel = buildPanelAnalysis({
      jurisdictionCount: 20,
      jurisdictions: ['USA', 'GBR', 'DEU'],
      spendingCategory: 'Healthcare',
      averageCorrelation: 0.65,
      referenceOverspendRatio: 1.8,
      efficientFrontierRank: 3,
    });

    expect(panel.jurisdictionCount).toBe(20);
    expect(panel.jurisdictions).toEqual(['USA', 'GBR', 'DEU']);
    expect(panel.spendingCategory).toBe('Healthcare');
    expect(panel.averageCorrelation).toBe(0.65);
    expect(panel.referenceOverspendRatio).toBe(1.8);
    expect(panel.efficientFrontierRank).toBe(3);
  });

  it('works without optional fields', () => {
    const panel = buildPanelAnalysis({
      jurisdictionCount: 5,
      jurisdictions: ['FRA'],
      spendingCategory: 'Education',
      averageCorrelation: 0.3,
    });

    expect(panel.referenceOverspendRatio).toBeUndefined();
    expect(panel.efficientFrontierRank).toBeUndefined();
    expect(panel.jurisdictionCount).toBe(5);
  });
});
