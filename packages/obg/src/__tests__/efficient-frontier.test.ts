import { describe, it, expect } from 'vitest';
import {
  efficientFrontier,
  type EfficiencyCategory,
} from '../efficient-frontier.js';

describe('efficientFrontier', () => {
  it('ranks countries by outcome per dollar (higher is better)', () => {
    const category: EfficiencyCategory = {
      categoryId: 'health',
      categoryName: 'Health',
      countries: [
        { countryCode: 'AAA', countryName: 'Alphaland', spending: 100, outcome: 50 },
        { countryCode: 'BBB', countryName: 'Betaland', spending: 200, outcome: 120 },
        { countryCode: 'CCC', countryName: 'Gammaland', spending: 50, outcome: 10 },
      ],
    };

    const [result] = efficientFrontier([category]);

    expect(result!.rankings.map(r => r.countryCode)).toEqual(['BBB', 'AAA', 'CCC']);
    expect(result!.rankings[0]!.rank).toBe(1);
    expect(result!.rankings[0]!.efficiencyScore).toBeCloseTo(0.6, 6);
  });

  it('supports outcomes where lower is better', () => {
    const category: EfficiencyCategory = {
      categoryId: 'mortality',
      outcomeDirection: 'lower',
      countries: [
        { countryCode: 'AAA', spending: 100, outcome: 5 },
        { countryCode: 'BBB', spending: 80, outcome: 10 },
        { countryCode: 'CCC', spending: 120, outcome: 12 },
      ],
    };

    const [result] = efficientFrontier([category]);

    expect(result!.rankings.map(r => r.countryCode)).toEqual(['AAA', 'BBB', 'CCC']);
    expect(result!.rankings[0]!.efficiencyScore).toBeGreaterThan(
      result!.rankings[1]!.efficiencyScore,
    );
  });

  it('filters non-finite and non-positive values', () => {
    const category: EfficiencyCategory = {
      categoryId: 'invalid',
      countries: [
        { countryCode: 'AAA', spending: Number.NaN, outcome: 10 },
        { countryCode: 'BBB', spending: 0, outcome: 10 },
        { countryCode: 'CCC', spending: 100, outcome: Number.POSITIVE_INFINITY },
        { countryCode: 'DDD', spending: 100, outcome: 20 },
      ],
    };

    const [result] = efficientFrontier([category]);

    expect(result!.rankings).toHaveLength(1);
    expect(result!.rankings[0]!.countryCode).toBe('DDD');
  });

  it('uses outcomeDirection default when not specified', () => {
    const category: EfficiencyCategory = {
      categoryId: 'education',
      countries: [
        { countryCode: 'AAA', spending: 100, outcome: 80 },
        { countryCode: 'BBB', spending: 100, outcome: 90 },
      ],
    };

    const [result] = efficientFrontier([category], { outcomeDirection: 'higher' });

    expect(result!.rankings.map(r => r.countryCode)).toEqual(['BBB', 'AAA']);
  });

  it('breaks ties by outcome then spending then country code', () => {
    const category: EfficiencyCategory = {
      categoryId: 'tie',
      countries: [
        { countryCode: 'BBB', spending: 200, outcome: 100 },
        { countryCode: 'AAA', spending: 100, outcome: 50 },
        { countryCode: 'CCC', spending: 200, outcome: 100 },
      ],
    };

    const [result] = efficientFrontier([category]);

    expect(result!.rankings.map(r => r.countryCode)).toEqual(['BBB', 'CCC', 'AAA']);
  });

  it('returns empty rankings when no valid countries exist', () => {
    const category: EfficiencyCategory = {
      categoryId: 'empty',
      outcomeDirection: 'lower',
      countries: [
        { countryCode: 'AAA', spending: 100, outcome: 0 },
        { countryCode: 'BBB', spending: -50, outcome: 10 },
      ],
    };

    const [result] = efficientFrontier([category]);

    expect(result!.rankings).toEqual([]);
  });
});
