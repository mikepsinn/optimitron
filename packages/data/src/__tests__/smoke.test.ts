import { describe, it, expect } from 'vitest';
import {
  VERSION,
  JurisdictionCodeSchema,
  TimePeriodSchema,
  DataPointSchema,
} from '../index.js';

describe('@optimitron/data smoke tests', () => {
  it('exports a version string', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('JurisdictionCodeSchema validates correct input', () => {
    const result = JurisdictionCodeSchema.safeParse({
      iso3: 'USA',
      iso2: 'US',
      name: 'United States',
      type: 'country',
    });
    expect(result.success).toBe(true);
  });

  it('JurisdictionCodeSchema rejects invalid iso3 length', () => {
    const result = JurisdictionCodeSchema.safeParse({
      iso3: 'US',
      name: 'United States',
      type: 'country',
    });
    expect(result.success).toBe(false);
  });

  it('TimePeriodSchema validates correct range', () => {
    const result = TimePeriodSchema.safeParse({
      startYear: 2018,
      endYear: 2023,
    });
    expect(result.success).toBe(true);
  });

  it('TimePeriodSchema rejects years out of range', () => {
    const result = TimePeriodSchema.safeParse({
      startYear: 1800,
      endYear: 2023,
    });
    expect(result.success).toBe(false);
  });

  it('DataPointSchema validates a complete data point', () => {
    const result = DataPointSchema.safeParse({
      jurisdictionIso3: 'GBR',
      year: 2022,
      value: 45000,
      source: 'OECD',
    });
    expect(result.success).toBe(true);
  });
});
