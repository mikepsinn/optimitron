import { describe, expect, it } from 'vitest';
import { BEST_PRACTICE_BUDGET_DATA as data } from '../datasets/best-practice-budget.js';

describe('best-practice budget source snapshot', () => {
  it('includes global healthcare systems without requiring European income or spending accounts', () => {
    expect(data.healthcareCountries.length).toBeGreaterThan(150);
    for (const id of ['JPN', 'KOR', 'SGP']) {
      expect(data.healthcareCountries.find(country => country.id === id)).toBeDefined();
      expect(data.countries.find(country => country.id === id)).toBeUndefined();
    }
    for (const country of data.healthcareCountries) {
      expect(country.observations.map(row => row.year)).toEqual(data.period);
      expect(country.totalPerCapita).toBeGreaterThan(0);
      expect(country.hale).toBeGreaterThan(0);
      expect(country.hale).toBeLessThan(120);
      expect(country.totalPerCapita).toBeCloseTo(country.observations.reduce((sum, row) => sum + row.totalPerCapita, 0) / data.period.length, 8);
    }
  });

  it('reconciles financing sources without counting out-of-pocket payments twice', () => {
    for (const country of data.healthcareCountries) {
      for (const row of [...country.observations, country]) {
        if (row.publicPerCapita !== null && row.privatePerCapita !== null && row.externalPerCapita !== null) {
          const total = row.publicPerCapita + row.privatePerCapita + row.externalPerCapita;
          expect(Math.abs(total - row.totalPerCapita)).toBeLessThanOrEqual(Math.max(0.01, row.totalPerCapita * 0.00001));
        }
        if (row.outOfPocketPerCapita !== null && row.privatePerCapita !== null) {
          expect(row.outOfPocketPerCapita).toBeLessThanOrEqual(row.privatePerCapita + 0.01);
        }
      }
      for (const component of ['publicPerCapita', 'privatePerCapita', 'externalPerCapita', 'outOfPocketPerCapita'] as const) {
        const values = country.observations.map(row => row[component]);
        if (values.some(value => value === null)) expect(country[component]).toBeNull();
        else expect(country[component]).toBeCloseTo(values.reduce<number>((sum, value) => sum + value!, 0) / values.length, 8);
      }
    }
  });

  it('preserves missing COFOG groups and reconciles available breakdowns to their parent', () => {
    expect(data.subcategories).toHaveLength(69);
    for (const country of data.countries) {
      for (const subgroup of data.subcategories) {
        const values = country.observations.map(row => (row.subcategoryCosts as Record<string, number | null>)[subgroup.id]!);
        const average = (country.subcategoryCosts as Record<string, number | null>)[subgroup.id];
        if (values.some(value => value === null)) expect(average).toBeNull();
        else expect(average).toBeCloseTo(values.reduce<number>((sum, value) => sum + value!, 0) / values.length, 8);
      }
      for (const parent of data.categories) {
        const children = data.subcategories.filter(row => row.parentId === parent.id).map(row => (country.subcategoryCosts as Record<string, number | null>)[row.id]!);
        if (children.some(value => value === null)) continue;
        const total = children.reduce<number>((sum, value) => sum + value!, 0);
        const parentCost = (country.costs as Record<string, number>)[parent.id]!;
        expect(Math.abs(total - parentCost)).toBeLessThanOrEqual(Math.max(5, parentCost * 0.001));
      }
    }
  });

  it('provides dated country population estimates and traceable, distinct source payloads', () => {
    expect(data.populationCountries.length).toBeGreaterThan(200);
    expect(data.populationCountries.some(country => country.id === 'USA')).toBe(true);
    expect(data.populationCountries.some(country => ['WLD', 'HIC', 'EUU', 'OED'].includes(country.id))).toBe(false);
    expect(new Set(data.populationCountries.map(country => country.id)).size).toBe(data.populationCountries.length);
    for (const country of data.populationCountries) {
      expect(Number.isSafeInteger(country.population)).toBe(true);
      expect(country.population).toBeGreaterThan(0);
      expect(country.year).toBeLessThan(new Date(data.generatedAt).getUTCFullYear());
    }
    expect(new Set(data.sources.map(source => source.url)).size).toBe(data.sources.length);
    for (const source of data.sources) {
      expect(source.sha256).toMatch(/^[a-f\d]{64}$/);
      expect(Number.isFinite(Date.parse(source.retrievedAt))).toBe(true);
    }
  });
});
