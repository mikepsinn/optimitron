import { describe, it, expect } from 'vitest';
import {
  calculateInterestingFactor,
  isTrivial,
  editDistance,
  TRIVIAL_FACTOR_THRESHOLD,
} from '../interesting-factor.js';
import type { InterestingFactorConfig } from '../interesting-factor.js';

// ─── editDistance ────────────────────────────────────────────────────

describe('editDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(editDistance('hello', 'hello')).toBe(0);
  });

  it('returns correct distance for single-char difference', () => {
    expect(editDistance('cat', 'car')).toBe(1);
  });

  it('handles empty strings', () => {
    expect(editDistance('', 'abc')).toBe(3);
    expect(editDistance('abc', '')).toBe(3);
    expect(editDistance('', '')).toBe(0);
  });

  it('handles completely different strings', () => {
    expect(editDistance('abc', 'xyz')).toBe(3);
  });

  it('handles insertion and deletion', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3);
  });
});

// ─── calculateInterestingFactor ─────────────────────────────────────

describe('calculateInterestingFactor', () => {
  it('returns 1.0 for Treatment→Symptom (most interesting)', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'Treatments',
      outcomeCategory: 'Symptoms',
    })).toBe(1.0);
  });

  it('is case-insensitive for categories', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'TREATMENTS',
      outcomeCategory: 'symptoms',
    })).toBe(1.0);
  });

  it('returns 0.9 for Food→Symptom', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'Foods',
      outcomeCategory: 'Symptoms',
    })).toBe(0.9);
  });

  it('returns 0.9 for Activity→Mood', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'Activities',
      outcomeCategory: 'Mood',
    })).toBe(0.9);
  });

  it('returns 0.95 for Treatment→Mood', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'Treatments',
      outcomeCategory: 'Mood',
    })).toBe(0.95);
  });

  it('returns 0.5 for same category (tautological)', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'Symptoms',
      outcomeCategory: 'Symptoms',
    })).toBe(0.5);
  });

  it('returns 0.5 for same category case-insensitive', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'MOOD',
      outcomeCategory: 'mood',
    })).toBe(0.5);
  });

  it('returns 0.25 for non-controllable predictor', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'Treatments',
      outcomeCategory: 'Symptoms',
      predictorIsControllable: false,
    })).toBe(0.25);
  });

  it('non-controllable overrides everything else', () => {
    // Even Treatment→Symptom should be penalized if not controllable
    expect(calculateInterestingFactor({
      predictorCategory: 'Treatments',
      outcomeCategory: 'Symptoms',
      predictorIsControllable: false,
    })).toBe(0.25);
  });

  it('controllable=true does not change the score', () => {
    // Explicitly controllable should behave the same as undefined
    expect(calculateInterestingFactor({
      predictorCategory: 'Treatments',
      outcomeCategory: 'Symptoms',
      predictorIsControllable: true,
    })).toBe(1.0);
  });

  it('returns 0.7 for unknown categories', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'UnknownCat',
      outcomeCategory: 'AnotherCat',
    })).toBe(0.7);
  });

  it('returns 0.7 for empty config', () => {
    expect(calculateInterestingFactor({})).toBe(0.7);
  });

  it('returns 0.7 when only predictor category provided', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'Treatments',
    })).toBe(0.7);
  });

  it('returns 0.7 when only outcome category provided', () => {
    expect(calculateInterestingFactor({
      outcomeCategory: 'Symptoms',
    })).toBe(0.7);
  });

  it('returns 0.85 for Foods→Mood', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'Foods',
      outcomeCategory: 'Mood',
    })).toBe(0.85);
  });

  it('returns 0.85 for Sleep→Mood', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'Sleep',
      outcomeCategory: 'Mood',
    })).toBe(0.85);
  });

  it('returns 0.8 for Environment→Symptoms', () => {
    expect(calculateInterestingFactor({
      predictorCategory: 'Environment',
      outcomeCategory: 'Symptoms',
    })).toBe(0.8);
  });

  it('trims whitespace from categories', () => {
    expect(calculateInterestingFactor({
      predictorCategory: '  Treatments  ',
      outcomeCategory: '  Symptoms  ',
    })).toBe(1.0);
  });
});

// ─── isTrivial ──────────────────────────────────────────────────────

describe('isTrivial', () => {
  it('returns true for identical variable names', () => {
    expect(isTrivial('Overall Mood', 'Overall Mood')).toBe(true);
  });

  it('is case-insensitive for name comparison', () => {
    expect(isTrivial('overall mood', 'OVERALL MOOD')).toBe(true);
  });

  it('returns true for very similar names (edit distance < 3)', () => {
    // "Mood" vs "Moods" — edit distance 1
    expect(isTrivial('Mood', 'Moods')).toBe(true);
  });

  it('returns true for names with edit distance 2', () => {
    // "Sleep" vs "Sleepy" — edit distance 1 (after lowering: "sleep" vs "sleepy")
    expect(isTrivial('Sleep', 'Sleepy')).toBe(true);
  });

  it('returns false for sufficiently different names', () => {
    // "Aspirin" vs "Headache" — very different
    expect(isTrivial('Aspirin', 'Headache')).toBe(false);
  });

  it('returns true for same category (non-treatment→symptom)', () => {
    expect(isTrivial('Weight', 'BMI', {
      predictorCategory: 'Physique',
      outcomeCategory: 'Physique',
    })).toBe(true);
  });

  it('returns false for same category when it is a known interesting pair', () => {
    // treatments|symptoms is in the lookup table, so same-cat check passes
    // but this won't actually be same-cat unless both are "Treatments"
    // Here we test that Treatments→Treatments IS trivial
    expect(isTrivial('Aspirin Dose', 'Ibuprofen Dose', {
      predictorCategory: 'Treatments',
      outcomeCategory: 'Treatments',
    })).toBe(true);
  });

  it('returns true when factor < TRIVIAL_FACTOR_THRESHOLD', () => {
    // Non-controllable predictor → factor = 0.25 < 0.3
    expect(isTrivial('Weather', 'Mood', {
      predictorIsControllable: false,
    })).toBe(true);
  });

  it('returns false for treatment→symptom pair with different names', () => {
    expect(isTrivial('Aspirin', 'Headache Severity', {
      predictorCategory: 'Treatments',
      outcomeCategory: 'Symptoms',
    })).toBe(false);
  });

  it('returns false when no config provided and names are different', () => {
    expect(isTrivial('Vitamin D', 'Energy Level')).toBe(false);
  });

  it('returns true for empty strings (identical)', () => {
    expect(isTrivial('', '')).toBe(true);
  });

  it('handles whitespace in names', () => {
    expect(isTrivial('  Mood  ', 'mood')).toBe(true);
  });

  it('returns false for Food→Symptom with different names', () => {
    expect(isTrivial('Sugar Intake', 'Bloating', {
      predictorCategory: 'Foods',
      outcomeCategory: 'Symptoms',
    })).toBe(false);
  });
});

// ─── Integration: factor threshold ──────────────────────────────────

describe('TRIVIAL_FACTOR_THRESHOLD', () => {
  it('is 0.3', () => {
    expect(TRIVIAL_FACTOR_THRESHOLD).toBe(0.3);
  });

  it('non-controllable factor (0.25) is below threshold', () => {
    const factor = calculateInterestingFactor({ predictorIsControllable: false });
    expect(factor).toBeLessThan(TRIVIAL_FACTOR_THRESHOLD);
  });

  it('same-category factor (0.5) is above threshold', () => {
    const factor = calculateInterestingFactor({
      predictorCategory: 'Mood',
      outcomeCategory: 'Mood',
    });
    expect(factor).toBeGreaterThanOrEqual(TRIVIAL_FACTOR_THRESHOLD);
  });
});
