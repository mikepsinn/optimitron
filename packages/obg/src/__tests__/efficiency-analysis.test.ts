import { describe, it, expect } from 'vitest';
import { analyzeEfficiency, EfficiencyAnalysisSchema } from '../efficiency-analysis.js';
import type { SpendingOutcomePoint } from '../diminishing-returns.js';

const MOCK_DATA: SpendingOutcomePoint[] = [
  // USA: high spending, mediocre outcome
  { spending: 2000, outcome: 77, jurisdiction: 'USA', year: 2020 },
  { spending: 2050, outcome: 77, jurisdiction: 'USA', year: 2021 },
  { spending: 2100, outcome: 77, jurisdiction: 'USA', year: 2022 },
  // IRL: low spending, good outcome
  { spending: 230, outcome: 82, jurisdiction: 'IRL', year: 2020 },
  { spending: 225, outcome: 82, jurisdiction: 'IRL', year: 2021 },
  { spending: 226, outcome: 82, jurisdiction: 'IRL', year: 2022 },
  // ESP: low spending, great outcome
  { spending: 330, outcome: 83, jurisdiction: 'ESP', year: 2020 },
  { spending: 331, outcome: 83, jurisdiction: 'ESP', year: 2021 },
  { spending: 332, outcome: 83, jurisdiction: 'ESP', year: 2022 },
  // DEU: medium spending, good outcome
  { spending: 650, outcome: 81, jurisdiction: 'DEU', year: 2020 },
  { spending: 655, outcome: 81, jurisdiction: 'DEU', year: 2021 },
  { spending: 660, outcome: 81, jurisdiction: 'DEU', year: 2022 },
  // JPN: low spending, great outcome
  { spending: 400, outcome: 84, jurisdiction: 'JPN', year: 2020 },
  { spending: 405, outcome: 84, jurisdiction: 'JPN', year: 2021 },
  { spending: 410, outcome: 84, jurisdiction: 'JPN', year: 2022 },
  // KOR: low spending, good outcome
  { spending: 600, outcome: 83, jurisdiction: 'KOR', year: 2020 },
  { spending: 605, outcome: 84, jurisdiction: 'KOR', year: 2021 },
  { spending: 610, outcome: 84, jurisdiction: 'KOR', year: 2022 },
];

const NAMES: Record<string, string> = {
  USA: 'United States', IRL: 'Ireland', ESP: 'Spain',
  DEU: 'Germany', JPN: 'Japan', KOR: 'South Korea',
};

describe('analyzeEfficiency', () => {
  it('returns null with insufficient data', () => {
    const result = analyzeEfficiency([
      { spending: 100, outcome: 80, jurisdiction: 'USA', year: 2022 },
    ]);
    expect(result).toBeNull();
  });

  it('returns null if target jurisdiction not in data', () => {
    const result = analyzeEfficiency(MOCK_DATA, { jurisdictionCode: 'ZZZ' });
    expect(result).toBeNull();
  });

  it('ranks USA as least efficient (highest spending, mediocre outcome)', () => {
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      countryNames: NAMES,
      outcomeName: 'Life Expectancy',
    });

    expect(result).not.toBeNull();
    expect(result!.rank).toBe(6); // Last of 6 countries
    expect(result!.totalCountries).toBe(6);
    expect(result!.spending).toBeGreaterThan(2000);
    expect(result!.outcome).toBeCloseTo(77, 0);
  });

  it('calculates overspend ratio > 1 for USA', () => {
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      countryNames: NAMES,
      outcomeName: 'Life Expectancy',
    });

    expect(result!.overspendRatio).toBeGreaterThan(1);
    expect(result!.potentialSavingsPerCapita).toBeGreaterThan(0);
  });

  it('identifies most efficient country', () => {
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      countryNames: NAMES,
      outcomeName: 'Life Expectancy',
    });

    // Best should be one of the low-spending, high-outcome countries
    expect(result!.bestCountry.rank).toBe(1);
    expect(result!.bestCountry.spending).toBeLessThan(1000);
    expect(result!.bestCountry.outcome).toBeGreaterThan(80);
  });

  it('returns top 3 efficient countries', () => {
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      countryNames: NAMES,
      outcomeName: 'Life Expectancy',
    });

    expect(result!.topEfficient).toHaveLength(3);
    expect(result!.topEfficient[0]!.rank).toBe(1);
    expect(result!.topEfficient[1]!.rank).toBe(2);
    expect(result!.topEfficient[2]!.rank).toBe(3);
  });

  it('calculates total savings with population', () => {
    const pop = 339_000_000;
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      population: pop,
      countryNames: NAMES,
      outcomeName: 'Life Expectancy',
    });

    expect(result!.potentialSavingsTotal).toBe(
      result!.potentialSavingsPerCapita * pop,
    );
  });

  it('validates against Zod schema', () => {
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      countryNames: NAMES,
      outcomeName: 'Life Expectancy',
    });

    const parsed = EfficiencyAnalysisSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it('works for a non-US jurisdiction', () => {
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'DEU',
      countryNames: NAMES,
      outcomeName: 'Life Expectancy',
    });

    expect(result).not.toBeNull();
    expect(result!.rank).toBeLessThan(6); // Germany should rank better than USA
    expect(result!.spending).toBeCloseTo(655, 0);
  });
});
