import { describe, it, expect } from 'vitest';
import {
  getCpiForYear,
  getUSPopulationForYear,
  cpiDeflator,
  deflateToReal,
  toRealPerCapita,
  historicalToRealPerCapita,
  availableYears,
} from '../inflation-adjustment.js';

// ---------------------------------------------------------------------------
// getCpiForYear
// ---------------------------------------------------------------------------

describe('getCpiForYear', () => {
  it('returns CPI for known years', () => {
    expect(getCpiForYear(2017)).toBe(245.1);
    expect(getCpiForYear(2000)).toBe(172.2);
  });

  it('returns undefined for unknown years', () => {
    expect(getCpiForYear(1950)).toBeUndefined();
    expect(getCpiForYear(2099)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getUSPopulationForYear
// ---------------------------------------------------------------------------

describe('getUSPopulationForYear', () => {
  it('returns population in individuals (not thousands)', () => {
    const pop2017 = getUSPopulationForYear(2017);
    expect(pop2017).toBe(325_147_000);
  });

  it('returns undefined for unknown years', () => {
    expect(getUSPopulationForYear(1950)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// cpiDeflator
// ---------------------------------------------------------------------------

describe('cpiDeflator', () => {
  it('returns 1.0 when nominal year equals base year', () => {
    expect(cpiDeflator(2017, 2017)).toBe(1);
  });

  it('returns > 1 when deflating older dollars to newer base year', () => {
    // $1 in 2000 buys more than $1 in 2017 → deflator > 1
    const d = cpiDeflator(2000, 2017);
    expect(d).toBeGreaterThan(1);
    expect(d).toBeCloseTo(245.1 / 172.2, 4);
  });

  it('returns < 1 when deflating newer dollars to older base year', () => {
    const d = cpiDeflator(2023, 2017);
    expect(d).toBeLessThan(1);
    expect(d).toBeCloseTo(245.1 / 304.7, 4);
  });

  it('throws for years outside CPI data range', () => {
    expect(() => cpiDeflator(1950, 2017)).toThrow(/CPI data not available/);
    expect(() => cpiDeflator(2017, 1950)).toThrow(/CPI data not available/);
  });
});

// ---------------------------------------------------------------------------
// deflateToReal
// ---------------------------------------------------------------------------

describe('deflateToReal', () => {
  it('converts nominal to real dollars', () => {
    // $100 in 2000 → 2017 dollars
    const real = deflateToReal(100, 2000, 2017);
    expect(real).toBeCloseTo(100 * (245.1 / 172.2), 1);
    expect(real).toBeGreaterThan(100); // older dollars are worth more
  });

  it('returns the same value when year equals base year', () => {
    expect(deflateToReal(500, 2017, 2017)).toBe(500);
  });

  it('deflates recent dollars downward to older base year', () => {
    const real = deflateToReal(100, 2023, 2017);
    expect(real).toBeLessThan(100);
  });
});

// ---------------------------------------------------------------------------
// toRealPerCapita
// ---------------------------------------------------------------------------

describe('toRealPerCapita', () => {
  it('converts nominal billions to real per-capita dollars', () => {
    // Social Security 2017: $939B nominal
    // Real per capita = ($939B * (CPI_2017/CPI_2017)) / pop_2017
    //                 = $939B / 325,147,000
    //                 ≈ $2,888 per person
    const rpc = toRealPerCapita(939, 2017, 2017);
    expect(rpc).toBeCloseTo((939e9) / 325_147_000, -1);
    expect(rpc).toBeGreaterThan(2500);
    expect(rpc).toBeLessThan(3500);
  });

  it('older years have deflation applied', () => {
    // $882B in 2015 nominal → 2017 real per capita
    // Should be higher per-capita than raw nominal/pop because CPI adjustment inflates older dollars
    const rpc2015 = toRealPerCapita(882, 2015, 2017);
    const rawPerCapita = (882e9) / 320_743_000;
    expect(rpc2015).toBeGreaterThan(rawPerCapita); // deflator > 1 for 2015→2017
  });

  it('throws for years without population data', () => {
    expect(() => toRealPerCapita(100, 1950)).toThrow(/Population data not available/);
  });
});

// ---------------------------------------------------------------------------
// historicalToRealPerCapita
// ---------------------------------------------------------------------------

describe('historicalToRealPerCapita', () => {
  it('converts array of historical spending entries', () => {
    const entries = [
      { year: 2015, amount: 882 },
      { year: 2020, amount: 1090 },
      { year: 2025, amount: 1461 },
    ];

    const result = historicalToRealPerCapita(entries, 2017);

    expect(result).toHaveLength(3);
    expect(result[0]!.year).toBe(2015);
    expect(result[0]!.nominalBillions).toBe(882);
    expect(result[0]!.realPerCapita).toBeGreaterThan(0);

    // All three should have reasonable per-capita values ($2,000–$5,000 range for SS)
    for (const r of result) {
      expect(r.realPerCapita).toBeGreaterThan(2000);
      expect(r.realPerCapita).toBeLessThan(6000);
    }
  });

  it('real per-capita should grow slower than nominal due to inflation + population growth', () => {
    const entries = [
      { year: 2015, amount: 882 },
      { year: 2025, amount: 1461 },
    ];

    const result = historicalToRealPerCapita(entries, 2017);

    const nominalGrowth = 1461 / 882;
    const realPerCapitaGrowth = result[1]!.realPerCapita / result[0]!.realPerCapita;

    // Real per-capita growth should be less than nominal growth
    // because inflation and population growth eat into it
    expect(realPerCapitaGrowth).toBeLessThan(nominalGrowth);
    expect(realPerCapitaGrowth).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// availableYears
// ---------------------------------------------------------------------------

describe('availableYears', () => {
  it('returns sorted years where both CPI and population data exist', () => {
    const years = availableYears();
    expect(years.length).toBeGreaterThanOrEqual(20);
    expect(years[0]).toBe(2000);
    expect(years).toContain(2017);
    // Should be sorted
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBeGreaterThan(years[i - 1]!);
    }
  });
});
