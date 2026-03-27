import { describe, it, expect, beforeAll } from 'vitest';
import {
  healthComparisonToTimeSeries,
  drugPolicyToTimeSeries,
  educationToTimeSeries,
  criminalJusticeToTimeSeries,
  budgetToTimeSeries,
  budgetOutcomesToTimeSeries,
  allDatasetsToTimeSeries,
  getCrossCountryVariable,
  healthCountryToTimeSeries,
  oecdBudgetPanelToSpendingOutcome,
} from '../../datasets/to-time-series';
import { HEALTH_SYSTEM_COMPARISON } from '../../datasets/international-comparisons';

describe('Dataset → TimeSeries converters', () => {
  describe('healthComparisonToTimeSeries', () => {
    it('returns a map with entries for each country', () => {
      const result = healthComparisonToTimeSeries();
      expect(result.size).toBeGreaterThanOrEqual(10);
    });

    it('each country has 8 health variables', () => {
      const result = healthComparisonToTimeSeries();
      for (const [, series] of result) {
        expect(series).toHaveLength(8);
      }
    });

    it('variable IDs include ISO3 prefix', () => {
      const result = healthComparisonToTimeSeries();
      const sgp = result.get('SGP');
      expect(sgp).toBeDefined();
      expect(sgp![0].variableId).toMatch(/^SGP:/);
    });

    it('measurements have valid timestamps and values', () => {
      const result = healthComparisonToTimeSeries();
      const usa = result.get('USA');
      expect(usa).toBeDefined();
      for (const series of usa!) {
        expect(series.measurements).toHaveLength(1);
        expect(series.measurements[0].value).toBeGreaterThan(0);
        expect(typeof series.measurements[0].timestamp).toBe('number');
      }
    });

    it('life expectancy values are realistic (50-95 years)', () => {
      const result = healthComparisonToTimeSeries();
      for (const [, series] of result) {
        const le = series.find((s) => s.variableId.endsWith(':life_expectancy'));
        expect(le).toBeDefined();
        expect(le!.measurements[0].value).toBeGreaterThan(50);
        expect(le!.measurements[0].value).toBeLessThan(95);
      }
    });
  });

  describe('drugPolicyToTimeSeries', () => {
    it('returns entries for drug policy countries', () => {
      const result = drugPolicyToTimeSeries();
      expect(result.size).toBeGreaterThanOrEqual(5);
    });

    it('each country has 4 drug policy variables', () => {
      const result = drugPolicyToTimeSeries();
      for (const [, series] of result) {
        expect(series).toHaveLength(4);
      }
    });
  });

  describe('educationToTimeSeries', () => {
    it('returns entries for education countries', () => {
      const result = educationToTimeSeries();
      expect(result.size).toBeGreaterThanOrEqual(5);
    });

    it('PISA scores are in realistic range (300-600)', () => {
      const result = educationToTimeSeries();
      for (const [, series] of result) {
        const math = series.find((s) => s.variableId.endsWith(':pisa_math'));
        if (math) {
          expect(math.measurements[0].value).toBeGreaterThan(300);
          expect(math.measurements[0].value).toBeLessThan(600);
        }
      }
    });
  });

  describe('criminalJusticeToTimeSeries', () => {
    it('returns entries for criminal justice countries', () => {
      const result = criminalJusticeToTimeSeries();
      expect(result.size).toBeGreaterThanOrEqual(5);
    });

    it('each country has 5 justice variables', () => {
      const result = criminalJusticeToTimeSeries();
      for (const [, series] of result) {
        expect(series).toHaveLength(5);
      }
    });
  });

  describe('budgetToTimeSeries', () => {
    it('returns TimeSeries for each budget category', () => {
      const result = budgetToTimeSeries();
      expect(result.length).toBeGreaterThanOrEqual(10);
    });

    it('each category has multi-year historical data (FY2015-2025)', () => {
      const result = budgetToTimeSeries();
      for (const series of result) {
        expect(series.measurements.length).toBeGreaterThanOrEqual(5);
      }
    });

    it('variable IDs start with US:budget:', () => {
      const result = budgetToTimeSeries();
      for (const series of result) {
        expect(series.variableId).toMatch(/^US:budget:/);
      }
    });
  });

  describe('budgetOutcomesToTimeSeries', () => {
    it('returns outcome metrics as TimeSeries', () => {
      const result = budgetOutcomesToTimeSeries();
      expect(result.length).toBeGreaterThanOrEqual(10);
    });

    it('variable IDs start with US:outcome:', () => {
      const result = budgetOutcomesToTimeSeries();
      for (const series of result) {
        expect(series.variableId).toMatch(/^US:outcome:/);
      }
    });
  });

  describe('allDatasetsToTimeSeries', () => {
    it('returns a merged map of all jurisdictions', () => {
      const result = allDatasetsToTimeSeries();
      expect(result.size).toBeGreaterThanOrEqual(15);
    });

    it('USA has budget + health + outcome data combined', () => {
      const result = allDatasetsToTimeSeries();
      const usa = result.get('USA');
      expect(usa).toBeDefined();
      // Should have health (8) + budget categories + outcome metrics
      expect(usa!.length).toBeGreaterThan(20);
    });

    it('SGP has health data', () => {
      const result = allDatasetsToTimeSeries();
      const sgp = result.get('SGP');
      expect(sgp).toBeDefined();
      expect(sgp!.some((s) => s.variableId.includes('life_expectancy'))).toBe(true);
    });
  });

  describe('getCrossCountryVariable', () => {
    it('returns life expectancy for multiple countries', () => {
      const result = getCrossCountryVariable('life_expectancy');
      expect(result.length).toBeGreaterThanOrEqual(10);
    });

    it('each entry has country and valid timeSeries', () => {
      const result = getCrossCountryVariable('life_expectancy');
      for (const entry of result) {
        expect(entry.country).toBeTruthy();
        expect(entry.timeSeries.measurements).toHaveLength(1);
        expect(entry.timeSeries.measurements[0].value).toBeGreaterThan(0);
      }
    });
  });

  describe('healthCountryToTimeSeries (single country)', () => {
    it('produces 8 series for one country', () => {
      const sgp = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === 'SGP');
      expect(sgp).toBeDefined();
      const series = healthCountryToTimeSeries(sgp!);
      expect(series).toHaveLength(8);
    });
  });
});

  describe('oecdBudgetPanelToSpendingOutcome', () => {
    it('produces spending→outcome pairs from health spending vs life expectancy', () => {
      const points = oecdBudgetPanelToSpendingOutcome(
        'healthSpendingPerCapitaPpp',
        'lifeExpectancyYears',
      );
      // 23 countries × ~20 non-null years ≈ 300+ points
      expect(points.length).toBeGreaterThan(200);
    });

    it('each point has finite spending, outcome, jurisdiction, and year', () => {
      const points = oecdBudgetPanelToSpendingOutcome(
        'educationSpendingPerCapitaPpp',
        'gdpPerCapitaPpp',
      );
      for (const p of points) {
        expect(Number.isFinite(p.spending)).toBe(true);
        expect(Number.isFinite(p.outcome)).toBe(true);
        expect(p.spending).toBeGreaterThan(0);
        expect(p.outcome).toBeGreaterThan(0);
        expect(p.jurisdiction.length).toBe(3);
        expect(p.year).toBeGreaterThanOrEqual(2000);
        expect(p.year).toBeLessThanOrEqual(2022);
      }
    });

    it('education spending has points (may be fewer due to null gaps)', () => {
      const education = oecdBudgetPanelToSpendingOutcome(
        'educationSpendingPerCapitaPpp',
        'lifeExpectancyYears',
      );
      // Should have substantial data
      expect(education.length).toBeGreaterThan(100);
    });

    it('social spending vs gini has fewest points (sparse gini data)', () => {
      const points = oecdBudgetPanelToSpendingOutcome(
        'socialSpendingPerCapitaPpp',
        'giniIndex',
      );
      // Gini is the sparsest field, but should still have some data
      expect(points.length).toBeGreaterThan(30);
    });
  });

// ─── Demo: Country Analysis ──────────────────────────────────────────────────

describe('Demo: Country Analysis (spending vs life expectancy)', () => {
  // Lazy import to avoid issues if the demo file doesn't exist
  let analyzeSpendingVsLifeExpectancy: typeof import('../../datasets/demo-country-analysis.js')['analyzeSpendingVsLifeExpectancy'];
  let getSingaporeVsUSTimeSeries: typeof import('../../datasets/demo-country-analysis.js')['getSingaporeVsUSTimeSeries'];

  beforeAll(async () => {
    const mod = await import('../../datasets/demo-country-analysis.js');
    analyzeSpendingVsLifeExpectancy = mod.analyzeSpendingVsLifeExpectancy;
    getSingaporeVsUSTimeSeries = mod.getSingaporeVsUSTimeSeries;
  });

  it('analyzes spending vs life expectancy across all countries', () => {
    const result = analyzeSpendingVsLifeExpectancy();
    expect(result.countries.length).toBeGreaterThanOrEqual(15);
    expect(result.pearsonR).toBeGreaterThan(-1);
    expect(result.pearsonR).toBeLessThan(1);
  });

  it('identifies top-efficiency countries', () => {
    const result = analyzeSpendingVsLifeExpectancy();
    expect(result.topEfficiency.length).toBe(5);
    // Thailand, Costa Rica, or India should be among the most efficient
    // (high life expectancy per dollar spent)
    const topCountries = result.topEfficiency.map((e) => e.country);
    // At least one low-spending, reasonable-life-expectancy country
    expect(topCountries.some((c) => ['Thailand', 'India', 'Costa Rica', 'Cuba'].includes(c))).toBe(true);
  });

  it('loads Singapore and US health TimeSeries', () => {
    const { singapore, us } = getSingaporeVsUSTimeSeries();
    expect(singapore.length).toBe(8);
    expect(us.length).toBe(8);
  });

  it('Singapore spends less but lives longer', () => {
    const result = analyzeSpendingVsLifeExpectancy();
    const sg = result.countries.find((c) => c.iso3 === 'SGP')!;
    const us = result.countries.find((c) => c.iso3 === 'USA')!;
    expect(sg.spending).toBeLessThan(us.spending);
    expect(sg.lifeExpectancy).toBeGreaterThan(us.lifeExpectancy);
  });
});
