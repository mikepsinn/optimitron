/**
 * Golden Path Demo — Tests
 *
 * Validates the complete golden path pipeline:
 *   - Pipeline completes without errors
 *   - Known causal relationships are recovered
 *   - Effect sizes are in reasonable ranges
 *   - Reports contain expected sections
 *   - JSON output has correct structure
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { FullAnalysisResult } from '@optomitron/optimizer';

// We import the exported function that runs everything except file I/O
import { runGoldenPathDemo } from '../health-optimization-demo.js';

// ─── Run once, share across all tests ────────────────────────────────

let results: Array<{ pair: { label: string; expectedDirection: string }; result: FullAnalysisResult }>;
let markdownReport: string;
let jsonOutput: ReturnType<typeof runGoldenPathDemo>['jsonOutput'];

beforeAll(() => {
  const output = runGoldenPathDemo();
  results = output.results;
  markdownReport = output.markdownReport;
  jsonOutput = output.jsonOutput;
});

// ─── Helper to find a result by label ────────────────────────────────

function findResult(labelSubstring: string) {
  const found = results.find((r) => r.pair.label.includes(labelSubstring));
  if (!found) throw new Error(`No result matching "${labelSubstring}"`);
  return found;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('Golden Path Demo — Pipeline Execution', () => {
  it('should complete the full pipeline without errors', () => {
    expect(results).toBeDefined();
    expect(results.length).toBe(4);
  });

  it('should analyze all 4 predictor-outcome pairs', () => {
    const labels = results.map((r) => r.pair.label);
    expect(labels).toContain('Vitamin D → Mood');
    expect(labels).toContain('Sleep → Mood');
    expect(labels).toContain('Coffee → Sleep');
    expect(labels).toContain('Vitamin D → Sleep');
  });

  it('should produce at least 30 aligned pairs for each analysis', () => {
    for (const { result } of results) {
      expect(result.numberOfPairs).toBeGreaterThanOrEqual(30);
    }
  });

  it('should pass data quality validation for all pairs', () => {
    for (const { result } of results) {
      expect(result.dataQuality.isValid).toBe(true);
      expect(result.dataQuality.hasPredicorVariance).toBe(true);
      expect(result.dataQuality.hasOutcomeVariance).toBe(true);
    }
  });
});

describe('Golden Path Demo — Causal Relationship Recovery', () => {
  it('should find at least 3 significant relationships (p < 0.05)', () => {
    const significantCount = results.filter(
      ({ result }) => result.pValue < 0.05,
    ).length;
    expect(significantCount).toBeGreaterThanOrEqual(3);
  });

  it('should find Vitamin D → Mood as a positive correlation', () => {
    const { result } = findResult('Vitamin D → Mood');
    expect(result.forwardPearson).toBeGreaterThan(0);
  });

  it('should find Sleep → Mood as a positive correlation', () => {
    const { result } = findResult('Sleep → Mood');
    expect(result.forwardPearson).toBeGreaterThan(0);
  });

  it('should find Coffee → Sleep as a negative correlation', () => {
    const { result } = findResult('Coffee → Sleep');
    expect(result.forwardPearson).toBeLessThan(0);
  });

  it('should detect correct direction for each expected relationship', () => {
    for (const { pair, result } of results) {
      const isPositive = result.forwardPearson >= 0;
      const expectedPositive = pair.expectedDirection === 'positive';
      expect(isPositive).toBe(expectedPositive);
    }
  });
});

describe('Golden Path Demo — Effect Sizes', () => {
  it('should produce Vitamin D → Mood effect in reasonable range (1-50%)', () => {
    const { result } = findResult('Vitamin D → Mood');
    const absEffect = Math.abs(result.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline);
    expect(absEffect).toBeGreaterThan(1);
    expect(absEffect).toBeLessThan(50);
  });

  it('should produce Coffee → Sleep effect in reasonable range (0.5-30%)', () => {
    const { result } = findResult('Coffee → Sleep');
    const absEffect = Math.abs(result.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline);
    expect(absEffect).toBeGreaterThan(0.5);
    expect(absEffect).toBeLessThan(30);
  });

  it('should have valid Pearson r values in [-1, 1] for all results', () => {
    for (const { result } of results) {
      expect(result.forwardPearson).toBeGreaterThanOrEqual(-1);
      expect(result.forwardPearson).toBeLessThanOrEqual(1);
      expect(result.reversePearson).toBeGreaterThanOrEqual(-1);
      expect(result.reversePearson).toBeLessThanOrEqual(1);
    }
  });

  it('should assign valid evidence grades (A-F) to all results', () => {
    const validGrades = ['A', 'B', 'C', 'D', 'F'];
    for (const { result } of results) {
      expect(validGrades).toContain(result.pis.evidenceGrade);
    }
  });

  it('should produce PIS scores in valid range (0 to ~2)', () => {
    for (const { result } of results) {
      expect(result.pis.score).toBeGreaterThanOrEqual(0);
      expect(result.pis.score).toBeLessThan(2);
    }
  });

  it('should have Bradford Hill scores in [0, 1] for all criteria', () => {
    for (const { result } of results) {
      const bh = result.bradfordHill;
      for (const key of ['strength', 'consistency', 'temporality', 'experiment', 'plausibility', 'coherence', 'analogy', 'specificity'] as const) {
        expect(bh[key]).toBeGreaterThanOrEqual(0);
        expect(bh[key]).toBeLessThanOrEqual(1);
      }
      if (bh.gradient !== null) {
        expect(bh.gradient).toBeGreaterThanOrEqual(0);
        expect(bh.gradient).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('Golden Path Demo — Markdown Report', () => {
  it('should contain an executive summary', () => {
    expect(markdownReport).toContain('Executive Summary');
  });

  it('should contain key findings section', () => {
    expect(markdownReport).toContain('Key Findings');
  });

  it('should contain recommendations section', () => {
    expect(markdownReport).toContain('Recommendations');
  });

  it('should contain data quality notes section', () => {
    expect(markdownReport).toContain('Data Quality');
  });

  it('should contain methodology section', () => {
    expect(markdownReport).toContain('Methodology');
  });

  it('should mention all four analyzed relationships', () => {
    expect(markdownReport).toContain('Vitamin D');
    expect(markdownReport).toContain('Mood');
    expect(markdownReport).toContain('Sleep');
    expect(markdownReport).toContain('Coffee');
  });

  it('should contain evidence grade indicators', () => {
    expect(markdownReport).toMatch(/Evidence Grade.*[ABCDF]/);
  });
});

describe('Golden Path Demo — JSON Output Structure', () => {
  it('should have correct top-level structure', () => {
    expect(jsonOutput.generatedAt).toBeTruthy();
    expect(jsonOutput.dataDays).toBe(180);
    expect(Array.isArray(jsonOutput.relationships)).toBe(true);
    expect(jsonOutput.relationships.length).toBe(4);
  });

  it('should have all required fields for each relationship', () => {
    for (const rel of jsonOutput.relationships) {
      expect(typeof rel.predictor).toBe('string');
      expect(typeof rel.outcome).toBe('string');
      expect(typeof rel.label).toBe('string');
      expect(typeof rel.forwardPearson).toBe('number');
      expect(typeof rel.reversePearson).toBe('number');
      expect(typeof rel.predictivePearson).toBe('number');
      expect(typeof rel.pValue).toBe('number');
      expect(typeof rel.effectPercentChange).toBe('number');
      expect(typeof rel.optimalDailyValue).toBe('number');
      expect(typeof rel.numberOfPairs).toBe('number');
      expect(typeof rel.evidenceGrade).toBe('string');
      expect(typeof rel.pisScore).toBe('number');
      expect(typeof rel.recommendation).toBe('string');
    }
  });

  it('should have valid Bradford Hill sub-object for each relationship', () => {
    for (const rel of jsonOutput.relationships) {
      expect(rel.bradfordHill).toBeDefined();
      expect(typeof rel.bradfordHill.strength).toBe('number');
      expect(typeof rel.bradfordHill.consistency).toBe('number');
      expect(typeof rel.bradfordHill.temporality).toBe('number');
      expect(typeof rel.bradfordHill.experiment).toBe('number');
    }
  });

  it('should have valid dataQuality sub-object for each relationship', () => {
    for (const rel of jsonOutput.relationships) {
      expect(rel.dataQuality).toBeDefined();
      expect(typeof rel.dataQuality.isValid).toBe('boolean');
      expect(typeof rel.dataQuality.pairCount).toBe('number');
      expect(rel.dataQuality.pairCount).toBeGreaterThan(0);
    }
  });
});
