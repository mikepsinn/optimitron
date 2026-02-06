/**
 * Citizen Alignment Scoring
 * 
 * Compares aggregated citizen preference weights to politician voting records
 * to produce Citizen Alignment Scores.
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
    
    // Distance: |citizen preference - politician vote|
    // Weighted by citizen preference intensity
    const distance = Math.abs(pref.weight * 100 - votedPct);
    const weight = pref.weight; // Items citizens care more about weigh more
    
    totalWeightedDistance += distance * weight;
    totalWeight += weight;
    
    // Per-item alignment (0-100%)
    const maxPossibleDistance = Math.max(pref.weight * 100, 100 - pref.weight * 100);
    const itemAlignment = maxPossibleDistance > 0
      ? (1 - distance / maxPossibleDistance) * 100
      : 100;
    categoryScores[pref.itemId] = Math.max(0, Math.min(100, itemAlignment));
  }
  
  // Overall alignment: 100% = perfect match, 0% = total misalignment
  const avgWeightedDistance = totalWeight > 0 ? totalWeightedDistance / totalWeight : 0;
  const score = Math.max(0, Math.min(100, 100 - avgWeightedDistance));
  
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
