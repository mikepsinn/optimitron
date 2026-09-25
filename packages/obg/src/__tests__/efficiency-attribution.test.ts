import { describe, it, expect } from 'vitest';
import type { EfficiencyAnalysis } from '../efficiency-analysis.js';
import {
  attributeFieldsToLines,
  summarizeEfficiencyByField,
  type FieldBenchmarkedLine,
} from '../efficiency-attribution.js';

function analysis(overrides: Partial<EfficiencyAnalysis>): EfficiencyAnalysis {
  const bestCountry = { code: 'CHE', name: 'Switzerland', spendingPerCapita: 400, outcome: 83, rank: 1 };
  return {
    rank: 27,
    totalCountries: 28,
    spendingPerCapita: 2000,
    outcome: 77,
    outcomeName: 'Life Expectancy',
    bestCountry,
    topEfficient: [bestCountry],
    floorSpendingPerCapita: 400,
    floorOutcome: 83,
    overspendRatio: 5,
    potentialSavingsPerCapita: 1600,
    potentialSavingsTotal: 542_400_000_000,
    ...overrides,
  };
}

function line(
  id: string,
  spendingField: string,
  lineSpendingPerCapita: number,
  efficiency: EfficiencyAnalysis,
): FieldBenchmarkedLine {
  return { id, spendingField, lineSpendingPerCapita, efficiency };
}

describe('attributeFieldsToLines', () => {
  it('attributes a shared field only to the line that is most of it', () => {
    // Defense is ~all of military spending; homeland security borrows the field.
    const military = analysis({ spendingPerCapita: 2052 });
    const result = attributeFieldsToLines([
      line('homeland_security', 'militarySpendingPerCapitaPpp', 140, military),
      line('military', 'militarySpendingPerCapitaPpp', 1996, military),
    ]);

    expect(result.map((r) => [r.id, r.scope])).toEqual([
      ['homeland_security', 'national_field_proxy'],
      ['military', 'category_specific'],
    ]);
  });

  it('treats a sole line as a proxy when the field is a whole-system aggregate', () => {
    // A federal education line is ~8% of all-government education spending.
    const [education] = attributeFieldsToLines([
      line('education', 'educationSpendingPerCapitaPpp', 230, analysis({ spendingPerCapita: 2996 })),
    ]);

    expect(education?.scope).toBe('national_field_proxy');
    expect(education?.shareOfField).toBe(0.077);
  });

  it('marks at most one line per field as category-specific', () => {
    const field = analysis({ spendingPerCapita: 1000 });
    const result = attributeFieldsToLines([
      line('a', 'f', 900, field),
      line('b', 'f', 1100, field),
    ]);

    expect(result.filter((r) => r.scope === 'category_specific').map((r) => r.id)).toEqual(['b']);
  });
});

describe('summarizeEfficiencyByField', () => {
  it('returns one finding per spending field', () => {
    const social = analysis({ spendingPerCapita: 12848 });
    const findings = summarizeEfficiencyByField([
      line('transportation', 'socialSpendingPerCapitaPpp', 236, social),
      line('housing', 'socialSpendingPerCapitaPpp', 164, social),
      line('labor', 'socialSpendingPerCapitaPpp', 95, social),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.lineIds).toEqual(['transportation', 'housing', 'labor']);
    expect(findings[0]?.categorySpecificLineId).toBeNull();
  });

  it('reports the smallest savings claim when proxies benchmark one field against different outcomes', () => {
    const vsLifeExpectancy = analysis({
      spendingPerCapita: 12848,
      outcomeName: 'Life Expectancy',
      potentialSavingsTotal: 2_309_000_000_000,
    });
    const vsIncome = analysis({
      spendingPerCapita: 12848,
      outcomeName: 'After-Tax Median Income (PPP)',
      potentialSavingsTotal: 1_688_000_000_000,
    });

    const [finding] = summarizeEfficiencyByField([
      line('justice', 'socialSpendingPerCapitaPpp', 90, vsLifeExpectancy),
      line('labor', 'socialSpendingPerCapitaPpp', 95, vsIncome),
    ]);

    expect(finding?.efficiency).toBe(vsIncome);
  });

  it("reports the category-specific line's analysis even when a proxy claims less", () => {
    const ownOutcome = analysis({ potentialSavingsTotal: 564_000_000_000 });
    const proxyOutcome = analysis({ outcomeName: 'Other', potentialSavingsTotal: 100_000_000_000 });

    const [finding] = summarizeEfficiencyByField([
      line('homeland_security', 'militarySpendingPerCapitaPpp', 140, proxyOutcome),
      line('military', 'militarySpendingPerCapitaPpp', 1996, ownOutcome),
    ]);

    expect(finding?.categorySpecificLineId).toBe('military');
    expect(finding?.efficiency).toBe(ownOutcome);
  });
});
