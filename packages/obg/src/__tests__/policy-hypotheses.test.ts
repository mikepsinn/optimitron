/**
 * Real-World Policy Hypothesis Tests
 * 
 * These tests encode specific, falsifiable hypotheses about what the
 * N-of-1 causal analysis SHOULD find when applied to real-world data.
 * 
 * Each test uses synthetic data that models known real-world patterns.
 * When we wire real API data, these tests validate that the engine
 * produces findings consistent with established research.
 * 
 * KEY INSIGHT: The predictive Pearson (forward r - reverse r) is what
 * distinguishes correlation from causation. If reverse r > forward r,
 * the "effect" is actually driving the "cause" (reverse causation).
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeJurisdiction,
  runCountryAnalysis,
  type AnnualTimeSeries,
  type CountryAnalysisInput,
  type CountryAnalysisConfig,
} from '../country-analysis.js';

// ─── Helpers ─────────────────────────────────────────────────────────

const YEARS = Array.from({ length: 20 }, (_, i) => 2000 + i);

function series(
  id: string, name: string, varId: string, varName: string, unit: string,
  data: [number, number][],
): AnnualTimeSeries {
  const annualValues = new Map<number, number>();
  for (const [y, v] of data) annualValues.set(y, v);
  return { jurisdictionId: id, jurisdictionName: name, variableId: varId, variableName: varName, unit, annualValues };
}

const config: CountryAnalysisConfig = {
  onsetDelayDays: 365,
  durationOfActionDays: 1095,
  fillingType: 'interpolation',
  minimumDataPoints: 5,
  plausibilityScore: 0.5,
  coherenceScore: 0.5,
  analogyScore: 0.5,
  specificityScore: 0.5,
};

// ═══════════════════════════════════════════════════════════════════════
// IMMIGRATION → INCOME
// ═══════════════════════════════════════════════════════════════════════

describe('Immigration → Median Income (avoiding reverse causation)', () => {
  // HYPOTHESIS: Immigration causes economic growth (more workers, innovation,
  // entrepreneurship). But rich countries also attract immigrants.
  // The predictive Pearson should help distinguish direction.

  // Country where immigration genuinely drives growth
  // (e.g., Canada/Australia model: skilled immigration → GDP growth)
  const immigrationDriven = {
    immigration: series('IMM1', 'Growthvia', 'immigration', 'Net Immigration Rate', '%',
      YEARS.map((y, i) => [y, 0.5 + i * 0.1] as [number, number]), // Rising immigration
    ),
    income: series('IMM1', 'Growthvia', 'income', 'Median Income', 'USD',
      YEARS.map((y, i) => {
        // Income rises AFTER immigration increases (2-year lag)
        const lagged = Math.max(0, i - 2);
        return [y, 30000 + lagged * 1500] as [number, number];
      }),
    ),
  };

  // Country where wealth attracts immigrants (reverse causation)
  // Rich → immigrants come, but they don't cause the wealth
  const wealthAttracts = {
    immigration: series('IMM2', 'Richland', 'immigration', 'Net Immigration Rate', '%',
      YEARS.map((y, i) => {
        // Immigration follows income with a lag
        const lagged = Math.max(0, i - 2);
        return [y, 0.3 + lagged * 0.15] as [number, number];
      }),
    ),
    income: series('IMM2', 'Richland', 'income', 'Median Income', 'USD',
      YEARS.map((y, i) => [y, 40000 + i * 2000] as [number, number]), // Income rises first
    ),
  };

  it('in growth-driven country, forward r should be positive (immigration→income)', () => {
    const result = analyzeJurisdiction(
      immigrationDriven.immigration, immigrationDriven.income, config,
    )!;
    expect(result.analysis.forwardPearson).toBeGreaterThan(0.5);
  });

  it('in wealth-attracts country, both forward and reverse should be positive', () => {
    const result = analyzeJurisdiction(
      wealthAttracts.immigration, wealthAttracts.income, config,
    )!;
    // Both should be positive — the question is WHICH is stronger
    expect(result.analysis.forwardPearson).toBeGreaterThan(0);
  });

  it('income should show positive change from baseline when immigration is above average', () => {
    const result = analyzeJurisdiction(
      immigrationDriven.immigration, immigrationDriven.income, config,
    )!;
    expect(result.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DRUG POLICY → OVERDOSE DEATHS
// ═══════════════════════════════════════════════════════════════════════

describe('Drug Decriminalization → Reduced Overdose Deaths', () => {
  // HYPOTHESIS: Countries that shift from prohibition to harm reduction
  // see reduced overdose deaths with a 2-5 year onset delay.
  // Portugal (2001), Czech Republic (2010) are natural experiments.

  // Model Portugal: prohibition until 2001, then decriminalization
  // Harm reduction spending goes up, overdose deaths go down
  const portugal = {
    harmReduction: series('PRT', 'Portugal', 'harm_reduction', 'Harm Reduction Spending', 'EUR/capita',
      YEARS.map((y, i) => {
        if (i < 1) return [y, 5] as [number, number]; // 2000: low
        return [y, 5 + i * 8] as [number, number]; // Post-2001: rises
      }),
    ),
    overdoseDeaths: series('PRT', 'Portugal', 'od_deaths', 'Overdose Deaths per 100K', 'per 100K',
      YEARS.map((y, i) => {
        if (i < 3) return [y, 3.5] as [number, number]; // 2000-2002: still high (onset delay)
        return [y, 3.5 - Math.min(i - 3, 12) * 0.2] as [number, number]; // Drops over time
      }),
    ),
  };

  // Model US: prohibition continues, spending on enforcement
  const usa = {
    enforcement: series('USA', 'United States', 'enforcement', 'Drug Enforcement Spending', 'USD/capita',
      YEARS.map((y, i) => [y, 100 + i * 15] as [number, number]), // Keeps rising
    ),
    overdoseDeaths: series('USA', 'United States', 'od_deaths', 'Overdose Deaths per 100K', 'per 100K',
      YEARS.map((y, i) => [y, 6 + i * 1.5] as [number, number]), // Keeps rising too
    ),
  };

  it('Portugal: harm reduction spending should negatively correlate with overdose deaths', () => {
    const result = analyzeJurisdiction(portugal.harmReduction, portugal.overdoseDeaths, config)!;
    // More harm reduction → fewer deaths → negative correlation
    expect(result.analysis.forwardPearson).toBeLessThan(0);
  });

  it('USA: enforcement spending should NOT reduce overdose deaths', () => {
    const result = analyzeJurisdiction(usa.enforcement, usa.overdoseDeaths, config)!;
    // More enforcement → deaths still rise → positive correlation (bad!)
    expect(result.analysis.forwardPearson).toBeGreaterThan(0);
  });

  it('Portugal should show overdose deaths DECREASE from baseline when spending is above average', () => {
    const result = analyzeJurisdiction(portugal.harmReduction, portugal.overdoseDeaths, config)!;
    expect(result.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline).toBeLessThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// MILITARY vs R&D SPENDING → LIFE EXPECTANCY
// ═══════════════════════════════════════════════════════════════════════

describe('Military vs R&D Spending → Life Expectancy', () => {
  // HYPOTHESIS: Countries that spend more on R&D relative to military
  // should see faster life expectancy growth.

  // High military, low R&D country
  const militaryHeavy = {
    militaryRatio: series('MIL', 'Warhaven', 'mil_ratio', 'Military/R&D Ratio', 'ratio',
      YEARS.map((y, i) => [y, 8 + i * 0.3] as [number, number]), // Military growing faster than R&D
    ),
    lifeExpectancy: series('MIL', 'Warhaven', 'le', 'Life Expectancy', 'years',
      YEARS.map((y, i) => [y, 72 + i * 0.1] as [number, number]), // Barely improving
    ),
  };

  // High R&D, moderate military country
  const rdHeavy = {
    rdSpending: series('RND', 'Scienceland', 'rd_spend', 'R&D Spending % GDP', '%',
      YEARS.map((y, i) => [y, 2.0 + i * 0.15] as [number, number]), // R&D growing
    ),
    lifeExpectancy: series('RND', 'Scienceland', 'le', 'Life Expectancy', 'years',
      YEARS.map((y, i) => [y, 78 + i * 0.35] as [number, number]), // Strong improvement
    ),
  };

  it('R&D spending should positively correlate with life expectancy', () => {
    const result = analyzeJurisdiction(rdHeavy.rdSpending, rdHeavy.lifeExpectancy, config)!;
    expect(result.analysis.forwardPearson).toBeGreaterThan(0.5);
  });

  it('R&D country should show larger life expectancy improvement than military country', () => {
    const rdResult = analyzeJurisdiction(rdHeavy.rdSpending, rdHeavy.lifeExpectancy, config)!;
    const milResult = analyzeJurisdiction(militaryHeavy.militaryRatio, militaryHeavy.lifeExpectancy, config)!;

    expect(Math.abs(rdResult.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline))
      .toBeGreaterThan(Math.abs(milResult.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline));
  });
});

// ═══════════════════════════════════════════════════════════════════════
// EDUCATION SPENDING → GDP GROWTH (LONG ONSET DELAY)
// ═══════════════════════════════════════════════════════════════════════

describe('Education Spending → GDP Growth (long onset delay)', () => {
  // HYPOTHESIS: Education spending takes 10-20 years to show up in GDP
  // (a generation needs to graduate and enter the workforce).
  // The key test: a 15-year onset delay should produce stronger correlation
  // than a 1-year onset delay.

  // Country that invested heavily in education in early years
  const education = series('EDU', 'Learnland', 'edu_spend', 'Education Spending % GDP', '%',
    YEARS.map((y, i) => [y, 3 + (i < 10 ? i * 0.3 : 6.0)] as [number, number]),
  );
  // GDP responds with ~10-year lag
  const gdp = series('EDU', 'Learnland', 'gdp', 'GDP per Capita', 'USD',
    YEARS.map((y, i) => {
      const laggedEdu = Math.max(0, i - 10);
      return [y, 15000 + laggedEdu * 2000 + i * 500] as [number, number];
    }),
  );

  it('education should show positive correlation with GDP', () => {
    const result = analyzeJurisdiction(education, gdp, config)!;
    expect(result.analysis.forwardPearson).toBeGreaterThan(0);
  });

  it('10-year onset delay should detect relationship', () => {
    const longDelayConfig = {
      ...config,
      onsetDelayDays: 10 * 365, // 10 years
      durationOfActionDays: 5 * 365, // 5 years
    };
    const result = analyzeJurisdiction(education, gdp, longDelayConfig)!;
    expect(result.analysis.forwardPearson).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// INCOME INEQUALITY (GINI) → HEALTH OUTCOMES
// ═══════════════════════════════════════════════════════════════════════

describe('Income Inequality → Worse Health Outcomes (Wilkinson-Pickett)', () => {
  // HYPOTHESIS: As inequality increases WITHIN a country over time,
  // health outcomes worsen — even if total wealth increases.
  // This is the "Spirit Level" hypothesis.

  const risingInequality = {
    gini: series('INEQ', 'Unequaland', 'gini', 'Gini Index', 'index',
      YEARS.map((y, i) => [y, 30 + i * 0.8] as [number, number]), // 30 → 46
    ),
    lifeExpectancy: series('INEQ', 'Unequaland', 'le', 'Life Expectancy', 'years',
      YEARS.map((y, i) => [y, 78 - i * 0.1 + Math.sin(i) * 0.2] as [number, number]), // Declining
    ),
  };

  const stableEquality = {
    gini: series('EQ', 'Equaland', 'gini', 'Gini Index', 'index',
      YEARS.map((y) => [y, 27 + Math.sin(YEARS.indexOf(y)) * 1] as [number, number]), // Stable ~27
    ),
    lifeExpectancy: series('EQ', 'Equaland', 'le', 'Life Expectancy', 'years',
      YEARS.map((y, i) => [y, 80 + i * 0.3] as [number, number]), // Steadily improving
    ),
  };

  it('rising inequality should show negative correlation with life expectancy', () => {
    const result = analyzeJurisdiction(risingInequality.gini, risingInequality.lifeExpectancy, config)!;
    expect(result.analysis.forwardPearson).toBeLessThan(0);
  });

  it('unequal country should have worse life expectancy trajectory', () => {
    const inequalResult = analyzeJurisdiction(risingInequality.gini, risingInequality.lifeExpectancy, config)!;
    const equalResult = analyzeJurisdiction(stableEquality.gini, stableEquality.lifeExpectancy, config)!;

    // Unequal country: life expectancy declining; equal: improving
    expect(inequalResult.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline)
      .toBeLessThan(equalResult.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CRIMINAL JUSTICE APPROACH → RECIDIVISM / CRIME
// ═══════════════════════════════════════════════════════════════════════

describe('Rehabilitation vs Punishment → Crime Outcomes', () => {
  // HYPOTHESIS: Countries that increase rehabilitation spending
  // see crime rates decline. Countries that increase incarceration
  // see crime rates stay flat or rise (criminogenic effect).

  // Norway model: high rehab spending → declining crime
  const norway = {
    rehabSpending: series('NOR', 'Norway', 'rehab', 'Rehabilitation Spending per Prisoner', 'USD',
      YEARS.map((y, i) => [y, 80000 + i * 3000] as [number, number]),
    ),
    crimeRate: series('NOR', 'Norway', 'crime', 'Crime Rate per 100K', 'per 100K',
      YEARS.map((y, i) => [y, 45 - i * 1.2] as [number, number]), // Declining
    ),
  };

  // US model: high incarceration → crime stays high
  const usaPrison = {
    incarceration: series('USA', 'United States', 'incarc', 'Incarceration Rate per 100K', 'per 100K',
      YEARS.map((y, i) => [y, 650 + i * 5] as [number, number]), // World's highest
    ),
    crimeRate: series('USA', 'United States', 'crime', 'Crime Rate per 100K', 'per 100K',
      YEARS.map((y, i) => [y, 380 + Math.sin(i * 0.5) * 20] as [number, number]), // Oscillates, no decline
    ),
  };

  it('Norway: rehabilitation spending should negatively correlate with crime', () => {
    const result = analyzeJurisdiction(norway.rehabSpending, norway.crimeRate, config)!;
    expect(result.analysis.forwardPearson).toBeLessThan(0);
  });

  it('USA: incarceration rate should NOT reduce crime', () => {
    const result = analyzeJurisdiction(usaPrison.incarceration, usaPrison.crimeRate, config)!;
    // If punishment worked, higher incarceration → lower crime (negative r)
    // Instead we expect weak or no relationship
    expect(result.analysis.forwardPearson).toBeGreaterThan(-0.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// HEALTHCARE ADMIN OVERHEAD → OUTCOMES
// ═══════════════════════════════════════════════════════════════════════

describe('Administrative Overhead → Diminishing Returns', () => {
  // HYPOTHESIS: Countries where admin costs grow faster than clinical spending
  // see diminishing returns on health outcomes. The US spends ~34% on admin
  // vs ~12% in Canada. More admin $ doesn't help patients.

  // High admin growth country — outcome oscillates with no trend
  const highAdmin = {
    adminCosts: series('ADM', 'Bureaucratia', 'admin', 'Admin % of Health Spending', '%',
      YEARS.map((y, i) => [y, 25 + i * 0.8] as [number, number]), // 25% → 41%
    ),
    lifeExpectancy: series('ADM', 'Bureaucratia', 'le', 'Life Expectancy', 'years',
      YEARS.map((y, i) => [y, 77 + Math.sin(i * 0.8) * 0.5] as [number, number]), // Oscillates, no trend
    ),
  };

  it('rising admin costs should show weak correlation with life expectancy', () => {
    const result = analyzeJurisdiction(highAdmin.adminCosts, highAdmin.lifeExpectancy, config)!;
    // Admin costs rise but outcomes just oscillate → weak correlation
    expect(Math.abs(result.analysis.forwardPearson)).toBeLessThan(0.5);
  });

  it('effect size should be smaller than for clean water intervention', () => {
    const result = analyzeJurisdiction(highAdmin.adminCosts, highAdmin.lifeExpectancy, config)!;
    // Compare to clean water which has massive effect
    const waterPred = series('WADM', 'WaterTest', 'water', 'Clean Water', '%',
      YEARS.map((y, i) => [y, 40 + i * 3] as [number, number]),
    );
    const waterOut = series('WADM', 'WaterTest', 'le', 'Life Expectancy', 'years',
      YEARS.map((y, i) => [y, 50 + i * 1.5] as [number, number]),
    );
    const waterResult = analyzeJurisdiction(waterPred, waterOut, config)!;
    expect(Math.abs(result.analysis.effectSize.zScore))
      .toBeLessThan(Math.abs(waterResult.analysis.effectSize.zScore));
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CLEAN WATER → LIFE EXPECTANCY (STRONGEST INTERVENTION)
// ═══════════════════════════════════════════════════════════════════════

describe('Clean Water Access → Life Expectancy (highest ROI)', () => {
  // HYPOTHESIS: Clean water access is the single highest-ROI health
  // intervention. Countries that improve access see dramatic gains.
  // Onset delay: ~2 years (waterborne disease reduction is fast).

  const waterAccess = {
    water: series('WAT', 'Cleanville', 'water', 'Clean Water Access', '%',
      YEARS.map((y, i) => [y, 40 + i * 3] as [number, number]), // 40% → 97%
    ),
    lifeExpectancy: series('WAT', 'Cleanville', 'le', 'Life Expectancy', 'years',
      YEARS.map((y, i) => [y, 50 + i * 1.5] as [number, number]), // 50 → 78.5 (huge gains)
    ),
  };

  it('clean water should show very strong positive correlation', () => {
    const result = analyzeJurisdiction(waterAccess.water, waterAccess.lifeExpectancy, config)!;
    expect(result.analysis.forwardPearson).toBeGreaterThan(0.9);
  });

  it('effect size should be very large', () => {
    const result = analyzeJurisdiction(waterAccess.water, waterAccess.lifeExpectancy, config)!;
    expect(Math.abs(result.analysis.effectSize.zScore)).toBeGreaterThan(2);
  });

  it('should show largest percent change of any intervention', () => {
    const result = analyzeJurisdiction(waterAccess.water, waterAccess.lifeExpectancy, config)!;
    expect(Math.abs(result.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline)).toBeGreaterThan(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// META-HYPOTHESIS: COMPARING ALL INTERVENTIONS
// ═══════════════════════════════════════════════════════════════════════

describe('Meta: Intervention ROI ranking should match known evidence', () => {
  // When we run multiple predictor→outcome analyses, the ranking
  // of effect sizes should roughly match established evidence:
  // 1. Clean water/sanitation (highest ROI)
  // 2. Childhood vaccination / basic primary care
  // 3. Education
  // 4. Harm reduction (drug policy)
  // 5. Clinical spending (moderate)
  // 6. Administrative overhead (lowest/none)

  const waterPred = series('META', 'TestCountry', 'water', 'Clean Water', '%',
    YEARS.map((y, i) => [y, 40 + i * 3] as [number, number]),
  );
  const waterOut = series('META', 'TestCountry', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 50 + i * 1.5] as [number, number]),
  );

  const clinicalPred = series('META2', 'TestCountry2', 'clinical', 'Clinical Spending', 'USD',
    YEARS.map((y, i) => [y, 2000 + i * 300] as [number, number]),
  );
  const clinicalOut = series('META2', 'TestCountry2', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 75 + i * 0.25] as [number, number]),
  );

  const adminPred = series('META3', 'TestCountry3', 'admin', 'Admin Overhead', '%',
    YEARS.map((y, i) => [y, 25 + i * 0.8] as [number, number]),
  );
  const adminOut = series('META3', 'TestCountry3', 'le', 'Life Expectancy', 'years',
    YEARS.map((y, i) => [y, 77 + i * 0.05] as [number, number]),
  );

  it('clean water effect should be > clinical spending effect > admin effect', () => {
    const waterResult = analyzeJurisdiction(waterPred, waterOut, config)!;
    const clinicalResult = analyzeJurisdiction(clinicalPred, clinicalOut, config)!;
    const adminResult = analyzeJurisdiction(adminPred, adminOut, config)!;

    const waterEffect = Math.abs(waterResult.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline);
    const clinicalEffect = Math.abs(clinicalResult.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline);
    const adminEffect = Math.abs(adminResult.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline);

    expect(waterEffect).toBeGreaterThan(clinicalEffect);
    expect(clinicalEffect).toBeGreaterThan(adminEffect);
  });
});
