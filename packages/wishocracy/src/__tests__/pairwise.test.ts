import { describe, it, expect } from 'vitest';
import {
  aggregateComparisons,
  buildComparisonMatrix,
  consistencyRatio,
  principalEigenvector,
} from '../pairwise.js';
import type { PairwiseComparison, MatrixEntry } from '../types.js';

// ─── Helper: create a PairwiseComparison ─────────────────────────────
function comp(
  participantId: string,
  itemAId: string,
  itemBId: string,
  allocationA: number,
  id?: string,
): PairwiseComparison {
  return {
    id: id ?? `${participantId}-${itemAId}-${itemBId}`,
    participantId,
    itemAId,
    itemBId,
    allocationA,
    timestamp: Date.now(),
  };
}

// =====================================================================
// aggregateComparisons
// =====================================================================
describe('aggregateComparisons', () => {
  it('returns empty array for no input', () => {
    expect(aggregateComparisons([])).toEqual([]);
  });

  it('computes geometric mean ratio for a single comparison', () => {
    // Alice: 85% Medical Research, 15% Military → ratio = 85/15 ≈ 5.667
    const entries = aggregateComparisons([
      comp('alice', 'medical', 'military', 85),
    ]);
    expect(entries).toHaveLength(1);
    const entry = entries[0]!;
    expect(entry.itemAId).toBe('medical');
    expect(entry.itemBId).toBe('military');
    expect(entry.ratio).toBeCloseTo(85 / 15, 2);
    expect(entry.count).toBe(1);
  });

  it('computes geometric mean across multiple participants', () => {
    // Items are normalized alphabetically: "education" < "health"
    // So the pair key is education:health, and ratio = allocEducation/allocHealth
    // Participant 1: health=80 → education=20, ratio = 20/80 = 0.25
    // Participant 2: health=60 → education=40, ratio = 40/60 = 0.667
    // Geometric mean = sqrt(0.25 * 0.667) ≈ 0.408
    const entries = aggregateComparisons([
      comp('u1', 'health', 'education', 80),
      comp('u2', 'health', 'education', 60),
    ]);
    expect(entries).toHaveLength(1);
    // Normalized pair: education:health → ratio = education/health
    expect(entries[0]!.ratio).toBeCloseTo(Math.sqrt((20 / 80) * (40 / 60)), 2);
    expect(entries[0]!.count).toBe(2);
  });

  it('handles reversed item order correctly', () => {
    // u1 says A=health, B=education, allocationA=70 → health gets 70
    // u2 says A=education, B=health, allocationA=40 → education gets 40, so health gets 60
    // Ratios (health/education): 70/30 ≈ 2.333, 60/40 = 1.5
    // Geometric mean = sqrt(2.333 * 1.5) ≈ 1.871
    const entries = aggregateComparisons([
      comp('u1', 'health', 'education', 70),
      comp('u2', 'education', 'health', 40),
    ]);
    expect(entries).toHaveLength(1);
    // Normalized key is "education:health" (alphabetical)
    const entry = entries[0]!;
    expect(entry.itemAId).toBe('education');
    expect(entry.itemBId).toBe('health');
    // For the normalized pair (education, health):
    // u1: A=health, B=education, allocationA=70 → allocA for education = 100-70 = 30
    // u2: A=education, B=health, allocationA=40 → allocA for education = 40
    // Ratios (education/health): 30/70 ≈ 0.429, 40/60 ≈ 0.667
    // Geometric mean = sqrt(0.429 * 0.667) ≈ 0.535
    expect(entry.ratio).toBeCloseTo(Math.sqrt((30 / 70) * (40 / 60)), 2);
  });

  it('50/50 split yields ratio of 1', () => {
    const entries = aggregateComparisons([
      comp('u1', 'A', 'B', 50),
    ]);
    expect(entries[0]!.ratio).toBeCloseTo(1.0, 4);
  });

  it('handles extreme allocations (100/0) with epsilon clamping', () => {
    // 100/0 allocation — code clamps to max(alloc, 0.5)
    // A < B alphabetically, so pair is A:B, ratio = allocA/allocB
    // allocA = 100, allocB = 0 → safeA = 100, safeB = 0.5
    // ratio = 100 / 0.5 = 200
    const entries = aggregateComparisons([
      comp('u1', 'A', 'B', 100),
    ]);
    expect(entries[0]!.ratio).toBeCloseTo(200, 0);
    expect(entries[0]!.ratio).toBeGreaterThan(1);
  });

  it('handles 0/100 allocation', () => {
    // allocationA = 0 → safeA = 0.5, safeB = 99.5
    // ratio = 0.5 / 99.5 ≈ 0.005
    const entries = aggregateComparisons([
      comp('u1', 'A', 'B', 0),
    ]);
    expect(entries[0]!.ratio).toBeCloseTo(0.5 / 99.5, 4);
    expect(entries[0]!.ratio).toBeLessThan(1);
  });

  it('groups multiple distinct pairs separately', () => {
    const entries = aggregateComparisons([
      comp('u1', 'health', 'education', 70),
      comp('u1', 'defense', 'education', 40),
      comp('u2', 'health', 'education', 60),
    ]);
    expect(entries).toHaveLength(2);
    const healthEd = entries.find(e =>
      (e.itemAId === 'education' && e.itemBId === 'health') ||
      (e.itemAId === 'health' && e.itemBId === 'education')
    )!;
    const defenseEd = entries.find(e =>
      (e.itemAId === 'defense' && e.itemBId === 'education') ||
      (e.itemAId === 'education' && e.itemBId === 'defense')
    )!;
    expect(healthEd.count).toBe(2);
    expect(defenseEd.count).toBe(1);
  });

  it('computes standard deviation of allocations', () => {
    // All same allocation → stdDev = 0
    const entries = aggregateComparisons([
      comp('u1', 'A', 'B', 60),
      comp('u2', 'A', 'B', 60),
      comp('u3', 'A', 'B', 60),
    ]);
    expect(entries[0]!.stdDev).toBeCloseTo(0, 4);
  });

  it('computes nonzero standard deviation for varying allocations', () => {
    const entries = aggregateComparisons([
      comp('u1', 'A', 'B', 80),
      comp('u2', 'A', 'B', 20),
    ]);
    // Mean = 50, variance = ((80-50)² + (20-50)²) / 2 = 900, stdDev = 30
    expect(entries[0]!.stdDev).toBeCloseTo(30, 4);
  });

  // ── Alice federal budget scenario from the paper ──
  it('Alice scenario: Medical Research vs Military (85/15)', () => {
    const entries = aggregateComparisons([
      comp('alice', 'medical_research', 'military', 85),
    ]);
    const entry = entries[0]!;
    // ratio should be 85/15 = 5.667
    expect(entry.ratio).toBeCloseTo(85 / 15, 2);
  });

  it('Alice scenario: Military vs Drug Enforcement (60/40)', () => {
    // Alphabetical: "drug_enforcement" < "military" → pair is drug_enforcement:military
    // Alice says itemA=military, itemB=drug_enforcement, allocationA=60
    // Since military !== drug_enforcement (the normalized first), allocA for drug_enforcement = 100-60 = 40
    // ratio = 40/60 = 0.667 (drug_enforcement/military)
    const entries = aggregateComparisons([
      comp('alice', 'military', 'drug_enforcement', 60),
    ]);
    expect(entries[0]!.itemAId).toBe('drug_enforcement');
    expect(entries[0]!.itemBId).toBe('military');
    expect(entries[0]!.ratio).toBeCloseTo(40 / 60, 2);
  });
});

// =====================================================================
// buildComparisonMatrix
// =====================================================================
describe('buildComparisonMatrix', () => {
  it('returns identity matrix when no entries provided', () => {
    const matrix = buildComparisonMatrix(['A', 'B', 'C'], []);
    expect(matrix).toEqual([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ]);
  });

  it('builds a 2x2 reciprocal matrix', () => {
    const entries: MatrixEntry[] = [
      { itemAId: 'A', itemBId: 'B', ratio: 3, count: 5 },
    ];
    const matrix = buildComparisonMatrix(['A', 'B'], entries);
    expect(matrix[0]![0]).toBe(1); // diagonal
    expect(matrix[1]![1]).toBe(1);
    expect(matrix[0]![1]).toBe(3); // A vs B
    expect(matrix[1]![0]).toBeCloseTo(1 / 3, 6); // reciprocal
  });

  it('builds a 3x3 matrix with reciprocal property', () => {
    const entries: MatrixEntry[] = [
      { itemAId: 'A', itemBId: 'B', ratio: 5, count: 10 },
      { itemAId: 'A', itemBId: 'C', ratio: 2, count: 8 },
      { itemAId: 'B', itemBId: 'C', ratio: 0.4, count: 7 },
    ];
    const items = ['A', 'B', 'C'];
    const matrix = buildComparisonMatrix(items, entries);

    // Verify reciprocal property: m[i][j] * m[j][i] = 1
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(matrix[i]![j]! * matrix[j]![i]!).toBeCloseTo(1, 6);
      }
    }

    // Verify specific values
    expect(matrix[0]![1]).toBe(5);    // A vs B
    expect(matrix[1]![0]).toBeCloseTo(1 / 5, 6);
    expect(matrix[0]![2]).toBe(2);    // A vs C
    expect(matrix[2]![0]).toBeCloseTo(1 / 2, 6);
    expect(matrix[1]![2]).toBe(0.4);  // B vs C
    expect(matrix[2]![1]).toBeCloseTo(1 / 0.4, 6);
  });

  it('ignores entries with unknown item IDs', () => {
    const entries: MatrixEntry[] = [
      { itemAId: 'A', itemBId: 'UNKNOWN', ratio: 3, count: 1 },
    ];
    const matrix = buildComparisonMatrix(['A', 'B'], entries);
    // Should not crash, unknown pair ignored, matrix stays default
    expect(matrix[0]![1]).toBe(1);
  });

  it('handles single item (1x1 identity)', () => {
    const matrix = buildComparisonMatrix(['A'], []);
    expect(matrix).toEqual([[1]]);
  });
});

// =====================================================================
// principalEigenvector
// =====================================================================
describe('principalEigenvector', () => {
  it('returns equal weights for identity matrix', () => {
    const matrix = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ];
    const weights = principalEigenvector(matrix);
    expect(weights).toHaveLength(3);
    for (const w of weights) {
      expect(w).toBeCloseTo(1 / 3, 6);
    }
  });

  it('weights always sum to 1', () => {
    const matrix = [
      [1, 3, 5],
      [1 / 3, 1, 2],
      [1 / 5, 1 / 2, 1],
    ];
    const weights = principalEigenvector(matrix);
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('higher preferred items get higher weights', () => {
    // A is strongly preferred over B, B slightly over C
    const matrix = [
      [1, 5, 9],
      [1 / 5, 1, 3],
      [1 / 9, 1 / 3, 1],
    ];
    const weights = principalEigenvector(matrix);
    expect(weights[0]!).toBeGreaterThan(weights[1]!);
    expect(weights[1]!).toBeGreaterThan(weights[2]!);
  });

  it('2x2 matrix produces correct weights', () => {
    // A is 3x preferred over B
    // Expected: w_A / w_B = 3, w_A + w_B = 1
    // w_A = 3/4, w_B = 1/4
    const matrix = [
      [1, 3],
      [1 / 3, 1],
    ];
    const weights = principalEigenvector(matrix);
    expect(weights[0]!).toBeCloseTo(0.75, 4);
    expect(weights[1]!).toBeCloseTo(0.25, 4);
  });

  it('1x1 matrix returns [1]', () => {
    const weights = principalEigenvector([[1]]);
    expect(weights).toEqual([1]);
  });

  it('handles perfectly consistent matrix', () => {
    // Perfectly consistent: a_ij = w_i / w_j
    // Weights: A=0.5, B=0.3, C=0.2
    const w = [0.5, 0.3, 0.2];
    const matrix = w.map((wi, i) =>
      w.map((wj, _j) => wi / wj)
    );
    const computed = principalEigenvector(matrix);
    for (let i = 0; i < 3; i++) {
      expect(computed[i]!).toBeCloseTo(w[i]!, 4);
    }
  });

  it('converges for large consistent matrix (5x5)', () => {
    const w = [0.4, 0.25, 0.15, 0.12, 0.08];
    const matrix = w.map((wi) => w.map((wj) => wi / wj));
    const computed = principalEigenvector(matrix);
    const sum = computed.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
    for (let i = 0; i < 5; i++) {
      expect(computed[i]!).toBeCloseTo(w[i]!, 3);
    }
  });

  // ── Alice scenario: derive weights from her comparisons ──
  it('Alice scenario: eigenvector reflects preference ordering Medical > Military > DEA', () => {
    // From Alice's comparisons:
    // Medical vs Military: 85/15 → ratio = 5.667
    // Military vs DEA: 60/40 → ratio = 1.5
    // Transitive: Medical vs DEA ≈ 5.667 * 1.5 = 8.5
    const medMil = 85 / 15;
    const milDea = 60 / 40;
    const medDea = medMil * milDea; // transitivity

    const matrix = [
      [1, medMil, medDea],
      [1 / medMil, 1, milDea],
      [1 / medDea, 1 / milDea, 1],
    ];

    const weights = principalEigenvector(matrix);
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);

    // Medical > Military > DEA
    expect(weights[0]!).toBeGreaterThan(weights[1]!);
    expect(weights[1]!).toBeGreaterThan(weights[2]!);

    // Medical should get the lion's share
    expect(weights[0]!).toBeGreaterThan(0.5);
  });
});

// =====================================================================
// consistencyRatio
// =====================================================================
describe('consistencyRatio', () => {
  it('returns 0 for 1x1 matrix', () => {
    expect(consistencyRatio([[1]])).toBe(0);
  });

  it('returns 0 for 2x2 matrix (always consistent)', () => {
    const matrix = [
      [1, 5],
      [1 / 5, 1],
    ];
    expect(consistencyRatio(matrix)).toBe(0);
  });

  it('perfectly consistent matrix has CR = 0', () => {
    // Perfectly consistent: a_ij * a_jk = a_ik for all i,j,k
    const w = [0.6, 0.3, 0.1];
    const matrix = w.map((wi) => w.map((wj) => wi / wj));
    const cr = consistencyRatio(matrix);
    expect(cr).toBeCloseTo(0, 4);
  });

  it('consistent matrix has CR < 0.1 (Saaty threshold)', () => {
    // Slightly imperfect but still consistent
    const matrix = [
      [1, 3, 5],
      [1 / 3, 1, 2],
      [1 / 5, 1 / 2, 1],
    ];
    const cr = consistencyRatio(matrix);
    expect(cr).toBeLessThan(0.1);
    expect(cr).toBeGreaterThanOrEqual(0);
  });

  it('highly inconsistent matrix has CR > 0.1', () => {
    // Contradictory: A >> B, B >> C, but C >> A (circular)
    const matrix = [
      [1, 9, 1 / 9],
      [1 / 9, 1, 9],
      [9, 1 / 9, 1],
    ];
    const cr = consistencyRatio(matrix);
    expect(cr).toBeGreaterThan(0.1);
  });

  it('Alice scenario: perfectly transitive comparisons have CR ≈ 0', () => {
    const medMil = 85 / 15;
    const milDea = 60 / 40;
    const medDea = medMil * milDea;
    const matrix = [
      [1, medMil, medDea],
      [1 / medMil, 1, milDea],
      [1 / medDea, 1 / milDea, 1],
    ];
    const cr = consistencyRatio(matrix);
    expect(cr).toBeCloseTo(0, 4);
  });

  it('CR for 4x4 consistent matrix is < 0.1', () => {
    const w = [0.4, 0.3, 0.2, 0.1];
    const matrix = w.map((wi) => w.map((wj) => wi / wj));
    const cr = consistencyRatio(matrix);
    expect(cr).toBeCloseTo(0, 4);
  });

  it('CR for 4x4 moderately inconsistent matrix', () => {
    // Somewhat inconsistent but acceptable
    const matrix = [
      [1, 3, 5, 7],
      [1 / 3, 1, 3, 5],
      [1 / 5, 1 / 3, 1, 3],
      [1 / 7, 1 / 5, 1 / 3, 1],
    ];
    const cr = consistencyRatio(matrix);
    // This is a classic Saaty example — should be consistent
    expect(cr).toBeLessThan(0.1);
  });
});

// =====================================================================
// End-to-end: aggregateComparisons → buildComparisonMatrix → eigenvector
// =====================================================================
describe('end-to-end pipeline', () => {
  it('Alice scenario: full pipeline with all pairs produces correct ordering', () => {
    const items = ['medical_research', 'military', 'drug_enforcement'];

    // Alice's comparisons from the paper plus the transitive inference
    // Medical vs Military: 85/15
    // Military vs Drug Enforcement: 60/40
    // Medical vs Drug Enforcement: transitively ~89.4/10.6 (85/15 * 60/40 = 8.5:1)
    // As allocation: 8.5/(8.5+1) * 100 ≈ 89.5
    const comparisons: PairwiseComparison[] = [
      comp('alice', 'medical_research', 'military', 85),
      comp('alice', 'military', 'drug_enforcement', 60),
      comp('alice', 'medical_research', 'drug_enforcement', 89),
    ];

    const entries = aggregateComparisons(comparisons);
    const matrix = buildComparisonMatrix(items, entries);

    const weights = principalEigenvector(matrix);

    // Weights sum to 1
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);

    // Ordering: medical > military > drug enforcement
    expect(weights[0]!).toBeGreaterThan(weights[1]!);
    expect(weights[1]!).toBeGreaterThan(weights[2]!);

    // Medical should dominate (>50%)
    expect(weights[0]!).toBeGreaterThan(0.5);
  });

  it('Alice scenario: 2-of-3 pairs with missing pair defaults to 1', () => {
    const items = ['medical_research', 'military', 'drug_enforcement'];

    // Only 2 of 3 pairs — missing medical vs drug_enforcement defaults to ratio 1
    const comparisons: PairwiseComparison[] = [
      comp('alice', 'medical_research', 'military', 85),
      comp('alice', 'military', 'drug_enforcement', 60),
    ];

    const entries = aggregateComparisons(comparisons);
    const matrix = buildComparisonMatrix(items, entries);
    const weights = principalEigenvector(matrix);

    // Weights sum to 1
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);

    // Medical should still be highest (strong preference over military)
    expect(weights[0]!).toBeGreaterThan(weights[1]!);
    // Drug enforcement gets an artificially equal weight to medical due to missing pair
    // so military < drug_enforcement in this incomplete scenario
  });

  it('multiple participants converge on shared preference', () => {
    const items = ['A', 'B'];
    // All participants strongly prefer A
    const comparisons = [
      comp('u1', 'A', 'B', 80),
      comp('u2', 'A', 'B', 75),
      comp('u3', 'A', 'B', 85),
      comp('u4', 'A', 'B', 70),
    ];

    const entries = aggregateComparisons(comparisons);
    const matrix = buildComparisonMatrix(items, entries);
    const weights = principalEigenvector(matrix);

    expect(weights[0]!).toBeGreaterThan(0.7);
    expect(weights[1]!).toBeLessThan(0.3);
  });

  it('equal preferences produce equal weights', () => {
    const items = ['A', 'B', 'C'];
    const comparisons = [
      comp('u1', 'A', 'B', 50),
      comp('u2', 'A', 'C', 50),
      comp('u3', 'B', 'C', 50),
    ];

    const entries = aggregateComparisons(comparisons);
    const matrix = buildComparisonMatrix(items, entries);
    const weights = principalEigenvector(matrix);

    for (const w of weights) {
      expect(w).toBeCloseTo(1 / 3, 2);
    }
  });

  it('geometric mean preserves reciprocal property in aggregated matrix', () => {
    const items = ['X', 'Y', 'Z'];
    const comparisons = [
      comp('u1', 'X', 'Y', 70),
      comp('u2', 'X', 'Y', 80),
      comp('u1', 'Y', 'Z', 65),
      comp('u2', 'Y', 'Z', 55),
      comp('u1', 'X', 'Z', 90),
      comp('u2', 'X', 'Z', 60),
    ];

    const entries = aggregateComparisons(comparisons);
    const matrix = buildComparisonMatrix(items, entries);

    // Verify reciprocal property
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(matrix[i]![j]! * matrix[j]![i]!).toBeCloseTo(1, 6);
      }
    }
  });
});
