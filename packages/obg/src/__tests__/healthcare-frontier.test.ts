import { describe, expect, it } from 'vitest';
import { calculateHealthcareFrontier } from '../healthcare-frontier.js';
import type { HealthcareFrontierCountry } from '../healthcare-frontier.js';

function country(id: string, cost: number, hale: number, extra: Partial<HealthcareFrontierCountry> = {}): HealthcareFrontierCountry {
  return { id, name: id, totalPerCapita: cost, publicPerCapita: cost * 0.6,
    privatePerCapita: cost * 0.4, externalPerCapita: 0, outOfPocketPerCapita: cost * 0.2,
    hale, haleLow: null, haleHigh: null, ...extra };
}

describe('healthcare cost-outcome frontier', () => {
  it('removes dominated systems and selects on total costs rather than public cost or health/cost ratios', () => {
    const countries = [country('CHEAP', 50, 60), country('A', 200, 73), country('B', 300, 74),
      country('WORSE', 210, 72), country('SHIFT', 250, 73, { publicPerCapita: 1, privatePerCapita: 249 })];
    const result = calculateHealthcareFrontier({ countries });
    expect(result.frontier.map(c => c.id)).toEqual(['CHEAP', 'A', 'B']);
    expect(result.selected?.id).toBe('A');
    expect(result.bestHale).toBe(74);
    expect(result.targetHale).toBe(73);
    expect(result.eligibleCountryCount).toBe(3);
    expect(result.alternatives.map(c => c.id)).toEqual(['SHIFT', 'B']);
    expect(result.selectedIsOnFrontier).toBe(true);
    expect(result.selectedDominatedBy).toEqual([]);
  });

  it('keeps equivalent frontier points, rejects equal-cost worse outcomes, and breaks ties deterministically', () => {
    const countries = [country('Z', 100, 75), country('LOW', 100, 74), country('A', 100, 75), country('COSTLY', 110, 75)];
    for (const order of [countries, [...countries].reverse()]) {
      const result = calculateHealthcareFrontier({ countries: order });
      expect(result.countries.map(c => c.id)).toEqual(['A', 'Z', 'LOW', 'COSTLY']);
      expect(result.frontier.map(c => c.id)).toEqual(['A', 'Z']);
      expect(result.selected?.id).toBe('A');
    }
  });

  it('uses the explicit health target without lowering it for missing public financing', () => {
    const countries = [country('BEST', 100, 80, { publicPerCapita: null }), country('FUNDED', 200, 78)];
    const result = calculateHealthcareFrontier({ countries });
    expect(result.frontier.map(c => c.id)).toEqual(['BEST']);
    expect(result.bestHale).toBe(80);
    expect(result.targetHale).toBe(79);
    expect(result.selected).toBeNull();
    expect(result.eligibleCountryCount).toBe(0);
    expect(result.alternatives).toEqual([]);
    expect(result.selectedIsOnFrontier).toBe(false);
    const wider = calculateHealthcareFrontier({ countries, maxHealthyYearGap: 2 });
    expect(wider.selected?.id).toBe('FUNDED');
    expect(wider.selectedIsOnFrontier).toBe(false);
    expect(wider.selectedDominatedBy).toEqual(['BEST']);
  });

  it('changes the selected system at the requested quality boundary and accepts genuine zero public cost', () => {
    const countries = [country('NEAR', 100, 74, { publicPerCapita: 0 }), country('BEST', 200, 75)];
    expect(calculateHealthcareFrontier({ countries, maxHealthyYearGap: 0 }).selected?.id).toBe('BEST');
    expect(calculateHealthcareFrontier({ countries, maxHealthyYearGap: 0.99 }).selected?.id).toBe('BEST');
    expect(calculateHealthcareFrontier({ countries, maxHealthyYearGap: 1 }).selected?.id).toBe('NEAR');
  });

  it('repeats selection from each year rather than carrying period means or public costs into missing years', () => {
    const countries = [country('A', 100, 74, { observations: [
      { year: 2018, totalPerCapita: 150, publicPerCapita: 90, hale: 74 },
      { year: 2017, totalPerCapita: 80, publicPerCapita: 0, hale: 73 },
      { year: 2019, totalPerCapita: 90, publicPerCapita: null, hale: 74 },
    ] }), country('B', 120, 75, { observations: [
      { year: 2017, totalPerCapita: 120, publicPerCapita: 70, hale: 74 },
      { year: 2018, totalPerCapita: 100, publicPerCapita: 60, hale: 75 },
      { year: 2019, totalPerCapita: 100, publicPerCapita: null, hale: 75 },
    ] })];
    const result = calculateHealthcareFrontier({ countries });
    expect(result.selected?.id).toBe('A');
    expect(result.selectionByYear.map(y => [y.year, y.selectedId, y.targetHale, y.eligibleCountryCount])).toEqual([
      [2017, 'A', 73, 2], [2018, 'B', 74, 2], [2019, null, 74, 0],
    ]);
    expect(result.selectionByYear[0]?.selectedPublicPerCapita).toBe(0);
    expect(result.selectionByYear[2]?.selectedTotalPerCapita).toBeNull();
  });

  it('retains reported uncertainty and extra provenance without mutating the input', () => {
    const observation = Object.freeze({ year: 2019, totalPerCapita: 100, publicPerCapita: 60, hale: 74 });
    const original = Object.freeze({ ...country('A', 100, 74, { haleLow: 71, haleHigh: 76 }),
      source: 'WHO', observations: Object.freeze([observation]) });
    const countries = Object.freeze([Object.freeze(country('B', 200, 75)), original]);
    const result = calculateHealthcareFrontier({ countries });
    expect(result.selected).toMatchObject({ id: 'A', haleLow: 71, haleHigh: 76, source: 'WHO' });
    expect(countries.map(c => c.id)).toEqual(['B', 'A']);
    expect(result.countries.map(c => c.id)).toEqual(['A', 'B']);
    expect(result.selected?.observations).toEqual([observation]);
  });

  it('reports absent data as absent rather than inventing a reference or a zero outcome', () => {
    const result = calculateHealthcareFrontier({ countries: [] });
    expect(result).toMatchObject({ countries: [], frontier: [], selected: null, alternatives: [],
      bestHale: null, targetHale: null, eligibleCountryCount: 0, selectionByYear: [] });
  });

  it('rejects nonfinite or negative numbers rather than putting corrupt points on the frontier', () => {
    for (const value of [-1, NaN, Infinity, -Infinity]) {
      expect(() => calculateHealthcareFrontier({ countries: [], maxHealthyYearGap: value })).toThrow('maxHealthyYearGap');
      for (const field of ['totalPerCapita', 'publicPerCapita', 'privatePerCapita', 'externalPerCapita', 'outOfPocketPerCapita', 'hale', 'haleLow', 'haleHigh'] as const) {
        expect(() => calculateHealthcareFrontier({ countries: [country('A', 100, 74, { [field]: value })] })).toThrow(field);
      }
    }
    expect(() => calculateHealthcareFrontier({ countries: [country('A', 100, 74, { haleLow: 75 })] })).toThrow('bounds');
    expect(() => calculateHealthcareFrontier({ countries: [country('A', 100, 74, { haleHigh: 73 })] })).toThrow('bounds');
  });

  it('rejects duplicate country and year observations that would disguise sample size or annual stability', () => {
    expect(() => calculateHealthcareFrontier({ countries: [country('A', 100, 74), country('A', 200, 73)] })).toThrow('Duplicate country');
    const observation = { year: 2019, totalPerCapita: 100, publicPerCapita: 60, hale: 74 };
    expect(() => calculateHealthcareFrontier({ countries: [country('A', 100, 74, { observations: [observation, observation] })] })).toThrow('duplicate observation year');
    for (const year of [0, -1, 2019.5, NaN, Infinity]) {
      expect(() => calculateHealthcareFrontier({ countries: [country('A', 100, 74, { observations: [{ ...observation, year }] })] })).toThrow('year');
    }
    expect(() => calculateHealthcareFrontier({ countries: [country('A', 100, 74, { observations: [{ ...observation, totalPerCapita: NaN }] })] })).toThrow('2019 totalPerCapita');
    expect(() => calculateHealthcareFrontier({ countries: [country('A', 100, 74, { observations: [{ ...observation, publicPerCapita: -1 }] })] })).toThrow('2019 publicPerCapita');
  });
});
