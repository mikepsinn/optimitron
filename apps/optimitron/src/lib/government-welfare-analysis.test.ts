import { describe, expect, it } from 'vitest';
import { generateGovernmentWelfareAnalysis, generateGovernmentWelfareMarkdown, selectStrictIncomeSeries } from '../../scripts/analysis/government-welfare-analysis';
import type { GovernmentWelfareSourceCache } from '../../scripts/analysis/government-welfare-analysis';

function sourceCache(): GovernmentWelfareSourceCache {
  const cache: GovernmentWelfareSourceCache = { schemaVersion: 1, sourceMode: 'Analytical test fixture', sourceSnapshots: [], spending: [], hale: [], income: [] };
  for (const [index, id] of ['AAA', 'BBB', 'CCC'].entries()) {
    for (let year = 2000; year <= 2023; year++) {
      const base = { jurisdictionIso3: id, jurisdictionName: id, year, source: 'Test source', sourceUrl: 'https://example.org/data' };
      cache.spending.push({ ...base, value: 20 + (year - 2000) * 0.5 + index });
      cache.hale.push({ ...base, value: 60 + (year - 2000) * 0.2 + index });
      cache.income.push({ ...base, value: 20_000 + (year - 2000) * 500 + index * 1000,
        source: 'OECD IDD', unit: 'Real PPP-adjusted US dollars per equivalised household',
        concept: 'after_tax_median_disposable_income', priceBasis: 'real', purchasingPower: 'ppp',
        derivation: 'direct', isAfterTax: true, taxScope: 'after_direct_taxes_and_cash_transfers',
        methodology: 'METH2012', definition: 'D_CUR', welfareType: 'income',
      });
    }
  }
  return cache;
}

describe('recovered government welfare analysis', () => {
  it('retains annual observations and quality warnings without labeling exploratory summaries as causal', () => {
    const report = generateGovernmentWelfareAnalysis(sourceCache(), { generatedAt: '2026-01-01T00:00:00Z', draws: 100 });
    for (const outcome of report.outcomes) {
      expect(outcome.countryCount).toBe(3);
      expect(outcome.meanOutcomeDifference!.mean).toBeGreaterThan(0);
      expect(outcome.countries.every(country => country.includedInSummary && !country.dataQualityPassed)).toBe(true);
      expect(outcome.countries[0]!.warnings).toContain('Insufficient pairs (<30)');
    }
    expect(generateGovernmentWelfareMarkdown(report)).toContain('Exploratory summary; Insufficient pairs (<30)');
  });

  it('counts exclusions against the countries each outcome analyzed, not every country with spending data', () => {
    const cache = sourceCache();
    for (let year = 2000; year <= 2023; year++) {
      cache.spending.push({ jurisdictionIso3: 'DDD', jurisdictionName: 'DDD', year, value: 30,
        source: 'Test source', sourceUrl: 'https://example.org/data' });
    }
    for (const outcome of generateGovernmentWelfareAnalysis(cache, { draws: 100 }).outcomes) {
      // DDD has spending but no HALE or income, so it is never analyzed here.
      expect(outcome.countries.map(country => country.id), outcome.id).not.toContain('DDD');
      expect(outcome.excludedCountryCount, outcome.id)
        .toBe(outcome.countries.filter(country => !country.includedInSummary).length);
      expect(outcome.excludedCountryCount, outcome.id).toBe(0);
    }
  });

  it('uses within-country income percentage changes rather than pooling incompatible currency levels', () => {
    const cache = sourceCache();
    const original = generateGovernmentWelfareAnalysis(cache, { draws: 100 }).outcomes[1]!;
    cache.income = cache.income.map(record => ({ ...record, value: record.value * (record.jurisdictionIso3 === 'AAA' ? 10 : 1) }));
    const rescaled = generateGovernmentWelfareAnalysis(cache, { draws: 100 }).outcomes[1]!;
    expect(rescaled.meanOutcomeDifference!.mean).toBeCloseTo(original.meanOutcomeDifference!.mean, 9);
    expect(rescaled.unit).toContain('%');
  });

  it('rejects inferred or nominal income and keeps one compatible source series per country', () => {
    const valid = sourceCache().income;
    const inferred = valid.map(record => ({ ...record, taxScope: 'derived_from_gov_spending' as const, value: 1 }));
    const nominal = valid.map(record => ({ ...record, priceBasis: 'nominal' as const, value: 2 }));
    expect(selectStrictIncomeSeries([...inferred, ...nominal, ...valid])).toEqual(selectStrictIncomeSeries(valid));
    const constant = sourceCache();
    constant.hale = constant.hale.map(row => ({ ...row, value: 60 }));
    expect(generateGovernmentWelfareAnalysis(constant, { draws: 100 }).outcomes[0]!.countryCount).toBe(0);
  });
});
