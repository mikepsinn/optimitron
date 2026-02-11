/**
 * Budget Preference Pipeline — End-to-end Integration Test
 *
 * Full Wishocracy + OBG pipeline:
 *   Create 10 budget items
 *   → Generate 50 pairwise comparisons from 5 participant archetypes
 *   → Run eigenvector aggregation
 *   → Calculate consistency ratio
 *   → Generate preference weights
 *   → Run gap analysis against real budget
 *   → Calculate Welfare Evidence Scores
 *   → Assert weights sum to 1, CR < 0.1, etc.
 */

import { describe, it, expect } from 'vitest';
import {
  type PairwiseComparison,
  type Item,
  type PreferenceWeight,
  aggregateComparisons,
  buildComparisonMatrix,
  principalEigenvector,
  consistencyRatio,
  calculatePreferenceGaps,
} from '@optomitron/wishocracy';
import {
  calculateWES,
  type EffectEstimate,
  calculatePriorityScore,
} from '@optomitron/obg';

// ─── Helpers ─────────────────────────────────────────────────────────

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

// ─── Test data ───────────────────────────────────────────────────────

interface BudgetCategory extends Item {
  currentAllocationPct: number;
}

const TOTAL_BUDGET_USD = 1_000_000_000; // $1B city budget

const categories: BudgetCategory[] = [
  { id: 'public_safety',  name: 'Public Safety',           currentAllocationPct: 25.0 },
  { id: 'education',      name: 'Education',               currentAllocationPct: 20.0 },
  { id: 'healthcare',     name: 'Healthcare',              currentAllocationPct: 15.0 },
  { id: 'infrastructure', name: 'Infrastructure',          currentAllocationPct: 12.0 },
  { id: 'parks',          name: 'Parks & Recreation',      currentAllocationPct: 5.0 },
  { id: 'housing',        name: 'Affordable Housing',      currentAllocationPct: 8.0 },
  { id: 'transit',        name: 'Public Transit',          currentAllocationPct: 7.0 },
  { id: 'environment',    name: 'Environment',             currentAllocationPct: 3.0 },
  { id: 'arts',           name: 'Arts & Culture',          currentAllocationPct: 2.0 },
  { id: 'admin',          name: 'General Administration',  currentAllocationPct: 3.0 },
];

interface VoterArchetype {
  name: string;
  count: number;
  ideals: Record<string, number>;
}

const archetypes: VoterArchetype[] = [
  {
    name: 'Safety First',
    count: 10,
    ideals: {
      public_safety: 30, education: 15, healthcare: 12, infrastructure: 10,
      parks: 3, housing: 8, transit: 8, environment: 5, arts: 2, admin: 7,
    },
  },
  {
    name: 'Education Advocate',
    count: 12,
    ideals: {
      public_safety: 10, education: 30, healthcare: 15, infrastructure: 8,
      parks: 5, housing: 8, transit: 7, environment: 8, arts: 5, admin: 4,
    },
  },
  {
    name: 'Green Progressive',
    count: 8,
    ideals: {
      public_safety: 8, education: 15, healthcare: 18, infrastructure: 10,
      parks: 8, housing: 12, transit: 10, environment: 12, arts: 4, admin: 3,
    },
  },
  {
    name: 'Fiscal Conservative',
    count: 10,
    ideals: {
      public_safety: 22, education: 18, healthcare: 10, infrastructure: 15,
      parks: 3, housing: 5, transit: 8, environment: 3, arts: 1, admin: 15,
    },
  },
  {
    name: 'Balanced Moderate',
    count: 10,
    ideals: {
      public_safety: 18, education: 18, healthcare: 14, infrastructure: 11,
      parks: 5, housing: 9, transit: 8, environment: 6, arts: 4, admin: 7,
    },
  },
];

function generateComparisons(
  participantId: string,
  ideals: Record<string, number>,
  rng: () => number,
  pairsPerVoter: number = 10,
): PairwiseComparison[] {
  const itemIds = categories.map(c => c.id);
  const comparisons: PairwiseComparison[] = [];

  for (let p = 0; p < pairsPerVoter; p++) {
    const iA = Math.floor(rng() * itemIds.length);
    let iB = Math.floor(rng() * (itemIds.length - 1));
    if (iB >= iA) iB++;

    const idA = itemIds[iA]!;
    const idB = itemIds[iB]!;
    const idealA = ideals[idA] ?? 10;
    const idealB = ideals[idB] ?? 10;

    const totalIdeal = idealA + idealB;
    const rawSplit = totalIdeal > 0 ? (idealA / totalIdeal) * 100 : 50;

    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 5;
    const allocationA = Math.max(1, Math.min(99, Math.round(rawSplit + noise)));

    comparisons.push({
      id: `comp-${participantId}-${p}`,
      participantId,
      itemAId: idA,
      itemBId: idB,
      allocationA,
      timestamp: Date.now(),
    });
  }

  return comparisons;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('Budget Preference Pipeline — End-to-End', () => {
  const rng = seededRng(42);

  // Step 1: Generate pairwise comparisons from 5 archetypes
  const allComparisons: PairwiseComparison[] = [];
  let voterId = 0;

  for (const archetype of archetypes) {
    for (let v = 0; v < archetype.count; v++) {
      voterId++;
      const pid = `voter-${voterId}`;
      allComparisons.push(...generateComparisons(pid, archetype.ideals, rng));
    }
  }

  describe('Step 1: Pairwise Comparison Generation', () => {
    it('should generate comparisons from 5 archetypes', () => {
      expect(voterId).toBe(50); // 10 + 12 + 8 + 10 + 10
    });

    it('should have 50 total voters × 10 comparisons = ~500 comparisons', () => {
      expect(allComparisons.length).toBe(500);
    });

    it('should have valid comparison format', () => {
      for (const comp of allComparisons.slice(0, 20)) {
        expect(comp.allocationA).toBeGreaterThanOrEqual(1);
        expect(comp.allocationA).toBeLessThanOrEqual(99);
        expect(comp.itemAId).not.toBe(comp.itemBId);
        expect(comp.participantId).toBeTruthy();
      }
    });
  });

  // Step 2: Aggregate into comparison matrix
  const entries = aggregateComparisons(allComparisons);
  const itemIds = categories.map(c => c.id);
  const matrix = buildComparisonMatrix(itemIds, entries);

  describe('Step 2: Eigenvector Aggregation', () => {
    it('should produce aggregated matrix entries', () => {
      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) {
        expect(entry.ratio).toBeGreaterThan(0);
        expect(entry.count).toBeGreaterThan(0);
      }
    });

    it('should build a square comparison matrix', () => {
      expect(matrix.length).toBe(10); // 10 categories
      for (const row of matrix) {
        expect(row.length).toBe(10);
      }
    });

    it('should have 1s on diagonal and reciprocal property', () => {
      for (let i = 0; i < matrix.length; i++) {
        expect(matrix[i]![i]).toBe(1);
        for (let j = 0; j < matrix.length; j++) {
          if (i !== j) {
            const product = matrix[i]![j]! * matrix[j]![i]!;
            expect(product).toBeCloseTo(1, 5);
          }
        }
      }
    });
  });

  // Step 3: Calculate consistency ratio
  const cr = consistencyRatio(matrix);

  describe('Step 3: Consistency Ratio', () => {
    it('should be below 0.1 (acceptable inconsistency threshold)', () => {
      expect(cr).toBeLessThan(0.1);
    });

    it('should be non-negative', () => {
      expect(cr).toBeGreaterThanOrEqual(0);
    });
  });

  // Step 4: Extract preference weights
  const weights = principalEigenvector(matrix);

  describe('Step 4: Preference Weights', () => {
    it('should sum to approximately 1', () => {
      const sum = weights.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });

    it('should have 10 weights (one per category)', () => {
      expect(weights.length).toBe(10);
    });

    it('should all be positive', () => {
      for (const w of weights) {
        expect(w).toBeGreaterThan(0);
      }
    });

    it('should reflect archetype preferences (education and public safety high)', () => {
      const indexed = weights.map((w, i) => ({ id: itemIds[i]!, weight: w }));
      indexed.sort((a, b) => b.weight - a.weight);
      const top3Ids = indexed.slice(0, 3).map(i => i.id);
      // Education and public safety should be in top 3 given archetypes
      expect(
        top3Ids.includes('education') || top3Ids.includes('public_safety'),
      ).toBe(true);
    });
  });

  // Step 5: Build PreferenceWeight array and run gap analysis
  const indexed = weights.map((w, i) => ({ itemId: itemIds[i]!, weight: w }));
  indexed.sort((a, b) => b.weight - a.weight);
  const preferenceWeights: PreferenceWeight[] = indexed.map((pw, rank) => ({
    itemId: pw.itemId,
    weight: pw.weight,
    rank: rank + 1,
  }));

  const gaps = calculatePreferenceGaps(preferenceWeights, categories, TOTAL_BUDGET_USD);

  describe('Step 5: Preference Gap Analysis', () => {
    it('should produce gaps for all categories', () => {
      expect(gaps.length).toBe(10);
    });

    it('should have valid gap structure', () => {
      for (const gap of gaps) {
        expect(gap.itemId).toBeTruthy();
        expect(gap.itemName).toBeTruthy();
        expect(typeof gap.preferredPct).toBe('number');
        expect(typeof gap.actualPct).toBe('number');
        expect(typeof gap.gapPct).toBe('number');
        expect(gap.gapUsd).toBeDefined();
      }
    });

    it('should have gaps that sum to approximately 0 (zero-sum reallocation)', () => {
      const totalGap = gaps.reduce((sum, g) => sum + g.gapPct, 0);
      // Preferred weights sum to 100, actual sums to 100 → gap sums to 0
      expect(totalGap).toBeCloseTo(0, 0);
    });

    it('should be sorted by absolute gap (largest first)', () => {
      for (let i = 1; i < gaps.length; i++) {
        expect(Math.abs(gaps[i - 1]!.gapPct)).toBeGreaterThanOrEqual(
          Math.abs(gaps[i]!.gapPct),
        );
      }
    });

    it('should compute gap in USD', () => {
      for (const gap of gaps) {
        if (gap.gapUsd !== undefined) {
          const expectedUsd = (gap.gapPct / 100) * TOTAL_BUDGET_USD;
          expect(gap.gapUsd).toBeCloseTo(expectedUsd, 0);
        }
      }
    });
  });

  // Step 6: Calculate Welfare Evidence Scores
  describe('Step 6: Welfare Evidence Scores', () => {
    const estimates: EffectEstimate[] = [
      { beta: 0.15, standardError: 0.03, method: 'difference_in_differences', year: 2023 },
      { beta: 0.12, standardError: 0.04, method: 'synthetic_control', year: 2022 },
      { beta: 0.18, standardError: 0.05, method: 'event_study', year: 2024 },
      { beta: 0.10, standardError: 0.06, method: 'before_after', year: 2020 },
    ];

    const wes = calculateWES(estimates, 2025);

    it('should calculate a WES score between 0 and 1', () => {
      expect(wes.score).toBeGreaterThanOrEqual(0);
      expect(wes.score).toBeLessThanOrEqual(1);
    });

    it('should assign a valid evidence grade', () => {
      expect(['A', 'B', 'C', 'D', 'F']).toContain(wes.grade);
    });

    it('should have positive quality, precision, and recency weights', () => {
      expect(wes.qualityWeight).toBeGreaterThan(0);
      expect(wes.precisionWeight).toBeGreaterThan(0);
      expect(wes.recencyWeight).toBeGreaterThan(0);
    });

    it('should count all estimates', () => {
      expect(wes.estimateCount).toBe(4);
    });

    it('should calculate priority scores from gaps and WES', () => {
      for (const gap of gaps.slice(0, 3)) {
        if (gap.gapUsd !== undefined) {
          const priority = calculatePriorityScore(gap.gapUsd, wes.score);
          expect(priority).toBeGreaterThanOrEqual(0);
          expect(typeof priority).toBe('number');
          expect(Number.isFinite(priority)).toBe(true);
        }
      }
    });
  });

  // End-to-end coherence check
  describe('End-to-End Coherence', () => {
    it('should produce a complete, coherent pipeline result', () => {
      // We have 50 voters, 500 comparisons
      expect(allComparisons.length).toBe(500);
      // Weights are valid
      expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
      // Consistency is acceptable
      expect(cr).toBeLessThan(0.1);
      // Gaps exist and are structured
      expect(gaps.length).toBe(10);
      // The pipeline is complete
    });
  });
});
