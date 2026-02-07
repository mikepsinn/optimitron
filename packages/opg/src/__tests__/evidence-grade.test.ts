import { describe, expect, it } from 'vitest';
import { derivePolicyEvidenceGrade } from '../evidence-grade.js';

describe('derivePolicyEvidenceGrade', () => {
  it('returns grade A for strong causal confidence and prediction', () => {
    expect(derivePolicyEvidenceGrade(0.8, 0.6)).toBe('A');
  });

  it('returns grade B or C for moderate evidence', () => {
    const grade = derivePolicyEvidenceGrade(0.3, 0.2);
    expect(['B', 'C']).toContain(grade);
  });

  it('returns grade F for zero evidence', () => {
    expect(derivePolicyEvidenceGrade(0.0, 0.0)).toBe('F');
  });
});
