import { describe, it, expect } from 'vitest';
import {
  calculateAlignmentScore,
  calculatePreferenceGaps,
  rankPoliticians,
} from '../alignment.js';
import type { PreferenceWeight, AlignmentScore } from '../types.js';

// ─── Helpers ──────────────────────────────────────────────────────────
function weight(itemId: string, w: number, rank: number): PreferenceWeight {
  return { itemId, weight: w, rank };
}

// =====================================================================
// calculateAlignmentScore
// =====================================================================
describe('calculateAlignmentScore', () => {
  it('perfect alignment yields score of 100', () => {
    const prefs: PreferenceWeight[] = [
      weight('medical', 0.5, 1),
      weight('military', 0.3, 2),
      weight('education', 0.2, 3),
    ];
    // Politician votes exactly match citizen preferences
    const votes = new Map<string, number>([
      ['medical', 50],
      ['military', 30],
      ['education', 20],
    ]);
    const result = calculateAlignmentScore(prefs, votes, 'pol-1');
    expect(result.score).toBeCloseTo(100, 0);
    expect(result.politicianId).toBe('pol-1');
    expect(result.votesCompared).toBe(3);
  });

  it('total misalignment yields low score', () => {
    const prefs: PreferenceWeight[] = [
      weight('medical', 0.8, 1),
      weight('military', 0.2, 2),
    ];
    // Politician votes opposite of citizens
    const votes = new Map<string, number>([
      ['medical', 20],
      ['military', 80],
    ]);
    const result = calculateAlignmentScore(prefs, votes, 'pol-2');
    expect(result.score).toBeLessThan(50);
  });

  it('handles no matching votes (score = 100 default)', () => {
    const prefs: PreferenceWeight[] = [
      weight('medical', 0.5, 1),
    ];
    const votes = new Map<string, number>([
      ['defense', 50],
    ]);
    const result = calculateAlignmentScore(prefs, votes, 'pol-3');
    // No overlapping items → avgWeightedDistance = 0 → score = 100
    expect(result.votesCompared).toBe(0);
    expect(result.score).toBe(100);
  });

  it('partial overlap only compares matching items', () => {
    const prefs: PreferenceWeight[] = [
      weight('medical', 0.5, 1),
      weight('education', 0.3, 2),
      weight('defense', 0.2, 3),
    ];
    const votes = new Map<string, number>([
      ['medical', 50],
      // education and defense not in politician's votes
    ]);
    const result = calculateAlignmentScore(prefs, votes, 'pol-4');
    expect(result.votesCompared).toBe(1);
  });

  it('returns per-category scores', () => {
    const prefs: PreferenceWeight[] = [
      weight('medical', 0.6, 1),
      weight('military', 0.4, 2),
    ];
    const votes = new Map<string, number>([
      ['medical', 60],
      ['military', 40],
    ]);
    const result = calculateAlignmentScore(prefs, votes, 'pol-5');
    expect(result.categoryScores).toBeDefined();
    expect(result.categoryScores!['medical']).toBeDefined();
    expect(result.categoryScores!['military']).toBeDefined();
  });

  it('higher-weighted items have more influence on score', () => {
    // Scenario A: politician misaligns on HIGH-weight item
    const prefs: PreferenceWeight[] = [
      weight('medical', 0.8, 1),
      weight('military', 0.2, 2),
    ];
    const votesA = new Map<string, number>([
      ['medical', 20],   // way off on the 80% item
      ['military', 20],  // matches the 20% item
    ]);
    const scoreA = calculateAlignmentScore(prefs, votesA, 'polA');

    // Scenario B: politician misaligns on LOW-weight item
    const votesB = new Map<string, number>([
      ['medical', 80],   // matches the 80% item
      ['military', 80],  // way off on the 20% item
    ]);
    const scoreB = calculateAlignmentScore(prefs, votesB, 'polB');

    // Politician B should score higher because they align on the item citizens care about more
    expect(scoreB.score).toBeGreaterThan(scoreA.score);
  });

  // ── Alice scenario ──
  it('Alice scenario: politician who increases NIH funding scores higher', () => {
    // Citizen preferences: Medical 60%, Military 25%, DEA 15%
    const prefs: PreferenceWeight[] = [
      weight('medical', 0.60, 1),
      weight('military', 0.25, 2),
      weight('dea', 0.15, 3),
    ];

    // Pro-NIH politician
    const votesProNIH = new Map<string, number>([
      ['medical', 55],
      ['military', 30],
      ['dea', 15],
    ]);

    // Pro-military politician
    const votesProMil = new Map<string, number>([
      ['medical', 20],
      ['military', 60],
      ['dea', 20],
    ]);

    const scoreProNIH = calculateAlignmentScore(prefs, votesProNIH, 'pro-nih');
    const scoreProMil = calculateAlignmentScore(prefs, votesProMil, 'pro-mil');

    expect(scoreProNIH.score).toBeGreaterThan(scoreProMil.score);
  });
});

// =====================================================================
// calculatePreferenceGaps
// =====================================================================
describe('calculatePreferenceGaps', () => {
  it('identifies positive gaps (underfunded items)', () => {
    const prefs: PreferenceWeight[] = [
      weight('medical', 0.4, 1),
      weight('military', 0.3, 2),
      weight('education', 0.3, 3),
    ];
    const items = [
      { id: 'medical', name: 'Medical Research', currentAllocationPct: 10 },
      { id: 'military', name: 'Military', currentAllocationPct: 50 },
      { id: 'education', name: 'Education', currentAllocationPct: 40 },
    ];

    const gaps = calculatePreferenceGaps(prefs, items);
    expect(gaps).toHaveLength(3);

    const medicalGap = gaps.find(g => g.itemId === 'medical')!;
    expect(medicalGap.preferredPct).toBeCloseTo(40);
    expect(medicalGap.actualPct).toBe(10);
    expect(medicalGap.gapPct).toBeCloseTo(30); // underfunded by 30%
  });

  it('identifies negative gaps (overfunded items)', () => {
    const prefs: PreferenceWeight[] = [
      weight('military', 0.2, 1),
    ];
    const items = [
      { id: 'military', name: 'Military', currentAllocationPct: 50 },
    ];
    const gaps = calculatePreferenceGaps(prefs, items);
    expect(gaps[0]!.gapPct).toBeCloseTo(-30); // overfunded by 30%
  });

  it('calculates gap in USD when budget provided', () => {
    const totalBudget = 1_000_000_000_000; // $1T
    const prefs: PreferenceWeight[] = [
      weight('medical', 0.3, 1),
    ];
    const items = [
      { id: 'medical', name: 'Medical Research', currentAllocationPct: 10 },
    ];
    const gaps = calculatePreferenceGaps(prefs, items, totalBudget);
    // Gap = 20% of $1T = $200B
    expect(gaps[0]!.gapUsd).toBeCloseTo(200_000_000_000);
  });

  it('returns undefined gapUsd when no budget provided', () => {
    const prefs: PreferenceWeight[] = [
      weight('A', 0.5, 1),
    ];
    const items = [{ id: 'A', name: 'Item A', currentAllocationPct: 30 }];
    const gaps = calculatePreferenceGaps(prefs, items);
    expect(gaps[0]!.gapUsd).toBeUndefined();
  });

  it('sorts by largest absolute gap first', () => {
    const prefs: PreferenceWeight[] = [
      weight('A', 0.5, 1),
      weight('B', 0.3, 2),
      weight('C', 0.2, 3),
    ];
    const items = [
      { id: 'A', name: 'A', currentAllocationPct: 10 },  // gap = +40
      { id: 'B', name: 'B', currentAllocationPct: 25 },  // gap = +5
      { id: 'C', name: 'C', currentAllocationPct: 65 },  // gap = -45
    ];
    const gaps = calculatePreferenceGaps(prefs, items);
    expect(Math.abs(gaps[0]!.gapPct)).toBeGreaterThanOrEqual(Math.abs(gaps[1]!.gapPct));
    expect(Math.abs(gaps[1]!.gapPct)).toBeGreaterThanOrEqual(Math.abs(gaps[2]!.gapPct));
  });

  it('handles missing items gracefully', () => {
    const prefs: PreferenceWeight[] = [
      weight('A', 0.5, 1),
      weight('MISSING', 0.5, 2),
    ];
    const items = [{ id: 'A', name: 'A', currentAllocationPct: 30 }];
    const gaps = calculatePreferenceGaps(prefs, items);
    expect(gaps).toHaveLength(1);
  });

  it('handles zero actual allocation', () => {
    const prefs: PreferenceWeight[] = [
      weight('A', 0.4, 1),
    ];
    const items = [{ id: 'A', name: 'A', currentAllocationPct: 0 }];
    const gaps = calculatePreferenceGaps(prefs, items);
    expect(gaps[0]!.gapPct).toBeCloseTo(40);
  });

  it('handles items with no currentAllocationPct', () => {
    const prefs: PreferenceWeight[] = [
      weight('A', 0.4, 1),
    ];
    const items = [{ id: 'A', name: 'A' }]; // no currentAllocationPct
    const gaps = calculatePreferenceGaps(prefs, items);
    expect(gaps[0]!.actualPct).toBe(0);
    expect(gaps[0]!.gapPct).toBeCloseTo(40);
  });

  // ── Alice scenario: Preference Gap Report ──
  it('Alice scenario: medical research underfunded, military overfunded', () => {
    // RAPPA aggregate: citizens want 60% medical, 25% military, 15% DEA
    // Actual federal: 5% medical, 60% military, 35% DEA (illustrative)
    const prefs: PreferenceWeight[] = [
      weight('medical', 0.60, 1),
      weight('military', 0.25, 2),
      weight('dea', 0.15, 3),
    ];
    const items = [
      { id: 'medical', name: 'Medical Research (NIH)', currentAllocationPct: 5 },
      { id: 'military', name: 'Military Weapons Systems', currentAllocationPct: 60 },
      { id: 'dea', name: 'Drug Enforcement (DEA)', currentAllocationPct: 35 },
    ];
    const gaps = calculatePreferenceGaps(prefs, items);

    const medicalGap = gaps.find(g => g.itemId === 'medical')!;
    const militaryGap = gaps.find(g => g.itemId === 'military')!;
    const deaGap = gaps.find(g => g.itemId === 'dea')!;

    expect(medicalGap.gapPct).toBeGreaterThan(0);  // underfunded
    expect(militaryGap.gapPct).toBeLessThan(0);     // overfunded
    expect(deaGap.gapPct).toBeLessThan(0);           // overfunded
  });
});

// =====================================================================
// rankPoliticians
// =====================================================================
describe('rankPoliticians', () => {
  it('ranks by score descending', () => {
    const scores: AlignmentScore[] = [
      { politicianId: 'low', score: 30, votesCompared: 5 },
      { politicianId: 'high', score: 90, votesCompared: 5 },
      { politicianId: 'mid', score: 60, votesCompared: 5 },
    ];
    const ranked = rankPoliticians(scores);
    expect(ranked[0]!.politicianId).toBe('high');
    expect(ranked[1]!.politicianId).toBe('mid');
    expect(ranked[2]!.politicianId).toBe('low');
  });

  it('returns empty array for empty input', () => {
    expect(rankPoliticians([])).toEqual([]);
  });

  it('single politician returns as-is', () => {
    const scores: AlignmentScore[] = [
      { politicianId: 'only', score: 75, votesCompared: 3 },
    ];
    const ranked = rankPoliticians(scores);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.politicianId).toBe('only');
  });

  it('does not mutate original array', () => {
    const scores: AlignmentScore[] = [
      { politicianId: 'b', score: 20, votesCompared: 1 },
      { politicianId: 'a', score: 80, votesCompared: 1 },
    ];
    const original = [...scores];
    rankPoliticians(scores);
    expect(scores[0]!.politicianId).toBe(original[0]!.politicianId);
    expect(scores[1]!.politicianId).toBe(original[1]!.politicianId);
  });

  it('handles tied scores', () => {
    const scores: AlignmentScore[] = [
      { politicianId: 'a', score: 50, votesCompared: 5 },
      { politicianId: 'b', score: 50, votesCompared: 3 },
    ];
    const ranked = rankPoliticians(scores);
    expect(ranked).toHaveLength(2);
    // Both should be present regardless of order
    const ids = ranked.map(r => r.politicianId);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });
});
