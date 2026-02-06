/**
 * Tests for category normalization in standard-variable-names.ts
 */
import { describe, it, expect } from 'vitest';
import {
  resolveCategory,
  resolveVariableName,
  resolveVariableWithCategory,
  getStandardDefinition,
} from '../../importers/standard-variable-names.js';

// ─── resolveCategory ──────────────────────────────────────────────────

describe('resolveCategory', () => {
  it('normalizes "Vital Signs" (plural) to "Vital Sign" (singular)', () => {
    expect(resolveCategory('Vital Signs')).toBe('Vital Sign');
  });

  it('normalizes "Foods" to "Food"', () => {
    expect(resolveCategory('Foods')).toBe('Food');
  });

  it('normalizes "Nutrients" to "Food"', () => {
    expect(resolveCategory('Nutrients')).toBe('Food');
  });

  it('normalizes "Physique" to "Physical Measurement"', () => {
    expect(resolveCategory('Physique')).toBe('Physical Measurement');
  });

  it('normalizes "Treatments" to "Treatment"', () => {
    expect(resolveCategory('Treatments')).toBe('Treatment');
  });

  it('normalizes "Activities" to "Physical Activity"', () => {
    expect(resolveCategory('Activities')).toBe('Physical Activity');
  });

  it('returns already-canonical categories unchanged', () => {
    expect(resolveCategory('Vital Sign')).toBe('Vital Sign');
    expect(resolveCategory('Food')).toBe('Food');
    expect(resolveCategory('Sleep')).toBe('Sleep');
    expect(resolveCategory('Physical Activity')).toBe('Physical Activity');
  });

  it('handles case-insensitive matching', () => {
    expect(resolveCategory('vital signs')).toBe('Vital Sign');
    expect(resolveCategory('FOODS')).toBe('Food');
    expect(resolveCategory('nutrients')).toBe('Food');
  });

  it('returns unknown categories unchanged', () => {
    expect(resolveCategory('CustomCategory')).toBe('CustomCategory');
    expect(resolveCategory('Unknown')).toBe('Unknown');
  });
});

// ─── resolveVariableWithCategory ──────────────────────────────────────

describe('resolveVariableWithCategory', () => {
  it('returns canonical category for a known variable', () => {
    const result = resolveVariableWithCategory('Heart Rate', 'apple_health');
    expect(result.variableName).toBe('Heart Rate');
    expect(result.category).toBe('Vital Sign');
  });

  it('normalizes category for an unknown variable with a raw category', () => {
    const result = resolveVariableWithCategory('Unknown Metric', 'apple_health', 'Vital Signs');
    expect(result.variableName).toBe('Unknown Metric');
    expect(result.category).toBe('Vital Sign');
  });

  it('returns undefined category for unknown variable with no raw category', () => {
    const result = resolveVariableWithCategory('Unknown Metric', 'apple_health');
    expect(result.variableName).toBe('Unknown Metric');
    expect(result.category).toBeUndefined();
  });

  it('applies importer mapping before category resolution', () => {
    // Fitbit "Daily Step Count" → "Steps" which is in Physical Activity
    const result = resolveVariableWithCategory('Daily Step Count', 'fitbit', 'Activity');
    expect(result.variableName).toBe('Steps');
    expect(result.category).toBe('Physical Activity'); // From STANDARD_VARIABLES
  });

  it('normalizes "Nutrients" category for nutrient variables', () => {
    const result = resolveVariableWithCategory('SomeCustomNutrient', 'cronometer', 'Nutrients');
    expect(result.category).toBe('Food');
  });
});
