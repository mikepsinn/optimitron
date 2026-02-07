import { describe, it, expect } from 'vitest';
import {
  analyzeJurisdiction,
  aggregateJurisdictionResults,
  runCountryAnalysis,
  type AnnualTimeSeries,
  type CountryAnalysisInput,
} from '../country-analysis.js';
import { generateCountryAnalysisReport } from '../country-report.js';

// ─── Test data: synthetic countries with known relationships ─────────

function makeSeries(
  id: string,
  name: string,
  varId: string,
  varName: string,
  unit: string,
  data: [number, number][], // [year, value][]
): AnnualTimeSeries {
  const annualValues = new Map<number, number>();
  for (const [year, value] of data) {
    annualValues.set(year, value);
  }
  return { jurisdictionId: id, jurisdictionName: name, variableId: varId, variableName: varName, unit, annualValues };
}

// Country A: strong positive relationship (spending goes up → life expectancy goes up)
const countryA_spending = makeSeries('AAA', 'Alphaland', 'health_spend', 'Health Spending', 'USD/capita', [
  [2000, 1000], [2001, 1100], [2002, 1200], [2003, 1300], [2004, 1400],
  [2005, 1500], [2006, 1600], [2007, 1700], [2008, 1800], [2009, 1900],
  [2010, 2000], [2011, 2100], [2012, 2200], [2013, 2300], [2014, 2400],
]);
const countryA_le = makeSeries('AAA', 'Alphaland', 'life_exp', 'Life Expectancy', 'years', [
  [2000, 70.0], [2001, 70.5], [2002, 71.0], [2003, 71.5], [2004, 72.0],
  [2005, 72.5], [2006, 73.0], [2007, 73.5], [2008, 74.0], [2009, 74.5],
  [2010, 75.0], [2011, 75.5], [2012, 76.0], [2013, 76.5], [2014, 77.0],
]);

// Country B: weak relationship (spending goes up, life expectancy flat)
const countryB_spending = makeSeries('BBB', 'Betaland', 'health_spend', 'Health Spending', 'USD/capita', [
  [2000, 5000], [2001, 5500], [2002, 6000], [2003, 6500], [2004, 7000],
  [2005, 7500], [2006, 8000], [2007, 8500], [2008, 9000], [2009, 9500],
  [2010, 10000], [2011, 10500], [2012, 11000], [2013, 11500], [2014, 12000],
]);
const countryB_le = makeSeries('BBB', 'Betaland', 'life_exp', 'Life Expectancy', 'years', [
  [2000, 78.0], [2001, 78.1], [2002, 78.0], [2003, 78.2], [2004, 78.1],
  [2005, 78.3], [2006, 78.2], [2007, 78.1], [2008, 78.3], [2009, 78.2],
  [2010, 78.4], [2011, 78.3], [2012, 78.2], [2013, 78.4], [2014, 78.3],
]);

// Country C: insufficient data
const countryC_spending = makeSeries('CCC', 'Gammaland', 'health_spend', 'Health Spending', 'USD/capita', [
  [2010, 500], [2011, 600],
]);
const countryC_le = makeSeries('CCC', 'Gammaland', 'life_exp', 'Life Expectancy', 'years', [
  [2010, 60.0], [2011, 61.0],
]);

// ─── Tests ───────────────────────────────────────────────────────────

describe('analyzeJurisdiction', () => {
  it('analyzes a country with strong positive relationship', () => {
    const result = analyzeJurisdiction(countryA_spending, countryA_le);

    expect(result).not.toBeNull();
    expect(result!.jurisdictionId).toBe('AAA');
    expect(result!.jurisdictionName).toBe('Alphaland');
    expect(result!.analysis.forwardPearson).toBeGreaterThan(0.5);
    expect(result!.analysis.numberOfPairs).toBeGreaterThanOrEqual(5);
  });

  it('detects weak relationship for diminishing returns country', () => {
    const result = analyzeJurisdiction(countryB_spending, countryB_le);

    expect(result).not.toBeNull();
    // Betaland: spending doubles but life expectancy barely moves
    expect(result!.analysis.forwardPearson).toBeLessThan(
      analyzeJurisdiction(countryA_spending, countryA_le)!.analysis.forwardPearson
    );
  });

  it('returns null for insufficient data', () => {
    const result = analyzeJurisdiction(countryC_spending, countryC_le);
    expect(result).toBeNull();
  });

  it('generates a markdown report for each jurisdiction', () => {
    const result = analyzeJurisdiction(countryA_spending, countryA_le);
    expect(result).not.toBeNull();
    expect(result!.report).toContain('Health Spending');
    expect(result!.report).toContain('Life Expectancy');
    expect(result!.report).toContain('## Summary');
    expect(result!.report).toContain('## Key Findings');
  });

  it('uses custom onset delay and duration of action', () => {
    const result = analyzeJurisdiction(countryA_spending, countryA_le, {
      onsetDelayDays: 730,       // 2 years
      durationOfActionDays: 1825, // 5 years
      fillingType: 'interpolation',
      minimumDataPoints: 5,
      plausibilityScore: 0.5,
      coherenceScore: 0.5,
      analogyScore: 0.5,
      specificityScore: 0.5,
    });

    expect(result).not.toBeNull();
    expect(result!.analysis.onsetDelay).toBe(730 * 24 * 3600);
    expect(result!.analysis.durationOfAction).toBe(1825 * 24 * 3600);
  });
});

describe('aggregateJurisdictionResults', () => {
  it('aggregates results from multiple jurisdictions', () => {
    const resultA = analyzeJurisdiction(countryA_spending, countryA_le)!;
    const resultB = analyzeJurisdiction(countryB_spending, countryB_le)!;

    const agg = aggregateJurisdictionResults([resultA, resultB]);

    expect(agg.n).toBe(2);
    expect(agg.positiveCount).toBeGreaterThanOrEqual(1);
    expect(agg.meanForwardPearson).toBeDefined();
    expect(agg.medianForwardPearson).toBeDefined();
    expect(agg.meanEffectSize).toBeDefined();
    expect(agg.meanBradfordHill.strength).toBeDefined();
    expect(agg.meanBradfordHill.temporality).toBeDefined();
  });

  it('handles empty results array', () => {
    const agg = aggregateJurisdictionResults([]);
    expect(agg.n).toBe(0);
    expect(agg.meanForwardPearson).toBe(0);
  });
});

describe('runCountryAnalysis', () => {
  it('runs full pipeline across multiple jurisdictions', () => {
    const input: CountryAnalysisInput = {
      predictors: [countryA_spending, countryB_spending, countryC_spending],
      outcomes: [countryA_le, countryB_le, countryC_le],
    };

    const result = runCountryAnalysis(input);

    expect(result.jurisdictions.length).toBe(2); // C skipped (insufficient data)
    expect(result.aggregate.n).toBe(2);
    expect(result.aggregate.skipped).toBe(1);
    expect(result.predictorName).toBe('Health Spending');
    expect(result.outcomeName).toBe('Life Expectancy');
    expect(result.analyzedAt).toBeDefined();
  });

  it('handles jurisdictions with only predictor (no outcome)', () => {
    const input: CountryAnalysisInput = {
      predictors: [countryA_spending, countryB_spending],
      outcomes: [countryA_le], // Only A has outcome
    };

    const result = runCountryAnalysis(input);
    expect(result.jurisdictions.length).toBe(1); // Only A
    expect(result.aggregate.skipped).toBe(1); // B skipped
  });

  it('accepts config overrides', () => {
    const input: CountryAnalysisInput = {
      predictors: [countryA_spending],
      outcomes: [countryA_le],
      config: {
        onsetDelayDays: 180,
        durationOfActionDays: 365,
      },
    };

    const result = runCountryAnalysis(input);
    expect(result.config.onsetDelayDays).toBe(180);
    expect(result.config.durationOfActionDays).toBe(365);
  });
});

describe('generateCountryAnalysisReport', () => {
  it('generates a complete markdown report', () => {
    const input: CountryAnalysisInput = {
      predictors: [countryA_spending, countryB_spending],
      outcomes: [countryA_le, countryB_le],
    };

    const result = runCountryAnalysis(input);
    const report = generateCountryAnalysisReport(result);

    expect(report).toContain('# Health Spending → Life Expectancy');
    expect(report).toContain('## Methodology');
    expect(report).toContain('N-of-1');
    expect(report).toContain('## Executive Summary');
    expect(report).toContain('## Aggregated Bradford Hill Criteria');
    expect(report).toContain('## Individual Jurisdiction Results');
    expect(report).toContain('Alphaland');
    expect(report).toContain('Betaland');
    expect(report).toContain('## Analysis Parameters');
    expect(report).toContain('## Limitations');
  });

  it('highlights a specific jurisdiction when requested', () => {
    const input: CountryAnalysisInput = {
      predictors: [countryA_spending, countryB_spending],
      outcomes: [countryA_le, countryB_le],
    };

    const result = runCountryAnalysis(input);
    const report = generateCountryAnalysisReport(result, {
      highlightJurisdiction: 'AAA',
    });

    expect(report).toContain('### Alphaland Deep Dive');
    expect(report).toContain('Correlation');
    expect(report).toContain('Causal Direction Score');
  });
});
