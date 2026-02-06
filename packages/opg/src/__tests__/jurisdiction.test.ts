import { describe, it, expect } from 'vitest';
import {
  JurisdictionTypeSchema,
  JurisdictionSchema,
  US_STATES,
  type JurisdictionType,
  type Jurisdiction,
  type USState,
} from '../jurisdiction.js';

// ─── JurisdictionTypeSchema ─────────────────────────────────────────────────

describe('JurisdictionTypeSchema', () => {
  const validTypes: JurisdictionType[] = ['country', 'state', 'county', 'city', 'region'];

  it('accepts all 5 valid jurisdiction types', () => {
    for (const type of validTypes) {
      expect(JurisdictionTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it('rejects invalid jurisdiction type', () => {
    expect(JurisdictionTypeSchema.safeParse('province').success).toBe(false);
    expect(JurisdictionTypeSchema.safeParse('').success).toBe(false);
    expect(JurisdictionTypeSchema.safeParse(42).success).toBe(false);
  });

  it('types match hierarchical model: country > state > county > city', () => {
    expect(validTypes).toContain('country');
    expect(validTypes).toContain('state');
    expect(validTypes).toContain('county');
    expect(validTypes).toContain('city');
    expect(validTypes).toContain('region');
  });
});

// ─── JurisdictionSchema ─────────────────────────────────────────────────────

describe('JurisdictionSchema', () => {
  it('validates a minimal jurisdiction', () => {
    const result = JurisdictionSchema.safeParse({
      id: 'US',
      name: 'United States',
      type: 'country',
    });
    expect(result.success).toBe(true);
  });

  it('validates a full jurisdiction with all fields', () => {
    const result = JurisdictionSchema.safeParse({
      id: 'TX',
      name: 'Texas',
      type: 'state',
      parentId: 'US',
      isoCode: 'US-TX',
      population: 29500000,
      gdpPerCapita: 65000,
      dataQualityScore: 0.85,
      latitude: 31.0,
      longitude: -97.0,
    });
    expect(result.success).toBe(true);
  });

  it('validates country-level jurisdiction', () => {
    const result = JurisdictionSchema.safeParse({
      id: 'US',
      name: 'United States',
      type: 'country',
      isoCode: 'US',
      population: 330000000,
      gdpPerCapita: 72000,
    });
    expect(result.success).toBe(true);
  });

  it('validates city-level jurisdiction with parent', () => {
    const result = JurisdictionSchema.safeParse({
      id: 'austin-tx',
      name: 'Austin',
      type: 'city',
      parentId: 'TX',
      population: 1000000,
    });
    expect(result.success).toBe(true);
  });

  it('validates EU region', () => {
    const result = JurisdictionSchema.safeParse({
      id: 'DE-BY',
      name: 'Bavaria',
      type: 'region',
      parentId: 'DE',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing id', () => {
    expect(JurisdictionSchema.safeParse({
      name: 'Texas',
      type: 'state',
    }).success).toBe(false);
  });

  it('rejects missing name', () => {
    expect(JurisdictionSchema.safeParse({
      id: 'TX',
      type: 'state',
    }).success).toBe(false);
  });

  it('rejects missing type', () => {
    expect(JurisdictionSchema.safeParse({
      id: 'TX',
      name: 'Texas',
    }).success).toBe(false);
  });

  it('rejects invalid type', () => {
    expect(JurisdictionSchema.safeParse({
      id: 'TX',
      name: 'Texas',
      type: 'province',
    }).success).toBe(false);
  });

  it('rejects dataQualityScore > 1', () => {
    expect(JurisdictionSchema.safeParse({
      id: 'TX',
      name: 'Texas',
      type: 'state',
      dataQualityScore: 1.5,
    }).success).toBe(false);
  });

  it('rejects dataQualityScore < 0', () => {
    expect(JurisdictionSchema.safeParse({
      id: 'TX',
      name: 'Texas',
      type: 'state',
      dataQualityScore: -0.1,
    }).success).toBe(false);
  });

  it('accepts edge values for dataQualityScore (0 and 1)', () => {
    expect(JurisdictionSchema.safeParse({
      id: 'a', name: 'A', type: 'state', dataQualityScore: 0,
    }).success).toBe(true);
    expect(JurisdictionSchema.safeParse({
      id: 'b', name: 'B', type: 'state', dataQualityScore: 1,
    }).success).toBe(true);
  });

  it('accepts empty string id and name (no min constraint)', () => {
    const result = JurisdictionSchema.safeParse({
      id: '',
      name: '',
      type: 'country',
    });
    expect(result.success).toBe(true);
  });
});

// ─── US_STATES ──────────────────────────────────────────────────────────────

describe('US_STATES', () => {
  it('contains exactly 50 states', () => {
    expect(US_STATES).toHaveLength(50);
  });

  it('contains Texas (TX)', () => {
    expect(US_STATES).toContain('TX');
  });

  it('contains California (CA)', () => {
    expect(US_STATES).toContain('CA');
  });

  it('contains all major states from the paper examples', () => {
    // States referenced in the OPG paper worked examples
    const paperStates: USState[] = ['TX', 'FL', 'CA', 'VT', 'NY'];
    for (const state of paperStates) {
      expect(US_STATES).toContain(state);
    }
  });

  it('entries are all 2-letter codes', () => {
    for (const state of US_STATES) {
      expect(state).toHaveLength(2);
      expect(state).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('has no duplicates', () => {
    const unique = new Set(US_STATES);
    expect(unique.size).toBe(US_STATES.length);
  });

  it('is ordered by full state name (AL=Alabama first, WY=Wyoming last)', () => {
    // US_STATES is sorted by full state name, not by abbreviation
    // Alabama (AL), Alaska (AK), Arizona (AZ), Arkansas (AR), ...
    expect(US_STATES[0]).toBe('AL'); // Alabama
    expect(US_STATES[1]).toBe('AK'); // Alaska
    expect(US_STATES[49]).toBe('WY'); // Wyoming
  });

  it('first state is AL (Alabama)', () => {
    expect(US_STATES[0]).toBe('AL');
  });

  it('last state is WY (Wyoming)', () => {
    expect(US_STATES[49]).toBe('WY');
  });
});
