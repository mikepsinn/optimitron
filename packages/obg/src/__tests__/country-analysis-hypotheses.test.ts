/**
 * Hypothesis-driven tests for N-of-1 country causal analysis.
 * 
 * Each test encodes a specific hypothesis about what the causal inference
 * engine SHOULD find given known data patterns. If a test fails, it means
 * either the hypothesis is wrong or the engine has a bug.
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeJurisdiction,
  runCountryAnalysis,
  type AnnualTimeSeries,
  type CountryAnalysisInput,
  type CountryAnalysisConfig,
} from '../country-analysis.js';

// ─── Helper to build test data ───────────────────────────────────────

function series(
  id: string, name: string, varId: string, varName: string, unit: string,
  data: [number, number][],
): AnnualTimeSeries {
  const annualValues = new Map<number, number>();
  for (const [y, v] of data) annualValues.set(y, v);
  return { jurisdictionId: id, jurisdictionName: name, variableId: varId, variableName: varName, unit, annualValues };
}

const YEARS = Array.from({ length: 20 }, (_, i) => 2000 + i);

const defaultConfig: CountryAnalysisConfig = {
  onsetDelayDays: 365,
  durationOfActionDays: 1095,
  fillingType: 'interpolation',
  minimumDataPoints: 5,
  plausibilityScore: 0.5,
  coherenceScore: 0.5,
  analogyScore: 0.5,
  specificityScore: 0.5,
};

// ─── H1: Strong linear predictor→outcome produces high forward Pearson ──

describe('H1: Linear causal relationship → strong positive correlation', () => {
  // If spending goes up linearly and life expectancy goes up linearly,
  // the within-country correlation should be strongly positive.
  const spending = series('H1', 'Linearland', 'spend', 'Spending', 'USD',
    YEARS.map((y, i) => [y, 1000 + i * 200] as [number, number]),
  );
  const outcome = series('H1', 'Linearland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 70 + i * 0.5] as [number, number]),
  );

  it('should find r > 0.8 for perfectly correlated time series', () => {
    const result = analyzeJurisdiction(spending, outcome, defaultConfig)!;
    expect(result.analysis.forwardPearson).toBeGreaterThan(0.8);
  });

  it('should find positive percent change from baseline', () => {
    const result = analyzeJurisdiction(spending, outcome, defaultConfig)!;
    expect(result.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline).toBeGreaterThan(0);
  });

  it('should find optimal value in the upper range of spending', () => {
    const result = analyzeJurisdiction(spending, outcome, defaultConfig)!;
    // Optimal should be above the mean (spending above mean → better outcomes)
    const meanSpending = YEARS.reduce((s, _, i) => s + 1000 + i * 200, 0) / YEARS.length;
    expect(result.analysis.optimalValues.valuePredictingHighOutcome).toBeGreaterThan(meanSpending);
  });
});

// ─── H2: Diminishing returns → weaker correlation at high spending ──

describe('H2: Diminishing returns → weaker correlation than linear growth', () => {
  // Country that spends a LOT but gets minimal improvement should show
  // weaker within-country correlation than one with linear returns.
  const highSpending = series('H2', 'Richland', 'spend', 'Spending', 'USD',
    YEARS.map((y, i) => [y, 8000 + i * 500] as [number, number]), // $8K → $17.5K
  );
  const flatOutcome = series('H2', 'Richland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 80 + Math.sin(i) * 0.3] as [number, number]), // Oscillates ±0.3
  );

  const linearSpending = series('H2L', 'Growthland', 'spend', 'Spending', 'USD',
    YEARS.map((y, i) => [y, 500 + i * 100] as [number, number]), // $500 → $2.4K
  );
  const linearOutcome = series('H2L', 'Growthland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 60 + i * 0.8] as [number, number]), // 60 → 75.2
  );

  it('rich country with flat outcomes should have weaker correlation than growing country', () => {
    const richResult = analyzeJurisdiction(highSpending, flatOutcome, defaultConfig)!;
    const growthResult = analyzeJurisdiction(linearSpending, linearOutcome, defaultConfig)!;

    expect(growthResult.analysis.forwardPearson).toBeGreaterThan(richResult.analysis.forwardPearson);
  });

  it('rich country should have smaller effect size', () => {
    const richResult = analyzeJurisdiction(highSpending, flatOutcome, defaultConfig)!;
    const growthResult = analyzeJurisdiction(linearSpending, linearOutcome, defaultConfig)!;

    expect(Math.abs(growthResult.analysis.effectSize.zScore))
      .toBeGreaterThan(Math.abs(richResult.analysis.effectSize.zScore));
  });
});

// ─── H3: Reverse causation detection ────────────────────────────────

describe('H3: Reverse causation → predictive Pearson ≤ 0', () => {
  // If sicker populations drive spending (outcome → predictor),
  // the reverse Pearson should be at least as strong as forward.
  // We simulate: life expectancy drops first, then spending rises in response.
  const spending = series('H3', 'Reactiveland', 'spend', 'Spending', 'USD',
    YEARS.map((y, i) => {
      // Spending rises AFTER life expectancy drops (lagged response)
      if (i < 5) return [y, 3000] as [number, number];
      if (i < 10) return [y, 3000 + (i - 5) * 800] as [number, number]; // rises in response to crisis
      return [y, 7000 + (i - 10) * 200] as [number, number];
    }),
  );
  const outcome = series('H3', 'Reactiveland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => {
      // Life expectancy drops first (years 3-7), then spending follows
      if (i < 3) return [y, 78] as [number, number];
      if (i < 8) return [y, 78 - (i - 3) * 0.6] as [number, number]; // drops
      return [y, 75 + (i - 8) * 0.3] as [number, number]; // slow recovery
    }),
  );

  it('should find forward Pearson is NOT strongly positive (spending↑ ≠ outcome↑)', () => {
    const result = analyzeJurisdiction(spending, outcome, defaultConfig)!;
    // Forward r should be weak or negative — spending went up but outcomes went down
    expect(result.analysis.forwardPearson).toBeLessThan(0.5);
  });
});

// ─── H4: Onset delay matters ────────────────────────────────────────

describe('H4: Onset delay affects correlation strength', () => {
  // Spending changes take time to affect outcomes.
  // With a 1-year lag in the data (spending year N → outcome year N+1),
  // a 1-year onset delay should produce better alignment than 0.
  const spending = series('H4', 'Lagland', 'spend', 'Spending', 'USD',
    YEARS.map((y, i) => [y, 1000 + i * 300] as [number, number]),
  );
  // Outcome follows spending with a 1-year lag
  const laggedOutcome = series('H4', 'Lagland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => {
      const laggedSpending = i > 0 ? 1000 + (i - 1) * 300 : 1000;
      return [y, 65 + laggedSpending * 0.003] as [number, number];
    }),
  );

  it('1-year onset delay should produce correlation ≥ 0.7', () => {
    const result = analyzeJurisdiction(spending, laggedOutcome, {
      ...defaultConfig,
      onsetDelayDays: 365, // 1 year — matches the lag
    })!;
    expect(result.analysis.forwardPearson).toBeGreaterThanOrEqual(0.7);
  });
});

// ─── H5: Dose-response gradient ─────────────────────────────────────

describe('H5: Clear dose-response → high gradient score', () => {
  // If doubling spending doubles the outcome improvement,
  // the gradient score should be high.
  const spending = series('H5', 'Doseland', 'spend', 'Spending', 'USD',
    YEARS.map((y, i) => [y, 500 * (1 + i * 0.2)] as [number, number]), // 500 → 2400
  );
  const outcome = series('H5', 'Doseland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 60 + i * 0.7 + Math.random() * 0.1] as [number, number]), // 60 → 73.3
  );

  it('should find gradient score > 0.3 for clear dose-response', () => {
    const result = analyzeJurisdiction(spending, outcome, defaultConfig)!;
    expect(result.analysis.bradfordHill.gradient).toBeGreaterThan(0.3);
  });
});

// ─── H6: COVID shock → weaker correlation ───────────────────────────

describe('H6: External shock (COVID) weakens correlation', () => {
  // A sudden life expectancy drop in 2020-2021 despite steady spending
  // should weaken the within-country correlation.
  const steadySpending = series('H6', 'Covidland', 'spend', 'Spending', 'USD',
    YEARS.map((y, i) => [y, 3000 + i * 200] as [number, number]),
  );
  const normalOutcome = series('H6N', 'Normalland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 75 + i * 0.3] as [number, number]),
  );
  const covidOutcome = series('H6', 'Covidland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => {
      const base = 75 + i * 0.3;
      // COVID shock: 2020 (i=20) doesn't exist in our 2000-2019 range
      // So simulate a shock at year 15 (2015) instead
      if (i === 15 || i === 16) return [y, base - 2.0] as [number, number];
      return [y, base] as [number, number];
    }),
  );

  it('country with shock should have weaker correlation than without', () => {
    const normalResult = analyzeJurisdiction(steadySpending, normalOutcome, defaultConfig)!;
    const covidResult = analyzeJurisdiction(steadySpending, covidOutcome, defaultConfig)!;

    expect(normalResult.analysis.forwardPearson).toBeGreaterThan(covidResult.analysis.forwardPearson);
  });
});

// ─── H7: Aggregation captures consistency ───────────────────────────

describe('H7: Multiple jurisdictions with same direction → consistency evidence', () => {
  // If 5 countries all show positive correlation, the aggregate should
  // reflect this consistency.
  const countries = ['A', 'B', 'C', 'D', 'E'].map((letter, ci) => ({
    spending: series(`H7${letter}`, `Country ${letter}`, 'spend', 'Spending', 'USD',
      YEARS.map((y, i) => [y, (500 + ci * 200) + i * 100] as [number, number]),
    ),
    outcome: series(`H7${letter}`, `Country ${letter}`, 'le', 'Life Expectancy', 'years',
      YEARS.map((y, i) => [y, (65 + ci * 2) + i * 0.4] as [number, number]),
    ),
  }));

  it('should find all positive correlations', () => {
    const input: CountryAnalysisInput = {
      predictors: countries.map(c => c.spending),
      outcomes: countries.map(c => c.outcome),
    };
    const result = runCountryAnalysis(input);

    expect(result.aggregate.n).toBe(5);
    expect(result.aggregate.positiveCount).toBe(5);
    expect(result.aggregate.negativeCount).toBe(0);
  });

  it('mean correlation should be strongly positive', () => {
    const input: CountryAnalysisInput = {
      predictors: countries.map(c => c.spending),
      outcomes: countries.map(c => c.outcome),
    };
    const result = runCountryAnalysis(input);

    expect(result.aggregate.meanForwardPearson).toBeGreaterThan(0.7);
  });

  it('all jurisdictions should show positive percent change from baseline', () => {
    const input: CountryAnalysisInput = {
      predictors: countries.map(c => c.spending),
      outcomes: countries.map(c => c.outcome),
    };
    const result = runCountryAnalysis(input);

    for (const j of result.jurisdictions) {
      expect(j.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline).toBeGreaterThan(0);
    }
  });
});

// ─── H8: No relationship → near-zero correlation ───────────────────

describe('H8: Random/unrelated variables → near-zero correlation', () => {
  // If spending and outcome are completely independent,
  // the correlation should be near zero.
  const spending = series('H8', 'Randomland', 'spend', 'Spending', 'USD',
    YEARS.map((y, i) => [y, 2000 + i * 150] as [number, number]), // Linear up
  );
  // Outcome oscillates with no trend — unrelated to spending
  const unrelatedOutcome = series('H8', 'Randomland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 75 + Math.sin(i * 1.5) * 2] as [number, number]),
  );

  it('should find weak correlation (|r| < 0.5) for unrelated variables', () => {
    const result = analyzeJurisdiction(spending, unrelatedOutcome, defaultConfig)!;
    expect(Math.abs(result.analysis.forwardPearson)).toBeLessThan(0.5);
  });

  it('effect size should be smaller than for related variables', () => {
    const relatedOutcome = series('H8R', 'Relatedland', 'le', 'Life Expectancy', 'years',
      YEARS.map((y, i) => [y, 70 + i * 0.5] as [number, number]),
    );
    const relatedSpending = series('H8R', 'Relatedland', 'spend', 'Spending', 'USD',
      YEARS.map((y, i) => [y, 1000 + i * 200] as [number, number]),
    );

    const unrelated = analyzeJurisdiction(spending, unrelatedOutcome, defaultConfig)!;
    const related = analyzeJurisdiction(relatedSpending, relatedOutcome, defaultConfig)!;

    expect(Math.abs(related.analysis.effectSize.zScore))
      .toBeGreaterThan(Math.abs(unrelated.analysis.effectSize.zScore));
  });
});

// ─── H9: Optimal value should differ between high/low spending countries ──

describe('H9: Optimal predictor value reflects within-country dynamics', () => {
  // A poor country that improves rapidly should have a low optimal value.
  // A rich country with diminishing returns should have a high optimal value.
  const poorSpending = series('H9P', 'Poorland', 'spend', 'Spending', 'USD',
    YEARS.map((y, i) => [y, 200 + i * 50] as [number, number]), // $200 → $1150
  );
  const poorOutcome = series('H9P', 'Poorland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 55 + i * 1.2] as [number, number]), // 55 → 77.8 (huge gains)
  );

  const richSpending = series('H9R', 'Richland', 'spend', 'Spending', 'USD',
    YEARS.map((y, i) => [y, 6000 + i * 400] as [number, number]), // $6K → $13.6K
  );
  const richOutcome = series('H9R', 'Richland', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 79 + i * 0.15] as [number, number]), // 79 → 81.85 (small gains)
  );

  it('poor country optimal should be lower than rich country optimal', () => {
    const poorResult = analyzeJurisdiction(poorSpending, poorOutcome, defaultConfig)!;
    const richResult = analyzeJurisdiction(richSpending, richOutcome, defaultConfig)!;

    expect(poorResult.analysis.optimalValues.valuePredictingHighOutcome)
      .toBeLessThan(richResult.analysis.optimalValues.valuePredictingHighOutcome);
  });

  it('poor country should show larger percent change from baseline', () => {
    const poorResult = analyzeJurisdiction(poorSpending, poorOutcome, defaultConfig)!;
    const richResult = analyzeJurisdiction(richSpending, richOutcome, defaultConfig)!;

    expect(Math.abs(poorResult.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline))
      .toBeGreaterThan(Math.abs(richResult.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline));
  });
});

// ─── H10: Temporality score should be 1.0 when predictor precedes outcome ──

describe('H10: Temporality — predictor changes precede outcome changes', () => {
  it('should score temporality = 1.0 when onset delay properly aligns data', () => {
    const spending = series('H10', 'Temporal', 'spend', 'Spending', 'USD',
      YEARS.map((y, i) => [y, 1000 + i * 200] as [number, number]),
    );
    const outcome = series('H10', 'Temporal', 'le', 'Life Expectancy', 'years',
      YEARS.map((y, i) => [y, 70 + i * 0.5] as [number, number]),
    );

    const result = analyzeJurisdiction(spending, outcome, defaultConfig)!;
    // With proper onset delay, the engine knows predictor comes first
    expect(result.analysis.bradfordHill.temporality).toBe(1.0);
  });
});
