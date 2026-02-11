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
 * Calculate Citizen Alignment Score for a politician
 * 
 * Compares how a politician's votes align with citizen preferences.
 * Score = 1 - (weighted distance between preference and voting vectors)
 */
export function calculateAlignmentScore(
  citizenPreferences: PreferenceWeight[],
  politicianVotes: Map<string, number>, // itemId → allocation % they voted for
  politicianId: string
): AlignmentScore {
  let totalWeightedDistance = 0;
  let totalWeight = 0;
  let votesCompared = 0;
  const categoryScores: Record<string, number> = {};
  
  for (const pref of citizenPreferences) {
    const votedPct = politicianVotes.get(pref.itemId);

    if (votedPct === undefined) continue;

    votesCompared++;

    // Relative distance: |preferredPct - votedPct| / preferredPct, capped at 1.0.
    // A politician who votes 10% for a 5% category is 100% off (distance = 1.0),
    // while one who votes 6% for a 5% category is 20% off (distance = 0.2).
    // This spreads scores meaningfully instead of compressing to ~99%.
    // Capping at 1.0 prevents small categories from dominating the score
    // (a 20% category voted at 80% would be 300% off uncapped, but capped = 1.0).
    const preferredPct = pref.weight * 100;
    const relativeDistance = preferredPct > 0
      ? Math.min(1, Math.abs(preferredPct - votedPct) / preferredPct)
      : 0;
    const weight = pref.weight; // Items citizens care more about weigh more

    totalWeightedDistance += relativeDistance * weight;
    totalWeight += weight;

    // Per-item alignment (0-100%) using relative distance (already capped at 1)
    const itemAlignment = (1 - relativeDistance) * 100;
    categoryScores[pref.itemId] = Math.max(0, Math.min(100, itemAlignment));
  }
  
  // If no votes were compared, alignment is unknown — return 0
  if (votesCompared === 0) {
    return { politicianId, score: 0, votesCompared: 0, categoryScores };
  }

  // Overall alignment: 100% = perfect match, 0% = total misalignment
  // avgWeightedDistance is now relative (0 = perfect, 1 = 100% off, >1 = more than 100% off)
  const avgWeightedDistance = totalWeight > 0 ? totalWeightedDistance / totalWeight : 0;
  const score = Math.max(0, Math.min(100, (1 - avgWeightedDistance) * 100));
  
  return {
    politicianId,
    score,
    votesCompared,
    categoryScores,
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
