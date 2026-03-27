import { describe, it, expect } from 'vitest';
import {
  deflateToRealDollars,
  toPerCapita,
  deflateAndPerCapita,
  CPI,
  POPULATION_MILLIONS,
} from './deflate';

describe('deflateToRealDollars', () => {
  it('inflates 1980 dollars to be worth more in 2023 terms', () => {
    // $1B in 1980 should be worth more than $1B in 2023 dollars
    const real = deflateToRealDollars(1, 1980);
    expect(real).toBeGreaterThan(1);
    // Roughly CPI_2023/CPI_1980 = 304.7/82.4 ≈ 3.70
    expect(real).toBeCloseTo(CPI[2023] / CPI[1980], 4);
  });

  it('returns the same value when year equals baseYear (2023)', () => {
    const real = deflateToRealDollars(500, 2023, 2023);
    expect(real).toBe(500);
  });

  it('deflates future-base to older dollars', () => {
    // Express 2023 dollars in 1980 terms → should be less
    const real = deflateToRealDollars(1, 2023, 1980);
    expect(real).toBeLessThan(1);
    expect(real).toBeCloseTo(CPI[1980] / CPI[2023], 4);
  });

  it('throws RangeError for year out of range', () => {
    expect(() => deflateToRealDollars(1, 1949)).toThrow(RangeError);
    expect(() => deflateToRealDollars(1, 2024)).toThrow(RangeError);
  });

  it('throws RangeError for baseYear out of range', () => {
    expect(() => deflateToRealDollars(1, 2000, 2025)).toThrow(RangeError);
  });

  it('throws for non-integer year', () => {
    expect(() => deflateToRealDollars(1, 2000.5)).toThrow(RangeError);
  });
});

describe('toPerCapita', () => {
  it('divides correctly by population', () => {
    // $1B total / 335.0M people = $1,000M / 335.0M ≈ $2.985/person
    const perCap = toPerCapita(1, 2023);
    expect(perCap).toBeCloseTo(1_000 / POPULATION_MILLIONS[2023], 4);
  });

  it('gives higher per-capita for years with lower population', () => {
    const perCap1950 = toPerCapita(1, 1950);
    const perCap2023 = toPerCapita(1, 2023);
    expect(perCap1950).toBeGreaterThan(perCap2023);
  });

  it('throws RangeError for year out of range', () => {
    expect(() => toPerCapita(1, 1940)).toThrow(RangeError);
  });
});

describe('deflateAndPerCapita', () => {
  it('combines deflation and per-capita correctly', () => {
    const combined = deflateAndPerCapita(100, 1980, 2023);
    // Should equal: deflateToRealDollars(100, 1980, 2023) → toPerCapita(result, 1980)
    const realBillions = deflateToRealDollars(100, 1980, 2023);
    const expected = toPerCapita(realBillions, 1980);
    expect(combined).toBeCloseTo(expected, 6);
  });

  it('with baseYear=2023 and year=2023, equals simple per-capita', () => {
    const combined = deflateAndPerCapita(100, 2023, 2023);
    const simple = toPerCapita(100, 2023);
    expect(combined).toBeCloseTo(simple, 6);
  });

  it('throws for out-of-range year', () => {
    expect(() => deflateAndPerCapita(1, 1800)).toThrow(RangeError);
  });
});
