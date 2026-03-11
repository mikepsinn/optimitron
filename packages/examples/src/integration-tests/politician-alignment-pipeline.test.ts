/**
 * Politician Alignment Pipeline — End-to-end Integration Test
 *
 * Full pipeline:
 *   Create 5 politicians with voting records
 *   → Create 100 citizen pairwise comparisons
 *   → Aggregate citizen preferences
 *   → Calculate alignment scores for each politician
 *   → Rank politicians
 *   → Assert scores are in valid range, ranking is consistent
 */

import { describe, it, expect } from 'vitest';
import {
  type PairwiseComparison,
  type Item,
  type PreferenceWeight,
  aggregateComparisons,
  bootstrapConfidenceIntervals,
  buildComparisonMatrix,
  principalEigenvector,
  consistencyRatio,
  calculateAlignmentScore,
  calculatePreferenceGaps,
  rankPoliticians,
  type AlignmentScore,
} from '@optomitron/wishocracy';

// ─── Helpers ─────────────────────────────────────────────────────────

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

// ─── Test data ───────────────────────────────────────────────────────

const categories: Item[] = [
  { id: 'healthcare',      name: 'Healthcare' },
  { id: 'education',       name: 'Education' },
  { id: 'defense',         name: 'Defense' },
  { id: 'environment',     name: 'Environment' },
  { id: 'infrastructure',  name: 'Infrastructure' },
  { id: 'social_safety',   name: 'Social Safety Net' },
  { id: 'tax_reform',      name: 'Tax Reform' },
  { id: 'criminal_justice', name: 'Criminal Justice' },
];

interface Politician {
  id: string;
  name: string;
  party: string;
  votes: Record<string, number>;
}

const politicians: Politician[] = [
  {
    id: 'pol-1',
    name: 'Sen. Aligned Adams',
    party: 'Centrist',
    // Designed to be very close to the expected citizen aggregate
    votes: {
      healthcare: 15, education: 16, defense: 8, environment: 12,
      infrastructure: 12, social_safety: 12, tax_reform: 8, criminal_justice: 17,
    },
  },
  {
    id: 'pol-2',
    name: 'Sen. Hawkish Harris',
    party: 'Defense First',
    // Heavy defense, low social
    votes: {
      healthcare: 5, education: 5, defense: 40, environment: 2,
      infrastructure: 15, social_safety: 3, tax_reform: 15, criminal_justice: 15,
    },
  },
  {
    id: 'pol-3',
    name: 'Rep. Balanced Brown',
    party: 'Moderate',
    // Fairly balanced
    votes: {
      healthcare: 14, education: 14, defense: 10, environment: 10,
      infrastructure: 12, social_safety: 11, tax_reform: 10, criminal_justice: 19,
    },
  },
  {
    id: 'pol-4',
    name: 'Rep. Green Garcia',
    party: 'Progressive',
    votes: {
      healthcare: 18, education: 18, defense: 3, environment: 22,
      infrastructure: 10, social_safety: 15, tax_reform: 5, criminal_justice: 9,
    },
  },
  {
    id: 'pol-5',
    name: 'Gov. Extreme Ellis',
    party: 'Single Issue',
    // Extremely lopsided — should score lowest
    votes: {
      healthcare: 2, education: 2, defense: 2, environment: 2,
      infrastructure: 2, social_safety: 2, tax_reform: 86, criminal_justice: 2,
    },
  },
];

interface CitizenProfile {
  name: string;
  count: number;
  ideals: Record<string, number>;
}

const citizenProfiles: CitizenProfile[] = [
  {
    name: 'Healthcare-focused',
    count: 8,
    ideals: {
      healthcare: 25, education: 15, defense: 5, environment: 12,
      infrastructure: 10, social_safety: 15, tax_reform: 5, criminal_justice: 13,
    },
  },
  {
    name: 'Education-focused',
    count: 7,
    ideals: {
      healthcare: 12, education: 25, defense: 5, environment: 10,
      infrastructure: 10, social_safety: 12, tax_reform: 8, criminal_justice: 18,
    },
  },
  {
    name: 'Balanced',
    count: 10,
    ideals: {
      healthcare: 14, education: 14, defense: 10, environment: 10,
      infrastructure: 12, social_safety: 12, tax_reform: 10, criminal_justice: 18,
    },
  },
  {
    name: 'Security-focused',
    count: 5,
    ideals: {
      healthcare: 8, education: 8, defense: 22, environment: 3,
      infrastructure: 12, social_safety: 5, tax_reform: 15, criminal_justice: 27,
    },
  },
];

function generateComparisons(
  participantId: string,
  ideals: Record<string, number>,
  rng: () => number,
  pairsPerVoter: number = 20,
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
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 6;
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

describe('Politician Alignment Pipeline — End-to-End', () => {
  const rng = seededRng(777);

  // Step 1: Generate citizen comparisons
  const allComparisons: PairwiseComparison[] = [];
  let totalCitizens = 0;

  for (const profile of citizenProfiles) {
    for (let v = 0; v < profile.count; v++) {
      totalCitizens++;
      const pid = `citizen-${totalCitizens}`;
      allComparisons.push(...generateComparisons(pid, profile.ideals, rng));
    }
  }

  describe('Step 1: Citizen Pairwise Comparisons', () => {
    it('should generate comparisons from 30 citizens', () => {
      expect(totalCitizens).toBe(30);
    });

    it('should have 30 × 20 = 600 total comparisons', () => {
      expect(allComparisons.length).toBe(600);
    });
  });

  // Step 2: Aggregate preferences
  const entries = aggregateComparisons(allComparisons);
  const itemIds = categories.map(c => c.id);
  const matrix = buildComparisonMatrix(itemIds, entries);
  const weights = principalEigenvector(matrix);
  const cr = consistencyRatio(matrix);
  const ciResult = bootstrapConfidenceIntervals(allComparisons, {
    iterations: 40,
    seed: 777,
  });

  const indexed = weights.map((w, i) => ({ itemId: itemIds[i]!, weight: w }));
  indexed.sort((a, b) => b.weight - a.weight);
  const preferenceWeights: PreferenceWeight[] = indexed.map((pw, rank) => ({
    itemId: pw.itemId,
    weight: pw.weight,
    rank: rank + 1,
  }));

  describe('Step 2: Preference Aggregation', () => {
    it('should produce valid weights that sum to 1', () => {
      const sum = weights.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });

    it('should have CR below 0.1', () => {
      expect(cr).toBeLessThan(0.1);
    });

    it('should have 8 preference weights (one per category)', () => {
      expect(preferenceWeights.length).toBe(8);
    });

    it('should rank items from 1 to 8', () => {
      const ranks = preferenceWeights.map(pw => pw.rank).sort((a, b) => a - b);
      expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('Step 2b: Preference Weight Confidence Intervals', () => {
    it('should attach confidence intervals to each aggregated preference weight', () => {
      expect(ciResult.weights).toHaveLength(8);
      for (const weight of ciResult.weights) {
        expect(weight.ciLow).toBeDefined();
        expect(weight.ciHigh).toBeDefined();
        expect(weight.weight).toBeGreaterThanOrEqual(weight.ciLow ?? 0);
        expect(weight.weight).toBeLessThanOrEqual(weight.ciHigh ?? 1);
      }
    });
  });

  // Step 3: Calculate alignment scores for each politician
  const alignmentScores: AlignmentScore[] = politicians.map(pol => {
    const voteMap = new Map(Object.entries(pol.votes));
    return calculateAlignmentScore(preferenceWeights, voteMap, pol.id);
  });

  describe('Step 3: Alignment Score Calculation', () => {
    it('should produce scores for all 5 politicians', () => {
      expect(alignmentScores.length).toBe(5);
    });

    it('should produce scores between 0 and 100', () => {
      for (const score of alignmentScores) {
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(100);
      }
    });

    it('should compare votes across all categories', () => {
      for (const score of alignmentScores) {
        expect(score.votesCompared).toBe(8);
      }
    });

    it('should have per-category alignment breakdowns', () => {
      for (const score of alignmentScores) {
        expect(score.categoryScores).toBeDefined();
        if (score.categoryScores) {
          const keys = Object.keys(score.categoryScores);
          expect(keys.length).toBe(8);
          for (const catScore of Object.values(score.categoryScores)) {
            expect(catScore).toBeGreaterThanOrEqual(0);
            expect(catScore).toBeLessThanOrEqual(100);
          }
        }
      }
    });
  });

  // Step 4: Rank politicians
  const ranked = rankPoliticians(alignmentScores);

  describe('Step 4: Politician Ranking', () => {
    it('should rank all 5 politicians', () => {
      expect(ranked.length).toBe(5);
    });

    it('should be sorted by score descending', () => {
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1]!.score).toBeGreaterThanOrEqual(ranked[i]!.score);
      }
    });

    it('should rank the extreme single-issue politician lowest', () => {
      // Gov. Extreme Ellis (86% tax reform) should be least aligned
      const lowestRanked = ranked[ranked.length - 1]!;
      expect(lowestRanked.politicianId).toBe('pol-5');
    });

    it('should rank the centrist/balanced politician higher than the extreme one', () => {
      const centristIdx = ranked.findIndex(s => s.politicianId === 'pol-1');
      const extremeIdx = ranked.findIndex(s => s.politicianId === 'pol-5');
      expect(centristIdx).toBeLessThan(extremeIdx);
    });
  });

  // Step 5: Preference gaps for politicians
  describe('Step 5: Preference Gap Analysis per Politician', () => {
    it('should calculate preference gaps for each politician', () => {
      for (const pol of politicians) {
        const itemsWithAlloc = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          currentAllocationPct: pol.votes[cat.id] ?? 0,
        }));
        const polGaps = calculatePreferenceGaps(preferenceWeights, itemsWithAlloc);
        expect(polGaps.length).toBe(8);
        for (const gap of polGaps) {
          expect(typeof gap.gapPct).toBe('number');
          expect(Number.isFinite(gap.gapPct)).toBe(true);
        }
      }
    });

    it('should show the extreme politician has the largest total gap', () => {
      const gapSums: Array<{ id: string; totalAbsGap: number }> = [];
      for (const pol of politicians) {
        const itemsWithAlloc = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          currentAllocationPct: pol.votes[cat.id] ?? 0,
        }));
        const polGaps = calculatePreferenceGaps(preferenceWeights, itemsWithAlloc);
        const totalAbsGap = polGaps.reduce((sum, g) => sum + Math.abs(g.gapPct), 0);
        gapSums.push({ id: pol.id, totalAbsGap });
      }
      gapSums.sort((a, b) => b.totalAbsGap - a.totalAbsGap);
      // The extreme politician should have the largest total gap
      expect(gapSums[0]!.id).toBe('pol-5');
    });
  });

  // End-to-end coherence
  describe('End-to-End Coherence', () => {
    it('should produce a fully consistent pipeline result', () => {
      // All weights valid
      expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
      // All scores in range
      for (const score of alignmentScores) {
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(100);
      }
      // Rankings are sorted
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1]!.score).toBeGreaterThanOrEqual(ranked[i]!.score);
      }
      // The highest-scoring politician should have a reasonably high score
      expect(ranked[0]!.score).toBeGreaterThan(50);
    });

    it('should differentiate between aligned and misaligned politicians', () => {
      const scoreSpread = ranked[0]!.score - ranked[ranked.length - 1]!.score;
      expect(scoreSpread).toBeGreaterThan(5); // Non-trivial spread
    });
  });
});
