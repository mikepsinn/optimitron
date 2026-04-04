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
    `Your governments spend ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} on weapons for every $1 testing which medicines work. 150,000 humans permanently stop every 24 hours. That's fifty 9/11s a day, except nobody invades anyone about it because diseases don't have oil.`,
  onlyWayToLose:
    `Your deposit grows at ~10% for 15 years either way. The break-even probability is 1 in 15,000. You lose money by not depositing.`,
  hedgeLine: "Your deposit is a hedge against your own species.",
  arcadeHook:
    `Deposit $100. If the plan fails, you get $${Math.round(100 * PRIZE_POOL_HORIZON_MULTIPLE.value)} back. If it works, you helped prevent 10.7 billion deaths. The maths are not complicated.`,
  winBothWays:
    `Depositors get ~${Math.round(PRIZE_POOL_HORIZON_MULTIPLE.value)}x returns on failure. Recruiters get prize shares on success. Both scenarios pay.`,
  everyPlayerWins:
    `Failure pays ~${Math.round(PRIZE_POOL_HORIZON_MULTIPLE.value)}x via Aave yield. Success pays from the prize pool. The only scenario that costs you money is not depositing.`,
  awarenessBarrier:
    `Your governments spend ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} on weapons per $1 of clinical trials. 95% of diseases have zero FDA-approved treatments. There are 9,500 known safe compounds and 99.7% of their potential uses have never been tested. At the current rate, testing them all takes 443 years. You will be dead in 80.`,
  pluralisticIgnorance:
    `Your chance of dying from terrorism: 1 in 30 million. Your chance of dying from disease: 100%. Your governments spend ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} more on the first problem. You'd think someone would mention this. They did. You nailed him to a piece of wood.`,
  alignTheSuperintelligence:
    `Your governments spend ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} on weapons per $1 of clinical trials. Since 1913, that's $170T on things that make humans stop — enough for 38,000 years of clinical trials. You bought the other thing.`,
  theObjective:
    "Maximize median healthy life years and median after-tax inflation-adjusted income. Two numbers. Everything else is a distraction your politicians use to avoid being measured.",
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
  heading: "The Maths on Your Vote",
  subheading:
    "You cast a free vote. Deposits into the prize fund back it with real money. The expected value calculation is below. On my planet, we do this in primary school.",
  failHeading: "If the Plan Fails",
  failBody: "annual returns from Aave yield — better than most hedge funds. The money compounds for 15 years regardless.",
  successHeading: "If the Plan Succeeds",
  successBody: `${POINT_NAME} Point holders claim proportional shares of the prize pool.`,
  breakEvenPrefix: "The break-even probability is 1 in",
  breakEvenSuffix: "If you believe there's even a 0.0067% chance the plan works, depositing is positive expected value.",
  deadlineHeading: "Your Civilisation Has a Countdown",
  deadlineBody:
    "The parasitic economy — military spending ($2.7T), cybercrime ($10.5T), regulatory capture — is $13.2T/yr and growing at 15% annually. The Soviet Union collapsed at 15% military-to-GDP. You're approaching that ratio with better technology and no plan. The Soviets had a terrible plan, and their terrible plan beat your no plan.",
  deadlineQuip:
    `Combined destructive economy is 11.5% of global GDP and growing faster than the productive economy. Once stealing pays better than building, production becomes irrational. You have a name for places where this already happened. You call them "failed states."`,
  flywheelHeading: "The Incentive Structure",
  flywheelDescription:
    `Billionaires prefer not dying of horrible diseases. There are 2,800 of them. Statistically, at least one prefers living. They deposit because returns beat conventional investing either way. Each verified voter increases the political leverage, which increases the probability of treaty passage, which increases the expected value of every ${POINT_NAME} Point.`,
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
