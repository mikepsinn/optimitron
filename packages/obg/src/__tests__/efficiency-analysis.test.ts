import { describe, it, expect } from 'vitest';
import { analyzeEfficiency, EfficiencyAnalysisSchema } from '../efficiency-analysis.js';
import type { SpendingOutcomePoint } from '../diminishing-returns.js';

// 6 countries with clear spending-outcome patterns
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
  // JPN: low spending, best outcome
  { spending: 400, outcome: 84, jurisdiction: 'JPN', year: 2020 },
  { spending: 405, outcome: 84, jurisdiction: 'JPN', year: 2021 },
  { spending: 410, outcome: 84, jurisdiction: 'JPN', year: 2022 },
  // KOR: medium spending, great outcome
  { spending: 600, outcome: 84, jurisdiction: 'KOR', year: 2020 },
  { spending: 605, outcome: 84, jurisdiction: 'KOR', year: 2021 },
  { spending: 610, outcome: 84, jurisdiction: 'KOR', year: 2022 },
];

const NAMES: Record<string, string> = {
  USA: 'United States', IRL: 'Ireland', ESP: 'Spain',
  DEU: 'Germany', JPN: 'Japan', KOR: 'South Korea',
};

describe('analyzeEfficiency (cheapest high performer)', () => {
  it('returns null with insufficient data', () => {
    expect(analyzeEfficiency([
      { spending: 100, outcome: 80, jurisdiction: 'USA', year: 2022 },
    ])).toBeNull();
  });

  it('returns null if target jurisdiction not in data', () => {
    expect(analyzeEfficiency(MOCK_DATA, { jurisdictionCode: 'ZZZ' })).toBeNull();
  });

  it('finds the cheapest high performer (75th percentile outcome, lowest spending)', () => {
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      countryNames: NAMES,
      outcomeName: 'Life Expectancy',
    });

    expect(result).not.toBeNull();
    // 75th percentile of [77, 81, 82, 83, 84, 84] = 84 (index 4 of 6)
    // High performers (>=84): JPN (84, $405), KOR (84, $605)
    // Cheapest among them: JPN at $405
    expect(result!.bestCountry.code).toBe('JPN');
    expect(result!.bestCountry.spendingPerCapita).toBe(405);
    expect(result!.floorSpendingPerCapita).toBe(405);
  });

  it('calculates overspend ratio correctly', () => {
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      countryNames: NAMES,
    });

    // USA: ~$2050 / ESP: ~$331 ≈ 6.2x
    expect(result!.overspendRatio).toBeGreaterThan(5);
    expect(result!.overspendRatio).toBeLessThan(7);
  });

  it('returns top 3 cheapest high performers', () => {
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      countryNames: NAMES,
    });

    // Only 2 high performers (outcome >= 84): JPN and KOR
    expect(result!.topEfficient).toHaveLength(2);
    expect(result!.topEfficient[0]!.code).toBe('JPN');
    expect(result!.topEfficient[1]!.code).toBe('KOR');
  });

  it('calculates potential savings with population', () => {
    const pop = 339_000_000;
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      population: pop,
    });

    expect(result!.potentialSavingsTotal).toBe(result!.potentialSavingsPerCapita * pop);
    expect(result!.potentialSavingsPerCapita).toBeGreaterThan(1500);
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
    });

    expect(result).not.toBeNull();
    // Germany: $655/cap, outcome 81. Not in top quartile (p75 ≈ 83+).
    // So Germany's overspend is relative to cheapest high performer
    expect(result!.spendingPerCapita).toBeCloseTo(655, 0);
    expect(result!.overspendRatio).toBeGreaterThan(1);
  });

  it('excludes mediocre-outcome countries from being "best value"', () => {
    // USA has the worst outcome (77) — it should NEVER be the best value
    const result = analyzeEfficiency(MOCK_DATA, {
      jurisdictionCode: 'USA',
      countryNames: NAMES,
    });

    expect(result!.bestCountry.code).not.toBe('USA');
    expect(result!.bestCountry.outcome).toBeGreaterThan(result!.outcome);
  });
});
