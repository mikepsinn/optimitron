// Game-specific constants and derived values.
// Slides import data parameters directly from "@optimitron/data/parameters".
// This file only exports things that live in the game package.

import {
  GLOBAL_INVESTABLE_ASSETS,
  PRIZE_POOL_PARTICIPATION_RATE,
  PRIZE_POOL_SIZE,
  PRIZE_POOL_ANNUAL_RETURN,
  PRIZE_POOL_HORIZON_MULTIPLE,
  VOTE_TOKEN_VALUE,
} from "@optimitron/data/parameters";

/**
 * Game-specific constants that have no matching parameter in @optimitron/data.
 * These are fictional (Moronia), game-economics, US-specific, or derived values.
 */
export const GAME_PARAMS = {
  // Derived death stats
  september11Equivalent: 59, // 150K / ~2,977 per 9/11

  // US-specific wage/income (not in global data params)
  currentMedianIncome: 77_500,
  wageKeptPaceIncome: 528_000, // If wages kept pace with productivity
  projectedGDPperCapita: 149_000, // Treaty target
  statusQuoLifetimeIncome: 1_340_000,
  wishoniaLifetimeIncome: 54_300_000,
  dollarPurchasingPowerLost: 97, // % since 1913

  // Growth rates without direct parameter matches
  productiveRate: 3, // % per year
  yearsToCollapse: 15, // When stealing > producing
  collapseYear: 2040,
  wishoniaRate: 25.4, // % per year Wishonia trajectory

  // Trial durations (approximations)
  currentTrialDuration: 10, // years per treatment
  acceleratedTrialDuration: 0.81, // years per treatment (12.3x faster)

  // Game economics (prize pool, voting) — derived from @optimitron/data parameters
  costPerVote: 0.06,
  valuePerVotePoint: Math.round(VOTE_TOKEN_VALUE.value), // from PRIZE_POOL_SIZE / coordination target
  globalInvestedAssets: GLOBAL_INVESTABLE_ASSETS.value, // $305T
  prizePoolParticipationPct: PRIZE_POOL_PARTICIPATION_RATE.value * 100, // 1%
  prizePoolInitial: GLOBAL_INVESTABLE_ASSETS.value * PRIZE_POOL_PARTICIPATION_RATE.value, // $3.05T
  prizePoolROI: Math.round(PRIZE_POOL_ANNUAL_RETURN.value * 100), // 17%
  prizePoolAfter15yr: Math.round(PRIZE_POOL_SIZE.value), // $33.75T
  prizePoolFallbackMultiple: Math.round(PRIZE_POOL_HORIZON_MULTIPLE.value * 100) / 100, // ~11.06x
  minimumDeposit: 100,
  exchangeRatio: Math.round(VOTE_TOKEN_VALUE.value / 0.06), // value per point / cost per vote

  // Fictional / game-specific
  moroniaCorrelation: 94.7,
  secretSupportPercent: 78,
  defenceWealth: 5_000_000_000_000,
  terrorismChance: "1 in 30 million",
  diseaseChance: "100%",
  militaryPercent: 99.83,
  trialsPercent: 0.17,
} as const;

// Score progression throughout the demo
export const SCORE_PROGRESSION = {
  "act1-all": 0,
  moronia: 0, // GAME OVER
  wishonia: 0, // RESTORE
  "the-fix": 100_000,
  acceleration: 1_000_000,
  scoreboard: 5_000_000,
  allocate: 10_000_000,
  vote: 100_000_000,
  asymmetry: 200_000_000,
  "get-friends": 500_000_000,
  "prize-investment": 650_000_000,
  "prize-mechanism": 800_000_000,
  "vote-point-value": 1_000_000_000,
  "cannot-lose": 1_500_000_000,
  leaderboard: 3_000_000_000,
  "changed-metric": 4_000_000_000,
  "personal-upside": 6_000_000_000,
  close: 8_000_000_000,
} as const;

// Inventory items collected throughout the demo
const votePointDisplay = `$${Math.round(VOTE_TOKEN_VALUE.value).toLocaleString()}`;

export const INVENTORY_ITEMS = [
  {
    slot: 1,
    acquiredAt: "the-fix",
    icon: "scroll",
    emoji: "\u{1F4DC}",
    name: "1% TREATY",
    tooltip: "Redirect 1% of military spending to clinical trials.",
  },
  {
    slot: 2,
    acquiredAt: "allocate",
    icon: "ballot",
    emoji: "\u{1F5F3}",
    name: "ALLOCATION",
    tooltip: "Your preferred budget split.",
  },
  {
    slot: 3,
    acquiredAt: "vote",
    icon: "fist",
    emoji: "\u270A",
    name: "VOTE",
    tooltip: "Yes on the 1% Treaty.",
  },
  {
    slot: 4,
    acquiredAt: "get-friends",
    icon: "chain",
    emoji: "\u{1F517}",
    name: "REFERRAL LINK",
    tooltip: "Share with 2 friends. They share with 2 more.",
  },
  {
    slot: 5,
    acquiredAt: "prize-mechanism",
    icon: "gold-coin",
    emoji: "\u{1FA99}",
    name: "PRIZE DEPOSIT",
    tooltip: `$100 deposited. Earning ${GAME_PARAMS.prizePoolROI}%/yr. Grows ${GAME_PARAMS.prizePoolFallbackMultiple}\u00D7 even if targets missed.`,
  },
  {
    slot: 6,
    acquiredAt: "vote-point-value",
    icon: "silver-pair",
    emoji: "\u{1F948}",
    name: "VOTE POINTS \u00D72",
    tooltip: `${votePointDisplay} each if targets are hit. Earned by getting friends to play.`,
  },
  {
    slot: 7,
    acquiredAt: "personal-upside",
    icon: "deed",
    emoji: "\u{1F4CB}",
    name: "$15.7M CLAIM",
    tooltip: "Your lifetime income gain if the Treaty passes.",
  },
  {
    slot: 8,
    acquiredAt: "leaderboard",
    icon: "magnifier",
    emoji: "\u{1F50D}",
    name: "ALIGNMENT SCORE",
    tooltip: "See how your leaders rank vs your preferences.",
  },
] as const;

export type InventoryItem = (typeof INVENTORY_ITEMS)[number];
export type ScoreKey = keyof typeof SCORE_PROGRESSION;
