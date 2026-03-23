/**
 * Citizen Alignment Scoring
 * 
 * Compares aggregated citizen preference weights to politician voting records
 * to produce Citizen Alignment Scores.
 * 
 * @see https://wishocracy.warondisease.org — Wishocracy paper (Citizen Alignment Score)
 * @see https://optimocracy.warondisease.org — Optimocracy paper (welfare function)
 * 
 * @see Wishocracy paper: "Citizen Alignment Scores" section
 */

import type { PreferenceWeight, AlignmentScore, PreferenceGap } from './types.js';

/**
 * Gap, in percentage points, at which a single category is treated as fully
 * misaligned. Public budgets are finite, so a 25-point miss already implies a
 * materially different governing priority mix.
 */
export const FULL_MISALIGNMENT_GAP_PCT = 25;

/**
 * Convert a percentage-point gap into a bounded alignment score in [0, 1].
 * Small misses remain visible, while very large misses saturate at 0.
 */
export function scoreCategoryAlignment(
  preferredPct: number,
  votedPct: number,
  fullMisalignmentGapPct: number = FULL_MISALIGNMENT_GAP_PCT,
): number {
  if (fullMisalignmentGapPct <= 0) {
    return preferredPct === votedPct ? 1 : 0;
  }

  const gapPct = Math.abs(preferredPct - votedPct);
  return Math.max(0, 1 - gapPct / fullMisalignmentGapPct);
}

/**
 * Calculate Citizen Alignment Score for a politician
 * 
 * Compares how a politician's votes align with citizen preferences.
 * Score = weighted average of min(preferred, voted) / max(preferred, voted) per category
 */
export function calculateAlignmentScore(
  citizenPreferences: PreferenceWeight[],
  politicianVotes: Map<string, number>, // itemId → allocation % they voted for
  politicianId: string
): AlignmentScore {
  let totalWeightedAlignment = 0;
  let totalWeight = 0;
  let votesCompared = 0;
  const itemScores: Record<string, number> = {};

  for (const pref of citizenPreferences) {
    const votedPct = politicianVotes.get(pref.itemId);

    if (votedPct === undefined) continue;

    votesCompared++;

    const preferredPct = pref.weight * 100;
    const itemAlignment = scoreCategoryAlignment(preferredPct, votedPct);
    const weight = pref.weight;

    totalWeightedAlignment += itemAlignment * weight;
    totalWeight += weight;

    itemScores[pref.itemId] = itemAlignment * 100;
  }

  // If no votes were compared, alignment is unknown — return 0
  if (votesCompared === 0) {
    return { politicianId, score: 0, votesCompared: 0, itemScores };
  }

  // Weighted average of per-category alignment ratios
  const score = totalWeight > 0
    ? (totalWeightedAlignment / totalWeight) * 100
    : 0;
  
  return {
    politicianId,
    score,
    votesCompared,
    itemScores,
  };
}

/**
 * Calculate preference gaps between citizen preferences and actual allocation
 */
export function calculatePreferenceGaps(
  citizenPreferences: PreferenceWeight[],
  items: Array<{ id: string; name: string; currentAllocationPct?: number; currentAllocationUsd?: number }>,
  totalBudgetUsd?: number
): PreferenceGap[] {
  const gaps: PreferenceGap[] = [];
  
  for (const pref of citizenPreferences) {
    const item = items.find(i => i.id === pref.itemId);
    if (!item) continue;
    
    const preferredPct = pref.weight * 100;
    const actualPct = item.currentAllocationPct ?? 0;
    const gapPct = preferredPct - actualPct;
    
    gaps.push({
      itemId: pref.itemId,
      itemName: item.name,
      preferredPct,
      actualPct,
      gapPct,
      gapUsd: totalBudgetUsd ? (gapPct / 100) * totalBudgetUsd : undefined,
    });
  }
  
  return gaps.sort((a, b) => Math.abs(b.gapPct) - Math.abs(a.gapPct)); // Largest gaps first
}

/**
 * Rank politicians by alignment score
 */
export function rankPoliticians(scores: AlignmentScore[]): AlignmentScore[] {
  return [...scores].sort((a, b) => b.score - a.score);
}
