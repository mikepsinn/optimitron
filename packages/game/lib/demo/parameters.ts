// All statistics and data from the demo script
// Source: PL Genesis Hackathon Demo Video Script

export const PARAMETERS = {
  // Death statistics
  deaths: {
    perDay: 150_000,
    perYear: 54_750_000, // 150,000 * 365
    totalPreventable10yr: 10_700_000_000,
    warDeathsFundedByPrinting: 97_000_000, // 97 million killed in wars funded by money printing
    september11Equivalent: 59, // deaths per day = 59 September 11ths
  },

  // Spending data
  spending: {
    militaryGlobal: 2_720_000_000_000, // $2.72T
    clinicalTrialsGlobal: 4_500_000_000, // $4.5B
    ratio: 604, // 604:1
    onePercentMilitary: 27_200_000_000, // $27.2B (1% reallocation)
    cumulativeMilitarySinceFed: 170_000_000_000_000, // $170T since 1913
    militaryPercent: 99.83,
    trialsPercent: 0.17,
  },

  // Risk comparison
  risk: {
    terrorismChance: "1 in 30 million",
    diseaseChance: "100%",
  },

  // Economic projections
  economic: {
    currentMedianIncome: 77_500,
    wageKeptPaceIncome: 528_000, // If wages kept pace with productivity
    currentGDPperCapita: 18_700,
    projectedGDPperCapita: 149_000,
    projectedGDPperCapita_treaty: 339_000, // with 17.9% growth over 20yrs
    projectedGDPperCapita_wishonia: 1_160_000, // with 25.4% growth
    personalLifetimeLoss: 15_700_000,
    statusQuoLifetimeIncome: 1_340_000, // $1.34M lifetime
    wishoniaLifetimeIncome: 54_300_000, // $54.3M Wishonia trajectory
    annualDysfunctionTax: 12_600, // $12,600/yr per person
    globalDysfunctionCost: 101_000_000_000_000, // $101T
    dollarPurchasingPowerLost: 97, // 97% since 1913
  },

  // Economic growth rates (from The Clock)
  growth: {
    parasiticRate: 15, // 15% per year
    productiveRate: 3, // 3% per year
    yearsToCollapse: 15, // When stealing > producing
    collapseYear: 2040,
    statusQuoRate: 2.5, // % per year status quo GDP growth
    treatyRate: 17.9, // % per year with treaty
    wishoniaRate: 25.4, // % per year Wishonia trajectory
  },

  // Trial acceleration
  trials: {
    currentDuration: 10, // years per treatment
    acceleratedDuration: 0.81, // years per treatment (12.3x faster)
    accelerationFactor: 12.3,
    currentDurationAllDiseases: 443, // years to cure ALL diseases at current pace
    acceleratedDurationAllDiseases: 36, // years with treaty
  },

  // Game economics
  game: {
    costPerVote: 0.06,
    valuePerVotePoint: 194_000,
    prizePoolMultiple: 10, // 10x investment
    prizePoolROI: 17, // 17% per year
    prizePoolFallbackMultiple: 11, // 11x back if targets missed
    minimumDeposit: 100,
    prizePoolTotal: 774_000_000_000_000, // $774T
    exchangeRatio: 245_000_000, // 245 million to one (vote cost vs upside)
  },

  // Health metrics
  health: {
    currentHALE: 63.3, // Healthy life expectancy
    projectedHALE: 69.8,
    haleGain: 6.5, // years gained
  },

  // Population
  population: {
    world: 8_000_000_000,
    livesSaved: 10_700_000_000,
  },

  // Moronia correlation
  moronia: {
    correlationPercent: 94.7,
  },

  // Pluralistic ignorance
  pluralistic: {
    secretSupportPercent: 78, // 78% secretly support
    publicWealth: 454_000_000_000_000, // $454T
    defenceWealth: 5_000_000_000_000, // $5T
  },
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
export const INVENTORY_ITEMS = [
  {
    slot: 1,
    acquiredAt: "the-fix",
    icon: "scroll",
    emoji: "📜",
    name: "1% TREATY",
    tooltip: "Redirect 1% of military spending to clinical trials.",
  },
  {
    slot: 2,
    acquiredAt: "allocate",
    icon: "ballot",
    emoji: "🗳",
    name: "ALLOCATION",
    tooltip: "Your preferred budget split.",
  },
  {
    slot: 3,
    acquiredAt: "vote",
    icon: "fist",
    emoji: "✊",
    name: "VOTE",
    tooltip: "Yes on the 1% Treaty.",
  },
  {
    slot: 4,
    acquiredAt: "get-friends",
    icon: "chain",
    emoji: "🔗",
    name: "REFERRAL LINK",
    tooltip: "Share with 2 friends. They share with 2 more.",
  },
  {
    slot: 5,
    acquiredAt: "prize-mechanism",
    icon: "gold-coin",
    emoji: "🪙",
    name: "PRIZE DEPOSIT",
    tooltip:
      "$100 deposited. Earning 17%/yr. Grows 11× even if targets missed.",
  },
  {
    slot: 6,
    acquiredAt: "vote-point-value",
    icon: "silver-pair",
    emoji: "🥈",
    name: "VOTE POINTS ×2",
    tooltip: "$194K each if targets are hit. Earned by getting friends to play.",
  },
  {
    slot: 7,
    acquiredAt: "personal-upside",
    icon: "deed",
    emoji: "📋",
    name: "$15.7M CLAIM",
    tooltip: "Your lifetime income gain if the Treaty passes.",
  },
  {
    slot: 8,
    acquiredAt: "leaderboard",
    icon: "magnifier",
    emoji: "🔍",
    name: "ALIGNMENT SCORE",
    tooltip: "See how your leaders rank vs your preferences.",
  },
] as const;

export type InventoryItem = (typeof INVENTORY_ITEMS)[number];
export type ScoreKey = keyof typeof SCORE_PROGRESSION;
