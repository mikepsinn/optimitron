/**
 * Three-Layer Policy Evaluation — End-to-end Integration Test
 *
 * Wires all 3 evidence layers:
 *   Layer 1: (skipped — no within-jurisdiction time series in this test)
 *   Layer 2: Natural experiments via convertNaturalExperimentData()
 *   Layer 3: Cross-jurisdiction panel via runCountryAnalysis() → buildPanelAnalysis()
 *
 * Verifies the final PolicyEvaluation aggregates evidence from all populated layers.
 */

import { describe, it, expect } from 'vitest';
import { NATURAL_EXPERIMENTS } from '@optimitron/data';
import {
  runCountryAnalysis,
  type AnnualTimeSeries,
} from '@optimitron/obg';
import {
  convertNaturalExperimentData,
  evaluatePolicy,
  buildPanelAnalysis,
  type OutcomeMetric,
} from '@optimitron/opg';

// ─── Helpers ─────────────────────────────────────────────────────────

/** Simple seeded PRNG for reproducible noise */
function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

const rng = seededRng(42);

/** Generate synthetic annual time series for a jurisdiction */
function syntheticSeries(
  jurisdictionId: string,
  jurisdictionName: string,
  variableId: string,
  variableName: string,
  unit: string,
  startYear: number,
  endYear: number,
  baseFn: (year: number) => number,
): AnnualTimeSeries {
  const annualValues = new Map<number, number>();
  for (let y = startYear; y <= endYear; y++) {
    annualValues.set(y, baseFn(y));
  }
  return { jurisdictionId, jurisdictionName, variableId, variableName, unit, annualValues };
}

// ─── Test data ───────────────────────────────────────────────────────

const PORTUGAL = NATURAL_EXPERIMENTS.find(e => e.jurisdictionCode === 'PRT')!;

const expectedOutcomes: OutcomeMetric[] = [
  { name: 'Drug-Induced Deaths', id: 'drug-induced-deaths', unit: 'per million', direction: 'lower' },
];

// Synthetic cross-jurisdiction data: 5 countries with spending vs death rate
const COUNTRIES = [
  { id: 'USA', name: 'United States', spendBase: 400, deathBase: 25 },
  { id: 'GBR', name: 'United Kingdom', spendBase: 200, deathBase: 12 },
  { id: 'DEU', name: 'Germany', spendBase: 150, deathBase: 8 },
  { id: 'FRA', name: 'France', spendBase: 180, deathBase: 10 },
  { id: 'CAN', name: 'Canada', spendBase: 250, deathBase: 15 },
];

// Add realistic noise to prevent near-perfect correlations
const predictors: AnnualTimeSeries[] = COUNTRIES.map(c =>
  syntheticSeries(
    c.id, c.name,
    'drug-enforcement-spending', 'Drug Enforcement Spending', 'USD per capita PPP',
    2000, 2019,
    year => c.spendBase + (year - 2000) * 5 + (rng() - 0.5) * 40,
  ),
);

const outcomes: AnnualTimeSeries[] = COUNTRIES.map(c =>
  syntheticSeries(
    c.id, c.name,
    'drug-deaths', 'Drug-Induced Deaths', 'per million',
    2000, 2019,
    year => c.deathBase + (year - 2000) * 0.3 + (rng() - 0.5) * 3,
  ),
);

// ─── Tests ───────────────────────────────────────────────────────────

describe('Three-Layer Policy Evaluation — End-to-End', () => {
  // Layer 3: Run OBG country analysis and build panel
  const countryResult = runCountryAnalysis({ predictors, outcomes });

  const panel = buildPanelAnalysis({
    jurisdictionCount: countryResult.aggregate.n,
    jurisdictions: countryResult.jurisdictions.map(j => j.jurisdictionId),
    spendingCategory: 'Drug Enforcement',
    averageCorrelation: countryResult.aggregate.meanForwardPearson,
  });

  // Layer 2: Convert natural experiment data
  const portugalDef = convertNaturalExperimentData(PORTUGAL);

  // Full evaluation
  const evaluation = evaluatePolicy({
    policy: 'Drug Enforcement Spending',
    description: 'Evaluates whether increased drug enforcement spending reduces drug deaths',
    category: 'justice',
    expectedOutcomes,
    naturalExperiments: [portugalDef],
    crossJurisdiction: panel,
  });

  it('should populate Layer 2 natural experiments', () => {
    expect(evaluation.naturalExperiments.length).toBeGreaterThan(0);
    const jurisdictions = new Set(evaluation.naturalExperiments.map(r => r.jurisdiction));
    expect(jurisdictions.has('Portugal')).toBe(true);
  });

  it('should populate Layer 3 cross-jurisdiction panel', () => {
    expect(evaluation.crossJurisdiction).not.toBeNull();
    expect(evaluation.crossJurisdiction!.jurisdictionCount).toBe(5);
    expect(evaluation.crossJurisdiction!.spendingCategory).toBe('Drug Enforcement');
    expect(evaluation.crossJurisdiction!.jurisdictions).toHaveLength(5);
  });

  it('should aggregate evidence from both layers', () => {
    // Layer 2 results + 1 from Layer 3 panel
    const naturalCount = evaluation.naturalExperiments.length;
    expect(evaluation.aggregate.evidenceSources).toBe(naturalCount + 1);
  });

  it('should count jurisdictions from all layers', () => {
    // Portugal (Layer 2) + 5 synthetic countries (Layer 3)
    expect(evaluation.aggregate.jurisdictionCount).toBeGreaterThanOrEqual(6);
  });

  it('should produce a valid evidence grade', () => {
    expect(['A', 'B', 'C', 'D', 'F']).toContain(evaluation.aggregate.evidenceGrade);
  });

  it('should have non-zero weighted effect size', () => {
    expect(evaluation.aggregate.weightedEffectSize).not.toBe(0);
  });

  it('should have a verdict string', () => {
    expect(evaluation.aggregate.verdict.length).toBeGreaterThan(0);
  });

  it('should pass structural integrity: all fields populated', () => {
    expect(evaluation.policy).toBe('Drug Enforcement Spending');
    expect(evaluation.category).toBe('justice');
    expect(evaluation.expectedOutcomes).toHaveLength(1);
    expect(evaluation.withinJurisdiction).toBeNull(); // Layer 1 not used in this test
    expect(evaluation.naturalExperiments.length).toBeGreaterThan(0);
    expect(evaluation.crossJurisdiction).not.toBeNull();
    expect(evaluation.aggregate.confidence).toBeGreaterThan(0);
  });
});
