import { describe, it, expect } from 'vitest';
import {
  PairwiseComparisonSchema,
  ItemSchema,
  MatrixEntrySchema,
  PreferenceWeightSchema,
  AlignmentScoreSchema,
  PreferenceGapSchema,
} from '../types.js';

// =====================================================================
// PairwiseComparisonSchema
// =====================================================================
describe('PairwiseComparisonSchema', () => {
  const validComparison = {
    id: 'comp-1',
    participantId: 'user-1',
    itemAId: 'medical_research',
    itemBId: 'military',
    allocationA: 85,
    timestamp: Date.now(),
  };

  it('validates a correct comparison', () => {
    const result = PairwiseComparisonSchema.safeParse(validComparison);
    expect(result.success).toBe(true);
  });

  it('accepts string timestamp', () => {
    const result = PairwiseComparisonSchema.safeParse({
      ...validComparison,
      timestamp: '2026-01-15T10:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional responseTimeMs', () => {
    const result = PairwiseComparisonSchema.safeParse({
      ...validComparison,
      responseTimeMs: 3500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.responseTimeMs).toBe(3500);
    }
  });

  it('rejects allocationA > 100', () => {
    const result = PairwiseComparisonSchema.safeParse({
      ...validComparison,
      allocationA: 150,
    });
    expect(result.success).toBe(false);
  });

  it('rejects allocationA < 0', () => {
    const result = PairwiseComparisonSchema.safeParse({
      ...validComparison,
      allocationA: -10,
    });
    expect(result.success).toBe(false);
  });

  it('accepts allocationA = 0 (all to B)', () => {
    const result = PairwiseComparisonSchema.safeParse({
      ...validComparison,
      allocationA: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts allocationA = 100 (all to A)', () => {
    const result = PairwiseComparisonSchema.safeParse({
      ...validComparison,
      allocationA: 100,
    });
    expect(result.success).toBe(true);
  });

  it('accepts allocationA = 50 (equal split)', () => {
    const result = PairwiseComparisonSchema.safeParse({
      ...validComparison,
      allocationA: 50,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = PairwiseComparisonSchema.safeParse({
      id: 'comp-1',
      // missing participantId, itemAId, itemBId, allocationA, timestamp
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric allocationA', () => {
    const result = PairwiseComparisonSchema.safeParse({
      ...validComparison,
      allocationA: 'fifty',
    });
    expect(result.success).toBe(false);
  });
});

// =====================================================================
// ItemSchema
// =====================================================================
describe('ItemSchema', () => {
  it('validates a complete item', () => {
    const result = ItemSchema.safeParse({
      id: 'medical_research',
      name: 'Medical Research (NIH)',
      description: 'Funding for NIH and medical research',
      category: 'health',
      currentAllocationUsd: 47_000_000_000,
      currentAllocationPct: 5.2,
    });
    expect(result.success).toBe(true);
  });

  it('validates minimal item (only required fields)', () => {
    const result = ItemSchema.safeParse({
      id: 'defense',
      name: 'National Defense',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing id', () => {
    const result = ItemSchema.safeParse({
      name: 'Defense',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = ItemSchema.safeParse({
      id: 'defense',
    });
    expect(result.success).toBe(false);
  });
});

// =====================================================================
// MatrixEntrySchema
// =====================================================================
describe('MatrixEntrySchema', () => {
  it('validates a correct entry', () => {
    const result = MatrixEntrySchema.safeParse({
      itemAId: 'medical',
      itemBId: 'military',
      ratio: 5.667,
      count: 1000,
      stdDev: 12.5,
    });
    expect(result.success).toBe(true);
  });

  it('validates entry without optional stdDev', () => {
    const result = MatrixEntrySchema.safeParse({
      itemAId: 'A',
      itemBId: 'B',
      ratio: 1.0,
      count: 1,
    });
    expect(result.success).toBe(true);
  });

  it('accepts ratio < 1 (B preferred over A)', () => {
    const result = MatrixEntrySchema.safeParse({
      itemAId: 'A',
      itemBId: 'B',
      ratio: 0.2,
      count: 50,
    });
    expect(result.success).toBe(true);
  });

  it('accepts ratio = 1 (equal preference)', () => {
    const result = MatrixEntrySchema.safeParse({
      itemAId: 'A',
      itemBId: 'B',
      ratio: 1.0,
      count: 10,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing ratio', () => {
    const result = MatrixEntrySchema.safeParse({
      itemAId: 'A',
      itemBId: 'B',
      count: 10,
    });
    expect(result.success).toBe(false);
  });
});

// =====================================================================
// PreferenceWeightSchema
// =====================================================================
describe('PreferenceWeightSchema', () => {
  it('validates a correct weight', () => {
    const result = PreferenceWeightSchema.safeParse({
      itemId: 'medical',
      weight: 0.45,
      rank: 1,
      ciLow: 0.40,
      ciHigh: 0.50,
    });
    expect(result.success).toBe(true);
  });

  it('validates without optional CI fields', () => {
    const result = PreferenceWeightSchema.safeParse({
      itemId: 'defense',
      weight: 0.25,
      rank: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects weight > 1', () => {
    const result = PreferenceWeightSchema.safeParse({
      itemId: 'A',
      weight: 1.5,
      rank: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects weight < 0', () => {
    const result = PreferenceWeightSchema.safeParse({
      itemId: 'A',
      weight: -0.1,
      rank: 1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts weight = 0', () => {
    const result = PreferenceWeightSchema.safeParse({
      itemId: 'A',
      weight: 0,
      rank: 5,
    });
    expect(result.success).toBe(true);
  });

  it('accepts weight = 1', () => {
    const result = PreferenceWeightSchema.safeParse({
      itemId: 'A',
      weight: 1,
      rank: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive rank', () => {
    const result = PreferenceWeightSchema.safeParse({
      itemId: 'A',
      weight: 0.5,
      rank: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer rank', () => {
    const result = PreferenceWeightSchema.safeParse({
      itemId: 'A',
      weight: 0.5,
      rank: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

// =====================================================================
// AlignmentScoreSchema
// =====================================================================
describe('AlignmentScoreSchema', () => {
  it('validates a correct alignment score', () => {
    const result = AlignmentScoreSchema.safeParse({
      politicianId: 'sen-123',
      score: 78.5,
      votesCompared: 15,
      categoryScores: {
        medical: 95,
        defense: 60,
        education: 80,
      },
    });
    expect(result.success).toBe(true);
  });

  it('validates without optional categoryScores', () => {
    const result = AlignmentScoreSchema.safeParse({
      politicianId: 'rep-456',
      score: 45,
      votesCompared: 10,
    });
    expect(result.success).toBe(true);
  });

  it('rejects score > 100', () => {
    const result = AlignmentScoreSchema.safeParse({
      politicianId: 'a',
      score: 105,
      votesCompared: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects score < 0', () => {
    const result = AlignmentScoreSchema.safeParse({
      politicianId: 'a',
      score: -5,
      votesCompared: 1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts score = 0 (total misalignment)', () => {
    const result = AlignmentScoreSchema.safeParse({
      politicianId: 'a',
      score: 0,
      votesCompared: 5,
    });
    expect(result.success).toBe(true);
  });

  it('accepts score = 100 (perfect alignment)', () => {
    const result = AlignmentScoreSchema.safeParse({
      politicianId: 'a',
      score: 100,
      votesCompared: 5,
    });
    expect(result.success).toBe(true);
  });
});

// =====================================================================
// PreferenceGapSchema
// =====================================================================
describe('PreferenceGapSchema', () => {
  it('validates a correct preference gap', () => {
    const result = PreferenceGapSchema.safeParse({
      itemId: 'medical',
      itemName: 'Medical Research (NIH)',
      preferredPct: 40,
      actualPct: 5,
      gapPct: 35,
      gapUsd: 350_000_000_000,
    });
    expect(result.success).toBe(true);
  });

  it('validates without optional gapUsd', () => {
    const result = PreferenceGapSchema.safeParse({
      itemId: 'defense',
      itemName: 'National Defense',
      preferredPct: 20,
      actualPct: 50,
      gapPct: -30,
    });
    expect(result.success).toBe(true);
  });

  it('accepts negative gapPct (overfunded)', () => {
    const result = PreferenceGapSchema.safeParse({
      itemId: 'mil',
      itemName: 'Military',
      preferredPct: 25,
      actualPct: 60,
      gapPct: -35,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gapPct).toBe(-35);
    }
  });

  it('accepts zero gap (perfectly aligned)', () => {
    const result = PreferenceGapSchema.safeParse({
      itemId: 'edu',
      itemName: 'Education',
      preferredPct: 30,
      actualPct: 30,
      gapPct: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = PreferenceGapSchema.safeParse({
      itemId: 'A',
      // missing itemName, preferredPct, actualPct, gapPct
    });
    expect(result.success).toBe(false);
  });
});
