import { describe, it, expect } from 'vitest';
import {
  ECONOMIC_DATA_CATALOG,
  getCatalogByCategory,
  getCatalogEntry,
  getGapminderFilenames,
} from '../catalog';

describe('ECONOMIC_DATA_CATALOG', () => {
  it('contains a non-empty list of datasets', () => {
    expect(ECONOMIC_DATA_CATALOG.length).toBeGreaterThan(50);
  });

  it('every entry has filename, label, and category', () => {
    for (const entry of ECONOMIC_DATA_CATALOG) {
      expect(entry.filename).toBeTruthy();
      expect(entry.label).toBeTruthy();
      expect(entry.category).toBeTruthy();
    }
  });

  it('all filenames end with .csv', () => {
    for (const entry of ECONOMIC_DATA_CATALOG) {
      expect(entry.filename).toMatch(/\.csv$/);
    }
  });

  it('has no duplicate filenames', () => {
    const filenames = ECONOMIC_DATA_CATALOG.map(e => e.filename);
    const unique = new Set(filenames);
    expect(unique.size).toBe(filenames.length);
  });
});

describe('getCatalogByCategory', () => {
  it('returns only health entries for "health"', () => {
    const health = getCatalogByCategory('health');
    expect(health.length).toBeGreaterThan(5);
    for (const entry of health) {
      expect(entry.category).toBe('health');
    }
  });

  it('returns only energy entries for "energy"', () => {
    const energy = getCatalogByCategory('energy');
    expect(energy.length).toBeGreaterThan(5);
    for (const entry of energy) {
      expect(entry.category).toBe('energy');
    }
  });

  it('returns empty array for unknown category', () => {
    // @ts-expect-error — testing runtime behavior with invalid input
    expect(getCatalogByCategory('nonexistent')).toEqual([]);
  });
});

describe('getCatalogEntry', () => {
  it('finds life expectancy entry', () => {
    const entry = getCatalogEntry('data_health_life_expectancy_years.csv');
    expect(entry).toBeDefined();
    expect(entry!.label).toBe('Life Expectancy');
    expect(entry!.category).toBe('health');
    expect(entry!.unit).toBe('years');
  });

  it('returns undefined for unknown filename', () => {
    expect(getCatalogEntry('does_not_exist.csv')).toBeUndefined();
  });
});

describe('getGapminderFilenames', () => {
  it('returns only data_ prefixed files', () => {
    const filenames = getGapminderFilenames();
    expect(filenames.length).toBeGreaterThan(20);
    for (const f of filenames) {
      expect(f).toMatch(/^data_/);
    }
  });

  it('does not include non-gapminder files', () => {
    const filenames = getGapminderFilenames();
    expect(filenames).not.toContain('merged-country-data.csv');
    expect(filenames).not.toContain('us_dollar_value.csv');
  });
});
