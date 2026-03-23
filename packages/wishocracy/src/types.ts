import { z } from 'zod';

/**
 * Core types for RAPPA (Randomized Aggregated Pairwise Preference Allocation)
 * 
 * @see https://wishocracy.warondisease.org — Wishocracy paper
 * 
 * @see https://zenodo.org/records/18205882
 */

/**
 * A single pairwise comparison from a participant
 * "Given $100, how would you split it between A and B?"
 */
export const PairwiseComparisonSchema = z.object({
  /** Unique comparison ID */
  id: z.string(),
  /** Participant who made this comparison */
  participantId: z.string(),
  /** First item in the pair */
  itemAId: z.string(),
  /** Second item in the pair */
  itemBId: z.string(),
  /** Allocation to item A (0-100, item B gets 100 - allocationA) */
  allocationA: z.number().min(0).max(100),
  /** Timestamp of comparison */
  timestamp: z.string().or(z.number()),
  /** Time taken to decide (ms) — can indicate engagement quality */
  responseTimeMs: z.number().optional(),
});

export type PairwiseComparison = z.infer<typeof PairwiseComparisonSchema>;

/**
 * An item/priority/wish that can be compared
 */
export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  /** Current actual budget allocation (for gap analysis) */
  currentAllocationUsd: z.number().optional(),
  currentAllocationPct: z.number().optional(),
});

export type Item = z.infer<typeof ItemSchema>;

/**
 * Pairwise comparison matrix entry
 * ratio = geometric mean of (allocationA / allocationB) across all comparisons
 */
export const MatrixEntrySchema = z.object({
  itemAId: z.string(),
  itemBId: z.string(),
  /** Ratio: how much more A is preferred over B (>1 = prefer A) */
  ratio: z.number(),
  /** Number of comparisons for this pair */
  count: z.number(),
  /** Standard deviation of allocations (measures consensus) */
  stdDev: z.number().optional(),
});

export type MatrixEntry = z.infer<typeof MatrixEntrySchema>;

/**
 * Preference weight for an item (output of eigenvector method)
 */
export const PreferenceWeightSchema = z.object({
  itemId: z.string(),
  /** Normalized weight (0-1, all weights sum to 1) */
  weight: z.number().min(0).max(1),
  /** Rank (1 = highest priority) */
  rank: z.number().int().positive(),
  /** 95% confidence interval */
  ciLow: z.number().optional(),
  ciHigh: z.number().optional(),
});

export type PreferenceWeight = z.infer<typeof PreferenceWeightSchema>;

/**
 * Citizen Alignment Score for a politician
 */
export const AlignmentScoreSchema = z.object({
  /** Politician/legislator ID */
  politicianId: z.string(),
  /** Alignment score (0-100%) */
  score: z.number().min(0).max(100),
  /** Number of votes compared */
  votesCompared: z.number().int(),
  /** Per-category alignment breakdown */
  itemScores: z.record(z.string(), z.number()).optional(),
});

export type AlignmentScore = z.infer<typeof AlignmentScoreSchema>;

/**
 * Preference gap: difference between citizen preferences and actual allocation
 */
export const PreferenceGapSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  /** What citizens want (% of budget) */
  preferredPct: z.number(),
  /** What government actually allocates (% of budget) */
  actualPct: z.number(),
  /** Gap: preferred - actual (positive = underfunded) */
  gapPct: z.number(),
  /** Gap in USD */
  gapUsd: z.number().optional(),
});

export type PreferenceGap = z.infer<typeof PreferenceGapSchema>;
