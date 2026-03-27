import { describe, it, expect } from 'vitest';
import {
  validateMeasurement,
  clampMeasurement,
  getValidRange,
} from '../measurement-validation';

// ---------------------------------------------------------------------------
// validateMeasurement — valid values
// ---------------------------------------------------------------------------

describe('validateMeasurement — valid values', () => {
  it('accepts normal heart rate', () => {
    const result = validateMeasurement(72, 'Heart Rate', 'bpm');
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('accepts normal blood pressure', () => {
    expect(validateMeasurement(120, 'Blood Pressure Systolic', 'mmHg').valid).toBe(true);
    expect(validateMeasurement(80, 'Blood Pressure Diastolic', 'mmHg').valid).toBe(true);
  });

  it('accepts normal weight', () => {
    expect(validateMeasurement(75, 'Weight', 'kg').valid).toBe(true);
  });

  it('accepts normal blood oxygen', () => {
    expect(validateMeasurement(98, 'Blood Oxygen', '%').valid).toBe(true);
  });

  it('accepts normal body temperature', () => {
    expect(validateMeasurement(98.6, 'Body Temperature', '°F').valid).toBe(true);
  });

  it('accepts normal step count', () => {
    expect(validateMeasurement(10000, 'Steps', 'count').valid).toBe(true);
  });

  it('accepts unknown variable (no bounds to check)', () => {
    expect(validateMeasurement(42, 'Some Custom Variable', 'count').valid).toBe(true);
  });

  it('accepts zero for count units', () => {
    expect(validateMeasurement(0, 'Steps', 'count').valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateMeasurement — unit constraint violations
// ---------------------------------------------------------------------------

describe('validateMeasurement — unit constraints', () => {
  it('rejects percent above 100', () => {
    const result = validateMeasurement(150, 'Blood Oxygen', '%');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/exceeds unit maximum/i);
    expect(result.correctedValue).toBe(100);
  });

  it('rejects negative percent', () => {
    const result = validateMeasurement(-5, 'Body Fat Percentage', '%');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/below unit minimum/i);
    expect(result.correctedValue).toBe(0);
  });

  it('rejects ratio above 1', () => {
    const result = validateMeasurement(1.5, 'Some Ratio', 'ratio');
    expect(result.valid).toBe(false);
    expect(result.correctedValue).toBe(1);
  });

  it('rejects negative weight', () => {
    const result = validateMeasurement(-10, 'Weight', 'kg');
    expect(result.valid).toBe(false);
    expect(result.correctedValue).toBe(0);
  });

  it('rejects rating above scale max', () => {
    const result = validateMeasurement(6, 'Mood', '1-5');
    expect(result.valid).toBe(false);
    expect(result.correctedValue).toBe(5);
  });

  it('rejects rating below scale min', () => {
    const result = validateMeasurement(0, 'Mood', '1-5');
    expect(result.valid).toBe(false);
    expect(result.correctedValue).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// validateMeasurement — variable bound violations
// ---------------------------------------------------------------------------

describe('validateMeasurement — variable bounds', () => {
  it('rejects heart rate above 300', () => {
    const result = validateMeasurement(500, 'Heart Rate', 'bpm');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/exceeds maximum/);
    expect(result.correctedValue).toBe(300);
  });

  it('rejects heart rate below 20', () => {
    const result = validateMeasurement(5, 'Heart Rate', 'bpm');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/below minimum/);
    expect(result.correctedValue).toBe(20);
  });

  it('rejects blood oxygen below 50', () => {
    const result = validateMeasurement(10, 'Blood Oxygen', '%');
    expect(result.valid).toBe(false);
    expect(result.correctedValue).toBe(50);
  });

  it('rejects sleep duration above 24 hours', () => {
    const result = validateMeasurement(30, 'Sleep Duration', 'h');
    expect(result.valid).toBe(false);
    expect(result.correctedValue).toBe(24);
  });

  it('rejects steps above 200000', () => {
    const result = validateMeasurement(500000, 'Steps', 'count');
    expect(result.valid).toBe(false);
    expect(result.correctedValue).toBe(200000);
  });
});

// ---------------------------------------------------------------------------
// validateMeasurement — NaN and Infinity
// ---------------------------------------------------------------------------

describe('validateMeasurement — non-finite values', () => {
  it('rejects NaN', () => {
    const result = validateMeasurement(NaN, 'Heart Rate', 'bpm');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/not a finite number/);
  });

  it('rejects Infinity', () => {
    const result = validateMeasurement(Infinity, 'Weight', 'kg');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/not a finite number/);
  });

  it('rejects -Infinity', () => {
    const result = validateMeasurement(-Infinity, 'Steps', 'count');
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clampMeasurement
// ---------------------------------------------------------------------------

describe('clampMeasurement', () => {
  it('returns valid value unchanged', () => {
    expect(clampMeasurement(72, 'Heart Rate', 'bpm')).toBe(72);
  });

  it('clamps to maximum', () => {
    expect(clampMeasurement(500, 'Heart Rate', 'bpm')).toBe(300);
  });

  it('clamps to minimum', () => {
    expect(clampMeasurement(5, 'Heart Rate', 'bpm')).toBe(20);
  });

  it('clamps percent to 0-100', () => {
    expect(clampMeasurement(150, 'Blood Oxygen', '%')).toBe(100);
    expect(clampMeasurement(-5, 'Body Fat Percentage', '%')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getValidRange
// ---------------------------------------------------------------------------

describe('getValidRange', () => {
  it('returns combined unit + variable bounds for Heart Rate', () => {
    const range = getValidRange('Heart Rate', 'bpm');
    // bpm has no unit-level min/max, but variable bounds are 20-300
    expect(range.min).toBe(20);
    expect(range.max).toBe(300);
  });

  it('returns unit bounds for percent with unknown variable', () => {
    const range = getValidRange('Custom Percentage', '%');
    expect(range.min).toBe(0);
    expect(range.max).toBe(100);
  });

  it('returns tighter bounds when both unit and variable constrain', () => {
    // Blood Oxygen: unit % has max=100, variable has max=100 (same)
    // and variable has min=50, unit has min=0 → tighter is 50
    const range = getValidRange('Blood Oxygen', '%');
    expect(range.min).toBe(50);
    expect(range.max).toBe(100);
  });

  it('returns undefined for unknown variable and unit', () => {
    const range = getValidRange('Unknown Thing', 'unknown_unit');
    expect(range.min).toBeUndefined();
    expect(range.max).toBeUndefined();
  });
});
