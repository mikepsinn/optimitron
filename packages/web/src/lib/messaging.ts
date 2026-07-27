/**
 * Centralized game messaging — single source of truth for all copy.
 * Change a string here, it updates everywhere.
 */

import {
  TREATY_REDUCTION_PCT,
  PRIZE_POOL_HORIZON_MULTIPLE,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  fmtParam,
  fmtParamValueOnly,
} from "@optimitron/data/parameters";
import {
  GLOBAL_SURVEY_NAME,
  HUMANITY_MANAGEMENT,
  ORGANIZATION_ACTIVATION_TASK_TITLE,
} from "@optimitron/data/campaign";
import { EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME } from "@optimitron/db/system-identities";
import { WELFARE_CLAIM_AMOUNT_TEXT } from "@/components/shared/WelfareClaim.core";

const TREATY_REDUCTION_TEXT = fmtParamValueOnly(TREATY_REDUCTION_PCT, 1);

/** Point name — single source of truth. Change here to rename everywhere.
 *  This is the PRIZE CURRENCY (what you earn), NOT the referendum action of voting. */
export const POINT_NAME = "Earth Optimization" as const;
/** Pre-built variants so components don't need template literals */
export const POINT = `${POINT_NAME} Point` as const;
export const POINTS = `${POINT_NAME} Points` as const;

// Welfare claim text lives in WelfareClaim.core so string-only contexts
// do not import the React component. JSX surfaces should use WelfareClaim.

export {
  GLOBAL_SURVEY_NAME,
  HUMANITY_MANAGEMENT,
  ORGANIZATION_ACTIVATION_TASK_TITLE,
};

export const CAMPAIGN_PRINT_COPY = {
  businessCardLines: [
    "Please take",
    "30 seconds",
    "to end war",
    "and disease",
    "warondisease.org",
  ],
  flyerHeadlineLines: [
    "Please take",
    "30 seconds",
    "to end",
    "war and disease",
  ],
  shirtBackLines: [
    "Trade one apocalypse",
    "for disease eradication",
    "at warondisease.org.",
  ],
  shirtFrontLines: ["THIS T-SHIRT", "ENDED WAR", "AND DISEASE."],
} as const;

export const SHIRT_FRONT_COPY = CAMPAIGN_PRINT_COPY.shirtFrontLines.join(" ");
export const SHIRT_BACK_COPY_LINES = CAMPAIGN_PRINT_COPY.shirtBackLines;
export const SHIRT_BACK_COPY = SHIRT_BACK_COPY_LINES.join(" ");

// ---------------------------------------------------------------------------
// User-framing vocabulary (variant-aware)
//
// Two narrative frames live in the codebase:
//   - "manager" — Earth Optimization Services Inc. is hiring humanity managers,
//     each one hires 2 more. Identity-based, sustains chain behavior.
//   - "voter" — Recruit verified voters for the referendum. Action-based.
//
// `getUserFramingVocabulary(frame)` returns the right strings for each surface.
// Components never hardcode recruit-CTA copy; they look it up by frame.
// The site's framing is set on `SiteConfig.userFraming` in `lib/site.ts`.
//
// Vote-action surfaces ("Vote yes on the 1% Treaty", the actual ballot) are
// frame-independent and use literal strings. Only the recruitment chain
// vocabulary varies.
// ---------------------------------------------------------------------------

export type UserFraming = "manager" | "voter";

export interface UserFramingVocabulary {
  recruit: {
    /** "hire" / "recruit" */
    verb: string;
    /** "hired" / "recruited" */
    verbPast: string;
    /** "humanity manager" / "voter" */
    noun: string;
    /** "humanity managers" / "voters" */
    nounPlural: string;
  };
  org: {
    /** "Earth Optimization Services" — same across both framings; the legal
     *  entity is constant, only the recruitment vocabulary varies. */
    shortName: string;
    /** "Earth Optimization Services Inc." */
    longName: string;
  };
  /** Pre-baked CTA strings (the unique recruitment-chain copy points). */
  recruitCtaShort: string;
  shareLinkPrompt: string;
  earnPerRecruit: string;
  earnPerRecruitShort: string;
  verifyAndEarn: string;
  depositAndRecruit: string;
  /** Used by leaderboard / activity feed display labels (NOT the schema enum). */
  recruitedActivityVerb: string;
}

const MANAGER_VOCAB: UserFramingVocabulary = {
  recruit: {
    verb: "hire",
    verbPast: "hired",
    noun: "humanity manager",
    nounPlural: "humanity managers",
  },
  org: {
    shortName: "Earth Optimization Services",
    longName: EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME,
  },
  recruitCtaShort: "Tell two friends to optimize Earth",
  shareLinkPrompt:
    "Share your link with everyone you do not want to suffer and die of horrible diseases. It will significantly reduce the probability that they will suffer and die from horrible diseases.",
  earnPerRecruit: `Each humanity manager you hire earns you 1 ${POINT}.`,
  earnPerRecruitShort: `1 ${POINT} per humanity manager hired`,
  verifyAndEarn: `Verify personhood, then share your link. Each humanity manager you hire earns you 1 ${POINT}.`,
  depositAndRecruit: `Deposit into the prize pool, tell friends, earn ${POINTS}.`,
  recruitedActivityVerb: "hired a humanity manager",
};

const VOTER_VOCAB: UserFramingVocabulary = {
  recruit: {
    verb: "recruit",
    verbPast: "recruited",
    noun: "voter",
    nounPlural: "voters",
  },
  // Same canonical legal entity as the manager frame. Only the recruitment
  // vocabulary varies. "Earth Optimization Commission" is reserved for
  // Wishonia narrator asides, not the structural org name (per TODO.md).
  org: {
    shortName: "Earth Optimization Services",
    longName: EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME,
  },
  recruitCtaShort: "Get friends to vote",
  shareLinkPrompt:
    "Share your vote link with everyone you do not want to suffer and die of horrible diseases. It will significantly reduce the probability that they will suffer and die from horrible diseases.",
  earnPerRecruit: `Every verified voter you bring in earns you 1 ${POINT}.`,
  earnPerRecruitShort: `1 ${POINT} per verified voter`,
  verifyAndEarn: `Verify personhood, then share your link. Each verified voter who uses it earns you 1 ${POINT}.`,
  depositAndRecruit: `Deposit into the prize pool, get friends to vote, earn ${POINTS}.`,
  recruitedActivityVerb: "brought in a voter",
};

export function getUserFramingVocabulary(
  frame: UserFraming,
): UserFramingVocabulary {
  return frame === "manager" ? MANAGER_VOCAB : VOTER_VOCAB;
}

// Legacy aggregate constants — preserved for backward compatibility with call
// sites that haven't been migrated to vocab lookups yet. They mirror the
// VOTER_VOCAB defaults so the existing copy is unchanged.
export const REFERRAL = {
  earnOne: VOTER_VOCAB.earnPerRecruit,
  earnOneShort: VOTER_VOCAB.earnPerRecruitShort,
  noDeposit: "No deposit required.",
  verifyAndEarn: VOTER_VOCAB.verifyAndEarn,
} as const;

export const PRIZE_OUTCOMES = {
  failTitle: "If Targets Are Missed",
  successTitle: "If Targets Are Hit",
  /** Success scenario — one-liner */
  successShort: `${POINT} holders claim proportional shares of the prize pool.`,
} as const;

export const PRIZE_CTA_COPY = {
  /** The standard PrizeCTA body suffix used across all pages */
  depositAndRecruit: VOTER_VOCAB.depositAndRecruit,
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
  gameObjective: `Optimize public policy to stop making you poorer and deader and start making you healthier and wealthier!`,
  onlyWayToLose: `Your deposit grows at ~10% for 15 years either way. The break-even probability is 1 in 15,000. You lose money by not depositing.`,
  hedgeLine: "Your deposit is a hedge against your own species.",
  arcadeHook: `Deposit $100. If the plan fails, you get $${Math.round(100 * PRIZE_POOL_HORIZON_MULTIPLE.value)} back. If it works, you helped prevent 10.7 billion deaths. The maths are not complicated.`,
  winBothWays: `Depositors get ~${Math.round(PRIZE_POOL_HORIZON_MULTIPLE.value)}x returns on failure. Recruiters get prize shares on success. Both scenarios pay.`,
  everyPlayerWins: `Failure pays ~${Math.round(PRIZE_POOL_HORIZON_MULTIPLE.value)}x via projected fund yield. Success pays from the prize pool. The only scenario that costs you money is not depositing.`,
  awarenessBarrier: `Your governments spend ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} on weapons per $1 of clinical trials. 95% of diseases have zero FDA-approved treatments. There are 9,500 known safe compounds and 99.7% of their potential uses have never been tested. At the current rate, testing them all takes 443 years. You will be dead in 80.`,
  pluralisticIgnorance: `Your chance of dying from terrorism: 1 in 30 million. Your chance of dying from disease: 100%. Your governments spend ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} more on the first problem. You'd think someone would mention this. They did. You nailed him to a piece of wood.`,
  alignTheSuperintelligence: `Your governments spend ${fmtParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO)} on weapons per $1 of clinical trials. Since 1913, that's $170T on things that make humans stop — enough for 38,000 years of clinical trials. You bought the other thing.`,
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
  //"civilian terrorizing",
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
  gameOverWin: "Game Over: You Win",
  gameOverLose: "Game Over: You Lose",
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
  // Welfare-framed (vs preference-framed) so the slider answer reads as
  // juror testimony on the welfare-maximizing allocation rather than a
  // personal preference. Maps directly to the cause of action in
  // Humanity v. Government: governments are paid ~$36T/yr to promote
  // the general welfare and underdeliver. Voters' welfare-findings
  // become evidence in the case; preferences alone would not.
  sliderPrompt: `You pay governments ${WELFARE_CLAIM_AMOUNT_TEXT} a year to promote the general welfare: maximize human health and wealth. Of the money available for military/weapons and pragmatic clinical trials, how much should go to each?`,
  realityCheck:
    "on weapons and military systems for every $1 spent on clinical trials.",
  theQuestion:
    "Should all nations allocate just 1% of military spending to clinical trials to treat and cure disease together, making the world safer and ensuring no country is at a disadvantage?",
  emailSuccessFooter: `Your ${TREATY_REDUCTION_TEXT} Treaty vote is saved. Now share your link to start earning ${POINT_NAME} Points.`,
};

export const VOTE_VALUE = {
  heading: "The Maths on Your Vote",
  subheading:
    "You cast a free vote. Deposits into the prize fund back it with real money. The expected value is below. On my planet, we do this in primary school.",
  failHeading: "If the Plan Fails",
  failBody:
    "projected annual fund returns — better than most hedge funds. The money compounds for 15 years regardless.",
  successHeading: "If the Plan Succeeds",
  successBody: `${POINT_NAME} Point holders claim proportional shares of the prize pool.`,
  breakEvenPrefix: "The break-even probability is 1 in",
  breakEvenSuffix:
    "If you believe there's even a 0.0067% chance the plan works, depositing is positive expected value.",
  deadlineHeading: "Your Civilisation Has a Countdown",
  deadlineBody:
    "The parasitic economy — military spending ($2.7T), cybercrime ($10.5T), regulatory capture — is $13.2T/yr and growing at 15% annually. The Soviet Union collapsed at 15% military-to-GDP. You're approaching that ratio with better technology and no plan. The Soviets had a terrible plan, and their terrible plan beat your no plan.",
  deadlineQuip: `Combined destructive economy is 11.5% of global GDP and growing faster than the productive economy. Once stealing pays better than building, production becomes irrational. You have a name for places where this already happened. You call them "failed states."`,
  flywheelHeading: "Why The Rich Show Up",
  flywheelDescription: `Billionaires prefer not dying of horrible diseases. There are 2,800 of them. Statistically, at least one prefers living. They deposit because returns beat conventional investing either way. Each verified voter increases the political leverage, which increases the probability of treaty passage, which increases the expected value of every ${POINT_NAME} Point.`,
  shopkeeperQuip:
    "The break-even probability is 0.0067%. You do not need to be altruistic. You need to be able to read a number.",
};

export const ARMORY = {
  pageTitle: "The Armory",
  itemCount: (n: number) => `${n} Items Available`,
  shopkeeperGreeting:
    "Step right up, hero. Every item here makes your species less terrible at governing itself. Browse. Equip. Try not to break anything important.",
  shopkeeperFooter:
    "Two numbers move the whole species: median healthy life years, median after-tax income. They will not move themselves. Equip something.",
  shelves: {
    weapons: {
      icon: "⚔️",
      heading: "Weapons",
      subtitle:
        "Data in. Optimal policy out. No opinions. No committees. Just maths.",
    },
    scrolls: {
      icon: "📜",
      heading: "Scrolls",
      subtitle:
        "Nobody asked 8 billion people what they actually want. These fix that.",
    },
    gold: {
      icon: "💰",
      heading: "Gold & Loot",
      subtitle:
        "Diagnosing the problem is step one. These make fixing it profitable.",
    },
    seals: {
      icon: "🛡️",
      heading: "Seals & Wards",
      subtitle: "Accountability that can be checked instead of argued about.",
    },
    potions: {
      icon: "🧪",
      heading: "Potions",
      subtitle:
        "The same causal inference that works on countries works on you.",
    },
  },
} as const;
