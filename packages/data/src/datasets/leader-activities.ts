/**
 * Leader activity dataset for the public employee review ledger.
 *
 * Each activity becomes a VERIFIED task assigned to the leader's Person record
 * with impact metrics reflecting the actual cost/harm/benefit.
 *
 * Three tiers:
 *   Tier 1 — Pure cost/harm: negative expectedEconomicValueUsdBase
 *   Tier 2 — Measured outcomes: positive expectedEconomicValueUsdBase from real data
 *   Tier 3 — Unmeasured spending: null expectedEconomicValueUsdBase, only cost known
 */

export type ActivityImpactTier = "harm" | "measured-benefit" | "unmeasured";

export interface LeaderActivityRecord {
  /** ISO-2 country code matching TreatySignerSlot.countryCode */
  countryCode: string;
  /** URL-safe slug, unique within country (produces taskKey: accountability:{cc}:{slug}) */
  activitySlug: string;
  activityType: "leisure" | "military" | "spending" | "ceremony" | "legislation" | "other";
  impactTier: ActivityImpactTier;
  title: string;
  /** Factual, sourced description */
  description: string;
  /** Wishonia voice editorial */
  wishoniaComment: string;
  /** What the money/time could have accomplished instead */
  alternativeUse: string;
  /** ISO date string of when this happened or was completed */
  completedAt: string;
  /** Direct taxpayer cost (always positive — the sign is determined by impactTier) */
  taxpayerCostUsd: number | null;
  /** Lives lost or harmed (positive number — negated in impact frame for Tier 1) */
  casualtiesEstimate: number | null;
  /** DALYs caused (positive number — negated in impact frame for Tier 1) */
  dalysInflicted: number | null;
  /** For Tier 2 only: measured positive economic value produced */
  measuredEconomicValueUsd: number | null;
  /** For Tier 2 only: measured lives saved */
  measuredLivesSaved: number | null;
  /** For Tier 3: what politicians claimed it would do */
  claimedBenefit: string | null;
  /** For Tier 3: measured outcome if any, otherwise null */
  measuredOutcome: string | null;
  /** For Tier 3: cost efficiency comparison */
  costEfficiencyNote: string | null;
  /** Primary citation URL */
  sourceUrl: string;
  /** Additional citations */
  additionalSourceUrls: string[];
}

export type LeaderActivityDraft = LeaderActivityRecord;

// Intentionally empty: prior partisan-framed activities removed in favour of
// the objective treaty-signer accountability flow.
export const LEADER_ACTIVITIES: LeaderActivityRecord[] = [];
