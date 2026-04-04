/**
 * Centralized game messaging — single source of truth for all copy.
 * Change a string here, it updates everywhere.
 */

import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  fmtParam,
} from "@optimitron/data/parameters";

/** Point name — single source of truth. Change here to rename everywhere. */
export const POINT_NAME = "VOTE" as const;
/** Pre-built variants so components don't need template literals */
export const POINT = `${POINT_NAME} Point` as const;
export const POINTS = `${POINT_NAME} Points` as const;

export const REFERRAL = {
  /** How you earn — the core mechanic */
  earnOne: `Every verified voter you bring in earns you 1 ${POINT}.`,
  /** Short version for compact UI */
  earnOneShort: `1 ${POINT} per verified voter recruited`,
  /** No deposit needed */
  noDeposit: "No deposit required.",
  /** World ID + earn combo */
  verifyAndEarn: `Verify with World ID, then share your link. Each verified voter who uses it earns you 1 ${POINT}.`,
} as const;

export const PRIZE_OUTCOMES = {
  failTitle: "If Targets Are Missed",
  successTitle: "If Targets Are Hit",
  /** Success scenario — one-liner */
  successShort: `${POINT} holders claim proportional shares of the prize pool.`,
} as const;

export const PRIZE_CTA_COPY = {
  /** The standard PrizeCTA body suffix used across all pages */
  depositAndRecruit: `Deposit into the prize pool, recruit verified voters, earn ${POINTS}.`,
} as const;

/** Game balance constants — tweak here, updates everywhere */
export const GAME = {
  /** Friends each player should recruit. 3 gives margin for broken chains while staying achievable. */
  referralGoal: 3,
  /** Minimum pairwise comparisons to count as "completed" wishocracy (C(5,2) = 10) */
  wishocracyMinComparisons: 10,
} as const;

export const CTA = {
  playTheGame: "Play the Game",
  insertCoin: "Insert Coin",
  viewScoreboard: "View Scoreboard",
  highScores: "High Scores",
  readThePaper: "Read the Full Paper",
  readTheManual: "Read the Manual",
  makeAllocation: "Make Your Allocation",
  expressPreferences: "Express Your Preferences",
  startVoting: "Start Voting",
  checkAlignment: "Check Alignment",
  openChat: "Open Chat",
  browseStudies: "Browse Studies",
  seeTheMmyths: "See the Myths",
  politicianLeaderboard: "Politician Leaderboard",
  answerTheQuestion: "Answer the Question",
  convinceMe: "Convince Me First",
  seeTheMath: "See the Full Math",
  earnPoints: `Earn ${POINT_NAME} Points`,
  playNow: "Play Now",
  seeTheRules: "See the Rules",
  startPlaying: "Start Playing",
  browseArmory: "Browse the Armory",
} as const;

export const TAGLINES = {
  gameObjective:
    "Redirect resources from the things that make you poor and dead to things that make you healthy and wealthy!",
  onlyWayToLose: "The only way to lose is to not play.",
  hedgeLine: "Your deposit is a hedge against your own species.",
  arcadeHook:
    `The only arcade game where you get your coins back ${Math.round(PRIZE_POOL_HORIZON_MULTIPLE.value)}x if you lose.`,
  winBothWays:
    "Recruit voters too and you win in both scenarios. The only losing move is not playing.",
  everyPlayerWins:
    "Every player wins. The only losing move is not playing.",
  awarenessBarrier:
    `Your governments spend ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} more on weapons than clinical trials. Everyone wants that fixed. Nobody knows everyone else does too. That's the bug. The game fixes it.`,
  pluralisticIgnorance:
    `4 billion people would rather be healthy and rich than funding ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} more weapons than cures. They just can't see each other yet.`,
  alignTheSuperintelligence:
    `Your governments spend ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} more on weapons than clinical trials. Let's fix that!`,
  theObjective:
    "Reallocate humanity's resources from things making you poorer and deader to things that make you healthier and wealthier.",
  rewardFunction:
    "Maximize median healthy life years and median after-tax inflation-adjusted income. That's the entire objective. Two numbers.",
};

/**
 * Technically accurate descriptions of what military spending does.
 * Rotated throughout the UI so no single page repeats.
 * Each one uses corporate/industrial language for atrocities —
 * the comedy comes from describing it honestly.
 */
export const MILITARY_SPENDING_SYNONYMS = [
  "orphan manufacturing",
  "death logistics",
  "widow production",
  "organized suffering",
  "limb removal services",
  "refugee generation",
  "famine engineering",
  "rubble creation",
  "murder infrastructure",
  "killing strangers",
  "civilian terrorizing",
  "skeleton manufacturing",
  "blowing stuff up",
  "destroying everything",
] as const;

/**
 * Get a deterministic synonym for a given seed (e.g. politician bioguideId, page path).
 * Same seed always returns the same synonym — no layout shift on re-render.
 */
export function getMilitarySynonym(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return MILITARY_SPENDING_SYNONYMS[
    Math.abs(hash) % MILITARY_SPENDING_SYNONYMS.length
  ]!;
}

/** Title-cased variant for headings and meta tags where CSS uppercase isn't applied */
export function getMilitarySynonymTitle(seed: string): string {
  return getMilitarySynonym(seed).replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ARCADE_LABELS = {
  gameTitle: "The Earth Optimization Game",
  insertCoin: "Insert Coin to Play",
  gameOverWin: "Game Over — You Win",
  gameOverLose: "Game Over — You Lose",
  selectMode: "Select Mode",
  versusMode: "Versus Mode",
  bossFight: "Boss Fight",
  playerStats: "Player Stats",
  playerProfile: "Player Profile",
  highScores: "High Scores",
  winConditions: "Win Conditions",
  gameStatus: "Game Status",
  howToPlay: "How to Play",
  armory: "The Armory",
  itemShop: "Item Shop",
  howToWin: "How to Win",
} as const;

export const VOTE_SECTION = {
  sliderPrompt:
    "Adjust the slider to show how you'd split your country's finite resources between the military and clinical trials to cure and treat disease.",
  realityCheck:
    "on weapons and military systems for every $1 spent on clinical trials.",
  theQuestion:
    "Should all nations allocate just 1% of military spending to clinical trials to treat and cure disease together, making the world safer and ensuring no country is at a disadvantage?",
  authPrompt: "Sign In to Cast Your Vote",
  authSubtext: `Every friend you recruit earns you 1 ${POINT_NAME} Point — your share of the prize pool if humanity hits its targets.`,
  authPrivacy: "30 seconds. No spam. Just proof you're a real human.",
  emailSuccessFooter:
    `Your vote is locked in. Now share your link to start earning ${POINT_NAME} Points.`,
  sharePrompt: `Each friend who votes earns you 1 ${POINT_NAME} Point. Get them in.`,
};

export const VOTE_VALUE = {
  heading: "What Your Vote Could Be Worth",
  subheading:
    "You just cast a free vote. If enough people and foundations deposit into the prize fund, that vote could be worth six figures. On my planet, we call that 'good maths.'",
  failHeading: "If the Plan Fails",
  failBody: "annual returns — better than most hedge funds. Their money grew while sitting in the Wishocratic Earth Optimization Fund for 15 years.",
  successHeading: "If the Plan Succeeds",
  successBody: `${POINT_NAME} Point holders claim proportional shares of the prize pool.`,
  breakEvenPrefix: "The break-even probability is 1 in",
  breakEvenSuffix: "Even pessimists should take this bet.",
  deadlineHeading: "The Clock Is Ticking",
  deadlineBody:
    "The parasitic economy — military spending, cybercrime, regulatory capture — is growing faster than the productive economy. When it hits 50% of GDP, stealing beats creating and the system collapses. That's not a prediction. It's compound interest.",
  deadlineQuip:
    `Your ${POINT_NAME} Points pay out if enough people play. Worth nothing if they don't. The deadline doesn't care about your schedule.`,
  flywheelHeading: "The Flywheel",
  flywheelDescription:
    `Retirement funds, foundations, billionaires — they all have an incentive to deposit because the returns beat conventional investing either way. You have an incentive to get your friends to play because each voter increases your ${POINT_NAME} Point value.`,
  shopkeeperQuip:
    "You don't need to be altruistic. You just need to be numerate.",
};

export const ARMORY = {
  pageTitle: "The Armory",
  itemCount: (n: number) => `${n} Items Available`,
  shopkeeperGreeting:
    "Welcome, hero. Everything here is designed to make your species slightly less terrible at governing itself. Browse. Equip. Try not to break anything.",
  shopkeeperFooter:
    "You're still here? Go equip something. The metrics won't move themselves.",
  shelves: {
    weapons: {
      icon: "⚔️",
      heading: "Weapons",
      subtitle: "Data in. Optimal policy out. No opinions. No committees. Just maths.",
    },
    scrolls: {
      icon: "📜",
      heading: "Scrolls",
      subtitle: "Nobody asked 8 billion people what they actually want. These fix that.",
    },
    gold: {
      icon: "💰",
      heading: "Gold & Loot",
      subtitle: "Diagnosing the problem is step one. These make fixing it profitable.",
    },
    seals: {
      icon: "🛡️",
      heading: "Seals & Wards",
      subtitle: "Accountability that can't be argued with because it's on-chain.",
    },
    potions: {
      icon: "🧪",
      heading: "Potions",
      subtitle: "The same causal inference that works on countries works on you.",
    },
  },
} as const;
