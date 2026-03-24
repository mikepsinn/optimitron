import { describe, it, expect } from 'vitest';
import { describeGrade, fmt, reportTimestamp } from '../report-utils.js';

describe('describeGrade', () => {
  it('describes A as strong causal evidence', () => {
    expect(describeGrade('A')).toBe('Strong causal evidence');
  });

  it('describes B as probable causal relationship', () => {
    expect(describeGrade('B')).toBe('Probable causal relationship');
  });

  it('describes C as possible association', () => {
    expect(describeGrade('C')).toBe('Possible association');
  });

  it('describes D as weak evidence', () => {
    expect(describeGrade('D')).toBe('Weak evidence');
  });

  it('describes F as insufficient evidence', () => {
    expect(describeGrade('F')).toBe('Insufficient evidence');
  });

  it('returns Unknown for unrecognized grade', () => {
    expect(describeGrade('X')).toBe('Unknown');
  });
});

describe('fmt', () => {
  it('formats a finite number with 2 decimal places by default', () => {
    expect(fmt(3.14159)).toBe('3.14');
  });

  it('formats with specified decimal places', () => {
    expect(fmt(3.14159, 1)).toBe('3.1');
    expect(fmt(3.14159, 0)).toBe('3');
    expect(fmt(3.14159, 4)).toBe('3.1416');
  });

  it('returns N/A for Infinity', () => {
    expect(fmt(Infinity)).toBe('N/A');
  });

  it('returns N/A for -Infinity', () => {
    expect(fmt(-Infinity)).toBe('N/A');
  });

  it('returns N/A for NaN', () => {
    expect(fmt(NaN)).toBe('N/A');
  });

  it('formats zero correctly', () => {
    expect(fmt(0)).toBe('0.00');
  });

  it('formats negative numbers', () => {
    expect(fmt(-1.5, 1)).toBe('-1.5');
  });
});

describe('reportTimestamp', () => {
  it('returns a string matching UTC format', () => {
    const ts = reportTimestamp();
    // Format: "YYYY-MM-DD HH:MM:SS UTC"
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/);
  });

  it('ends with UTC', () => {
    expect(reportTimestamp().endsWith(' UTC')).toBe(true);
  });
});
