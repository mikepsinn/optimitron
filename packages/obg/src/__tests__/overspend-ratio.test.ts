import { describe, it, expect } from 'vitest';
import { overspendRatio } from '../overspend-ratio.js';
import type { MinimumEffectiveSpendingResult } from '../minimum-effective-spending.js';
import type { CountrySpending } from '../overspend-ratio.js';

describe('overspendRatio', () => {
  const floors: MinimumEffectiveSpendingResult[] = [
    {
      categoryId: 'health',
      categoryName: 'Healthcare',
      floorDecile: 3,
      floorSpending: 3000,
      floorOutcome: 78,
      topDecile: 10,
      topSpending: 10000,
      topOutcome: 79,
      outcomeGap: 1,
    },
    {
      categoryId: 'defense',
      categoryName: 'Defense',
      floorDecile: 2,
      floorSpending: 500,
      floorOutcome: 0.5,
      topDecile: 10,
      topSpending: 2000,
      topOutcome: 0.4,
      outcomeGap: 0.1,
    },
  ];

  const countries: CountrySpending[] = [
    {
      countryCode: 'US',
      countryName: 'United States',
      spending: { health: 10000, defense: 1800 },
    },
    {
      countryCode: 'JP',
      countryName: 'Japan',
      spending: { health: 4000, defense: 400 },
    },
    {
      countryCode: 'KR',
      countryName: 'South Korea',
      spending: { health: 2800, defense: 600 },
    },
  ];

  it('computes overspend ratios per category', () => {
    const results = overspendRatio(floors, countries);
    expect(results.byCategory).toHaveLength(2);
    expect(results.byCategory[0]!.categoryId).toBe('health');
    expect(results.byCategory[1]!.categoryId).toBe('defense');
  });

  it('US shows high overspend on healthcare', () => {
    const results = overspendRatio(floors, countries);
    const health = results.byCategory.find((r) => r.categoryId === 'health')!;
    const us = health.countries.find((c) => c.countryCode === 'US')!;
    expect(us.overspendRatio).toBeCloseTo(3.333, 2);
    expect(us.excessSpending).toBe(7000);
  });

  it('Japan is near the floor on healthcare', () => {
    const results = overspendRatio(floors, countries);
    const health = results.byCategory.find((r) => r.categoryId === 'health')!;
    const jp = health.countries.find((c) => c.countryCode === 'JP')!;
    expect(jp.overspendRatio).toBeCloseTo(1.333, 2);
  });

  it('Korea underspends on healthcare (below floor)', () => {
    const results = overspendRatio(floors, countries);
    const health = results.byCategory.find((r) => r.categoryId === 'health')!;
    const kr = health.countries.find((c) => c.countryCode === 'KR')!;
    expect(kr.overspendRatio).toBeLessThan(1);
    expect(kr.excessSpending).toBeLessThan(0);
  });

  it('sorts countries by overspend ratio descending', () => {
    const results = overspendRatio(floors, countries);
    const health = results.byCategory.find((r) => r.categoryId === 'health')!;
    expect(health.countries[0]!.countryCode).toBe('US');
    expect(health.countries[health.countries.length - 1]!.countryCode).toBe('KR');
  });

  it('computes average overspend ratio', () => {
    const results = overspendRatio(floors, countries);
    const health = results.byCategory.find((r) => r.categoryId === 'health')!;
    expect(health.avgOverspendRatio).toBeGreaterThan(1);
  });

  it('skips categories with zero floor spending', () => {
    const zeroFloor: MinimumEffectiveSpendingResult[] = [
      {
        categoryId: 'education',
        categoryName: 'Education',
        floorDecile: null,
        floorSpending: 0,
        floorOutcome: 0,
        topDecile: null,
        topSpending: 0,
        topOutcome: 0,
        outcomeGap: 0,
      },
    ];
    const results = overspendRatio(zeroFloor, countries);
    expect(results.byCategory).toHaveLength(0);
  });

  it('skips countries with missing spending for category', () => {
    const partial: CountrySpending[] = [
      { countryCode: 'US', spending: { health: 10000 } },
      { countryCode: 'JP', spending: {} },
    ];
    const results = overspendRatio(floors, partial);
    const health = results.byCategory.find((r) => r.categoryId === 'health')!;
    expect(health.countries).toHaveLength(1);
    expect(health.countries[0]!.countryCode).toBe('US');
  });

  it('returns empty countries array when no spending data matches', () => {
    const results = overspendRatio(floors, []);
    expect(results.byCategory).toHaveLength(2);
    expect(results.byCategory[0]!.countries).toHaveLength(0);
    expect(results.byCategory[0]!.avgOverspendRatio).toBe(0);
  });

  it('handles defense category with US high spender', () => {
    const results = overspendRatio(floors, countries);
    const defense = results.byCategory.find((r) => r.categoryId === 'defense')!;
    const us = defense.countries.find((c) => c.countryCode === 'US')!;
    expect(us.overspendRatio).toBe(3.6);
    expect(us.excessSpending).toBe(1300);
  });

  it('returns per-country overspend ratios', () => {
    const results = overspendRatio(floors, countries);
    const us = results.byCountry.find((c) => c.countryCode === 'US')!;
    expect(us.avgOverspendRatio).toBeGreaterThan(1);
    const health = us.categories.find((c) => c.categoryId === 'health')!;
    expect(health.overspendRatio).toBeCloseTo(3.333, 2);
  });
});
