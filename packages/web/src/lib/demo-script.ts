/**
 * Modular demo segment library + named playlists.
 *
 * Each segment is a standalone 30-90s narrated piece covering one concept.
 * Playlists compose segments into different video outputs:
 *   - hackathon (3 min)
 *   - full-demo (7-8 min)
 *   - investor-pitch (5 min)
 *   - youtube-[feature] (1-2 min each)
 *   - social-[hook] (30-60s each)
 *
 * The /demo page takes ?playlist=hackathon to select which version to play.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type { DemoSlideId } from "@/components/demo/slides";
import type { BrutalCardBgColor } from "@/components/ui/brutal-card";
import {
  fmtParam,
  GLOBAL_DISEASE_DEATHS_DAILY,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  VOTE_TOKEN_VALUE,
  PRIZE_POOL_HORIZON_MULTIPLE,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  DESTRUCTIVE_ECONOMY_50PCT_YEAR,
  US_GOV_WASTE_DRUG_WAR,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  TREATY_PERSONAL_UPSIDE_BLEND,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  GLOBAL_HOUSEHOLD_WEALTH_USD,
  TYPE_II_ERROR_COST_RATIO,
  ECONOMIC_MULTIPLIER_HEALTHCARE_INVESTMENT,
  ECONOMIC_MULTIPLIER_MILITARY_SPENDING,
  TREATY_TRAJECTORY_CAGR_YEAR_20,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_20,
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_20,
  US_MILITARY_SPENDING_2024_ANNUAL,
  EFFICACY_LAG_YEARS,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  DISEASE_BURDEN_GDP_DRAG_PCT,
  GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL,
  GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  DFDA_TRIAL_COST_REDUCTION_FACTOR,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
  PRIZE_POOL_ANNUAL_RETURN,
  TREATY_ANNUAL_FUNDING,
  US_GOV_WASTE_TAX_COMPLIANCE,
  UNEXPLORED_RATIO,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  PHASE_1_PASSED_COMPOUNDS_GLOBAL,
  SINGAPORE_LIFE_EXPECTANCY,
  US_LIFE_EXPECTANCY_2023,
  SHARING_BREAKEVEN_ONE_IN_TREATY,
  WAR_DEATHS_SINCE_1900,
  CONVENTIONAL_RETIREMENT_RETURN,
  GLOBAL_CYBERCRIME_CAGR,
} from "@optimitron/data/parameters";
// Precompute for narration strings (spoken-word, so use full words not abbreviations)
const deathsDaily = Math.round(GLOBAL_DISEASE_DEATHS_DAILY.value).toLocaleString();
const milToTrialRatio = Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value);
const dysfunctionCostT = Math.round(POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL.value / 1e12);
const dysfunctionPerPerson = fmtParam(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL);
const votePointValue = fmtParam(VOTE_TOKEN_VALUE);
const poolMultiple = PRIZE_POOL_HORIZON_MULTIPLE.value.toFixed(0);
const tippingPointM = Math.round(TREATY_CAMPAIGN_VOTING_BLOC_TARGET.value / 1e6);
const collapseYear = Math.round(DESTRUCTIVE_ECONOMY_50PCT_YEAR.value);
const trialCapacityX = DFDA_TRIAL_CAPACITY_MULTIPLIER.value.toFixed(1);
const oldQueue = Math.round(STATUS_QUO_QUEUE_CLEARANCE_YEARS.value);
const newQueue = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value);
const drugWarCostB = Math.round(US_GOV_WASTE_DRUG_WAR.value / 1e9);
const treatyGainM = (TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA.value / 1e6).toFixed(1);
const personalUpsideM = (TREATY_PERSONAL_UPSIDE_BLEND.value / 1e6).toFixed(1);
const totalLivesSavedB = (DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value / 1e9).toFixed(1);
const totalSufferingQuad = (DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS.value / 1e15).toFixed(1);
const treatyHaleGainYears = Math.round(TREATY_HALE_GAIN_YEAR_15.value * 10) / 10;
const treatyIncomeMultiplier = Math.round(TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value);
const optimalGovernanceIncomeMultiplier = Math.round(WISHONIA_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value);
const publicWealthT = `$${Math.round(GLOBAL_HOUSEHOLD_WEALTH_USD.value / 1e12).toLocaleString()} trillion`;
const typeIIErrorRatio = Math.round(TYPE_II_ERROR_COST_RATIO.value).toLocaleString();
const healthcareRoi = `$${ECONOMIC_MULTIPLIER_HEALTHCARE_INVESTMENT.value.toFixed(2)}`;
const militaryRoi = `$${ECONOMIC_MULTIPLIER_MILITARY_SPENDING.value.toFixed(2)}`;
const treatyCagr20 = (TREATY_TRAJECTORY_CAGR_YEAR_20.value * 100).toFixed(1);
const currentIncome20 = `$${Math.round(CURRENT_TRAJECTORY_AVG_INCOME_YEAR_20.value / 1000).toLocaleString()},000`;
const treatyIncome20 = `$${Math.round(TREATY_TRAJECTORY_AVG_INCOME_YEAR_20.value / 1000).toLocaleString()},000`;
const usMilitaryAnnualB = `$${(US_MILITARY_SPENDING_2024_ANNUAL.value / 1e9).toFixed(1)} billion`;
const efficacyLagYears = EFFICACY_LAG_YEARS.value.toFixed(1);
const fdaDelayDeathsM = Math.round(EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL.value / 1e6);
const diseaseBurdenGdpPct = Math.round(DISEASE_BURDEN_GDP_DRAG_PCT.value * 100);
const diseaseCostT = Math.round((GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL.value + GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL.value) / 1e12);
const pragmaticTrialCost = Math.round(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT.value).toLocaleString();
const traditionalTrialCostK = Math.round(TRADITIONAL_PHASE3_COST_PER_PATIENT.value / 1000);
const trialCostReductionX = Math.round(DFDA_TRIAL_COST_REDUCTION_FACTOR.value);
const recoveryTrialEfficiencyX = Math.round(RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value);
const currentHale = GLOBAL_HALE_CURRENT.value.toFixed(1);
const targetHale = TREATY_PROJECTED_HALE_YEAR_15.value.toFixed(1);
const currentAvgIncomeK15 = `${Math.round(CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value / 100) / 10}`;
const targetAvgIncomeK15 = Math.round(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value / 1000).toLocaleString();
const prizeReturnPct = (PRIZE_POOL_ANNUAL_RETURN.value * 100).toFixed(0);
const treatyFundingB = Math.round(TREATY_ANNUAL_FUNDING.value / 1e9);
const taxComplianceCostB = Math.round(US_GOV_WASTE_TAX_COMPLIANCE.value / 1e9);
const unexploredPct = (UNEXPLORED_RATIO.value * 100).toFixed(1);
const timelineShiftYears = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS.value);
const compoundsProvenSafe = Math.round(PHASE_1_PASSED_COMPOUNDS_GLOBAL.value).toLocaleString();
const singaporeLE = Math.round(SINGAPORE_LIFE_EXPECTANCY.value);
const usLE = Math.round(US_LIFE_EXPECTANCY_2023.value);
const breakEvenOneIn = Math.round(SHARING_BREAKEVEN_ONE_IN_TREATY.value / 1e6).toLocaleString();
const warDeathsSince1900M = Math.round(WAR_DEATHS_SINCE_1900.value / 1e6);
const cumMilitarySpendingT = Math.round(CUMULATIVE_MILITARY_SPENDING_FED_ERA.value / 1e12);
const conventionalReturnPct = Math.round(CONVENTIONAL_RETIREMENT_RETURN.value * 100);
const destructiveGrowthPct = Math.round(GLOBAL_CYBERCRIME_CAGR.value * 100);

export type SierraAct =
  | "I"
  | "turn"
  | "II-solution"
  | "II-game"
  | "II-money"
  | "II-accountability"
  | "II-armory"
  | "II-climax"
  | "III";

export interface DemoSegment {
  id: string;
  title: string;
  narration: string;
  /** Maps to a slide renderer in the Sierra registry */
  slideId: DemoSlideId;
  bgColor?: BrutalCardBgColor;
  /** Tags for auto-composition */
  tags: ("hook" | "problem" | "solution" | "mechanism" | "feature" | "evidence" | "cta" | "financial")[];
  /** Sierra game metadata (optional — used by hackathon playlist) */
  act?: SierraAct;
  scoreAdd?: number;
  inventoryAdd?: { id: string; name: string; icon: string };
}

export interface DemoPlaylist {
  id: string;
  name: string;
  description: string;
  /** Ordered list of resolved segment objects */
  segments: DemoSegment[];
}

// ---------------------------------------------------------------------------
// Segment Library (~30 segments)
// ---------------------------------------------------------------------------

export const SEGMENTS = [
  // ── HOOKS & PROBLEM ──────────────────────────────────────────────────────
  {
    id: "hook-deaths",
    title: "150,000 Deaths Per Day",
    slideId: "daily-death-toll",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `${deathsDaily} people die every day from diseases that are theoretically curable. That is fifty-nine September elevenths. Every single day. But nobody invades anybody about it because cancer does not have oil.`,
  },
  {
    id: "hook-ratio",
    title: "604:1",
    slideId: "military-health-ratio",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `Your governments currently spend ${milToTrialRatio} dollars on the capacity for mass murder for every one dollar they spend testing which medicines work. Your chance of dying from terrorism: one in thirty million. Your chance of dying from disease: one hundred percent.`,
  },
  // ── SCRIPT-ALIGNED HACKATHON ─────────────────────────────────────────────
  {
    id: "misaligned-superintelligence",
    title: "Misaligned Superintelligence",
    slideId: "misaligned-superintelligence",
    bgColor: "foreground",
    tags: ["hook"],
    act: "I",
    narration: `Your government is a misaligned superintelligence. It controls trillions of dollars, billions of lives, and the allocation of your civilisation's entire productive capacity. And it is optimising for the wrong objective function.`,
  },
  {
    id: "earth-optimization-game",
    title: "The Earth Optimization Game",
    slideId: "earth-optimization-game",
    bgColor: "foreground",
    tags: ["hook"],
    act: "I",
    narration: `The objective of the Earth Optimisation Game is to align it — to force it to reallocate resources away from things that make you poorer and deader, toward things that make you healthier and wealthier.`,
  },
  {
    id: "daily-death-toll",
    title: "150,000 Deaths Per Day",
    slideId: "daily-death-toll",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `${deathsDaily} humans die every day from diseases that are theoretically curable. That is fifty-nine September elevenths. But nobody invades anybody about it because cancer does not have oil.`,
  },
  {
    id: "military-health-ratio",
    title: "604:1",
    slideId: "military-health-ratio",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    act: "I",
    narration: `Your governments currently spend ${milToTrialRatio} dollars on the capacity for mass murder for every one dollar they spend testing which medicines work. Your chance of dying from terrorism: one in thirty million. Your chance of dying from disease: one hundred percent.`,
  },
  {
    id: "economic-collapse-clock",
    title: "The Clock",
    slideId: "economic-collapse-clock",
    bgColor: "foreground",
    tags: ["problem"],
    act: "I",
    narration: `The parasitic economy — cybercrime, rent-seeking, military spending — grows at ${destructiveGrowthPct} percent per year. The productive economy grows at three percent. In fifteen years, it becomes more rational to steal than to produce. This is the clock.`,
  },
  {
    id: "game-over-moronia",
    title: "Moronia",
    slideId: "game-over-moronia",
    bgColor: "foreground",
    tags: ["problem"],
    act: "turn",
    narration: `Moronia was a planet that spent ${milToTrialRatio} times more on weapons than on curing disease. It no longer exists. Their allocation ratio correlates with yours at ninety-four point seven percent.`,
  },
  {
    id: "restore-from-wishonia",
    title: "Wishonia",
    slideId: "restore-from-wishonia",
    bgColor: "cyan",
    tags: ["solution"],
    act: "turn",
    scoreAdd: 0,
    narration: `Wishonia redirected one percent of its murder budget to clinical trials four thousand two hundred and ninety-seven years ago. That is where I am from. It is considerably nicer.`,
  },
  {
    id: "one-percent-treaty",
    title: "The Fix",
    slideId: "one-percent-treaty",
    bgColor: "yellow",
    tags: ["solution"],
    act: "II-solution",
    scoreAdd: 100_000,
    inventoryAdd: { id: "treaty", name: "1% TREATY", icon: "\u{1F4DC}" },
    narration: `The fix is not complicated. Redirect one percent of global military spending — ${treatyFundingB} billion dollars a year — to clinical trials. That is going from spending ninety-nine percent on bombs to ninety-eight percent on bombs. Radical, I know.`,
  },
  {
    id: "trial-acceleration-12x",
    title: "12.3× Acceleration",
    slideId: "trial-acceleration-12x",
    bgColor: "cyan",
    tags: ["solution", "evidence"],
    act: "II-solution",
    scoreAdd: 1_000_000,
    narration: `This would increase clinical trial capacity by ${trialCapacityX} times. It would compress the time to cure all diseases from ${oldQueue} years to ${newQueue} years. The maths is not in dispute.`,
  },
  {
    id: "pluralistic-ignorance-bug",
    title: "Pluralistic Ignorance",
    slideId: "pluralistic-ignorance-bug",
    bgColor: "background",
    tags: ["problem"],
    act: "II-solution",
    narration: `The problem is not that nobody wants this. The problem is that everybody wants it but thinks nobody else will agree to it. This is called pluralistic ignorance, and it is your civilisation's most expensive bug.`,
  },
  {
    id: "pairwise-budget-allocation",
    title: "Level 1: Allocate",
    slideId: "pairwise-budget-allocation",
    bgColor: "yellow",
    tags: ["mechanism", "cta"],
    act: "II-game",
    scoreAdd: 10_000_000,
    inventoryAdd: { id: "allocation", name: "ALLOCATION", icon: "\u{1F5F3}" },
    narration: `Step one: allocate. Indicate your preferred share of spending devoted to weapons versus clinical trials. Compare budget priorities head-to-head. Ten comparisons. Eigenvector decomposition. The same maths invented in nineteen seventy-seven that your species mostly uses to rank American football teams.`,
  },
  {
    id: "one-percent-referendum-vote",
    title: "Level 2: Vote",
    slideId: "one-percent-referendum-vote",
    bgColor: "pink",
    tags: ["mechanism", "cta"],
    act: "II-game",
    scoreAdd: 100_000_000,
    inventoryAdd: { id: "vote", name: "VOTE", icon: "\u270A" },
    narration: `Step two: vote yes or no — should all governments redirect one percent of military spending to clinical trials?`,
  },
  {
    id: "recruit-network-effect",
    title: "Level 3: Recruit",
    slideId: "recruit-network-effect",
    bgColor: "yellow",
    tags: ["mechanism", "cta"],
    act: "II-game",
    scoreAdd: 500_000_000,
    inventoryAdd: { id: "referral", name: "REFERRAL LINK", icon: "\u{1F517}" },
    narration: `Step three: get your shareable URL. Every friend who votes through your link earns you alignment points. Your network becomes your lobby. Decentralised. No headquarters. No PAC. Just maths and peer pressure.`,
  },
  {
    id: "government-track-record",
    title: "The Leaderboard",
    slideId: "government-track-record",
    bgColor: "background",
    tags: ["feature"],
    act: "II-accountability",
    scoreAdd: 3_000_000_000,
    inventoryAdd: { id: "alignment", name: "ALIGNMENT SCORE", icon: "\u{1F50D}" },
    narration: `Every politician ranked by the ratio of spending they have voted for: mass murder capacity versus clinical trial funding. A single number. Public. Immutable. On-chain. Your leaders are not evil. They are just optimising for the wrong metric. We changed the metric.`,
  },
  {
    id: "final-call-to-action",
    title: "Play Now",
    slideId: "final-call-to-action",
    bgColor: "pink",
    tags: ["cta"],
    act: "III",
    scoreAdd: 8_000_000_000,
    narration: `Your governments are the most powerful artificial intelligences your species has ever built. They process more information, control more resources, and make more consequential decisions than any LLM. And they are misaligned. Optimitron. Alignment software for the most powerful AIs on your planet — the ones made of people.`,
  },

  // ── RECOVERED LEGACY SIERRA BEATS ───────────────────────────────────────
  {
    id: "government-body-count",
    title: "The Body Count Ledger",
    slideId: "government-body-count",
    bgColor: "foreground",
    tags: ["problem", "evidence"],
    act: "I",
    narration: "Your governments kept score. You can read the numbers on the screen. Nobody held a referendum on any of it. They wrote it down. Then they filed it. Then they increased the budget.",
  },
  {
    id: "ai-hacker-breach",
    title: "The AI Breach",
    slideId: "ai-hacker-breach",
    bgColor: "foreground",
    tags: ["problem"],
    act: "I",
    narration: "That just happened. Well, a simulation of it. A real AI hacker would not have shown you the terminal. It would not have introduced itself. It would have taken 4.7 seconds and you would have noticed six months later when your bank called.",
  },
  {
    id: "public-vs-lobbyist-90to1",
    title: "90 to 1",
    slideId: "public-vs-lobbyist-90to1",
    bgColor: "yellow",
    tags: ["problem", "mechanism"],
    act: "II-solution",
    narration: `The public holds ${publicWealthT}. The concentrated interests who run your government hold $5 trillion. You outnumber them 90 to 1. Your species identified the exact collective action problem by which your governance fails, published it, assigned it in universities, and then continued to be governed by it for sixty years. You are not outgunned. You are just not coordinated.`,
  },
  {
    id: "healthcare-vs-military-roi",
    title: "ROI Contrast",
    slideId: "healthcare-vs-military-roi",
    bgColor: "cyan",
    tags: ["evidence", "financial", "solution"],
    act: "II-solution",
    narration: `Healthcare spending returns ${healthcareRoi} per dollar invested. Your murder budget returns ${militaryRoi}. Your species has not noticed this because the murder budget has a better lobby.`,
  },
  {
    id: "gdp-20-year-forecast",
    title: "Twenty-Year Forecast",
    slideId: "gdp-20-year-forecast",
    bgColor: "yellow",
    tags: ["evidence", "financial", "solution"],
    act: "II-solution",
    narration: `At current trajectory, your economy grows at 2.5 percent. Redirect 1 percent of the explosions budget, and it compounds at ${treatyCagr20} percent. Over twenty years, that is the difference between ${currentIncome20} per person per year and ${treatyIncome20} per person per year. One slider. Twenty-seven times more money.`,
  },
  {
    id: "congress-military-trials-ratio",
    title: "Congress Voted 1,094 to 1",
    slideId: "congress-military-trials-ratio",
    bgColor: "foreground",
    tags: ["problem", "evidence"],
    act: "II-accountability",
    narration: `Your Congress spent ${usMilitaryAnnualB} on the military this year. And $810 million on clinical trials. That is a ratio of 1,094 to 1. For every dollar spent trying to stop diseases from killing you, 1,094 dollars on new ways to kill other people's children. Both parties voted for this. It is not a left-right problem. It is a math problem.`,
  },
  {
    id: "fda-approval-delay-8yr",
    title: "The Queue Is the Killer",
    slideId: "fda-approval-delay-8yr",
    bgColor: "foreground",
    tags: ["problem", "evidence", "feature"],
    act: "II-armory",
    narration: `Vioxx killed 55,000 people from heart attacks. The FDA approved it. When patients started dying, someone filled out a PDF form. A PDF. Then they faxed it. Five years and tens of thousands of corpses later, someone noticed a pattern. This is your safety system. Meanwhile, your FDA makes treatments wait ${efficacyLagYears} years after they have already been proven safe. Just sitting there. Being safe. For every 1 person protected from a dangerous drug, ${typeIIErrorRatio} die waiting for a safe one locked in the approval cabinet. It is a lifeguard who confirms the life preserver floats, then locks it in a cabinet while a billion people drown in line for two life jackets.`,
  },
  {
    id: "drug-policy-natural-experiment",
    title: "Portugal vs America",
    slideId: "drug-policy-natural-experiment",
    bgColor: "cyan",
    tags: ["evidence", "feature"],
    act: "II-armory",
    narration: `Portugal decriminalised all drugs in 2001. Overdose deaths dropped 80 percent. America spent $${drugWarCostB.toLocaleString()} billion a year on the War on Drugs. Overdose deaths rose 1,700 percent. One country looked at the evidence. The other one declared war on it.`,
  },
  {
    id: "disease-cure-supply-chain",
    title: "How A Cure Actually Gets Made",
    slideId: "disease-cure-supply-chain",
    bgColor: "background",
    tags: ["solution", "mechanism", "feature"],
    act: "II-armory",
    narration: "Now look at this cured disease. The researcher in Lagos who found the cheaper trial does not know the lobbyist in Brussels who passed the directive. The lobbyist does not know the nonprofit in Manila that recruited a million voters. The voters do not know the bondholder in New York whose greed funded the campaign. The bondholder does not know the politician in Delhi who voted yes because the SuperPAC funded her opponent last time she voted no. Millions of people cooperated to cure this disease. No one gave orders.",
  },

  // Legacy alias — playlists referencing the old combined hook still work
  {
    id: "hook-mortality",
    title: "150,000 Deaths Per Day",
    slideId: "daily-death-toll",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `${deathsDaily} people die every day from treatable diseases. Your governments spend ${milToTrialRatio} dollars on weapons and military systems for every one dollar they spend on clinical trials. That is not a policy disagreement. That is a configuration error in a collective intelligence system controlling eight billion lives.`,
  },
  {
    id: "hook-misaligned-ai",
    title: "Misaligned Superintelligences",
    slideId: "misaligned-superintelligence",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `Your governments are misaligned superintelligences — collective intelligence systems optimising for re-election instead of welfare. Same problem as any misaligned AI, except these ones have nuclear weapons and a trillion-dollar budget. I built alignment software. It works on my planet. Let us see if your species can handle it.`,
  },
  {
    id: "hook-dysfunction-tax",
    title: "The $101 Trillion Bug",
    slideId: "misaligned-superintelligence",
    bgColor: "foreground",
    tags: ["hook", "problem", "financial"],
    narration: `Your governments cost you ${dysfunctionCostT} trillion dollars a year in dysfunction. That is ${dysfunctionPerPerson} per person, per year. Every person. Including the ones who cannot afford lunch. On my planet, when a system kills ${deathsDaily} people a day and costs ${dysfunctionCostT} trillion a year, we do not call it politics. We call it a bug. And we fix it.`,
  },
  {
    id: "hook-parasitic-economy",
    title: "The Collapse Clock",
    slideId: "economic-collapse-clock",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `The parasitic economy — military spending plus cybercrime — is growing at ${destructiveGrowthPct} percent per year. Productive GDP grows at three. At current rates, destruction exceeds fifty percent of GDP by ${collapseYear}. Every civilisation that reached this threshold collapsed. Soviet Union. Yugoslavia. Argentina. Zimbabwe. This is not a prediction. It is compound interest. You are currently on this trajectory. You chose it by not choosing.`,
  },

  // ── THE GAME ─────────────────────────────────────────────────────────────
  {
    id: "game-scoreboard",
    title: "The Scoreboard",
    slideId: "win-conditions-hale-income",
    bgColor: "background",
    tags: ["solution", "mechanism"],
    narration: `The entire game comes down to two numbers. Healthy life expectancy — how many years you actually live without disease dragging you down. And median income — how much a normal person can actually buy. Not GDP. Not billionaire wealth. The median. Move these two numbers and everything else follows. That is the scoreboard. Everything on this site exists to move it.`,
  },
  {
    id: "game-how-to-win",
    title: "How to Win",
    slideId: "three-scenarios-all-win",
    bgColor: "cyan",
    tags: ["mechanism", "financial"],
    narration: `If the scoreboard metrics hit their targets in fifteen years, VOTE holders get paid. Each point could be worth ${votePointValue}. If the targets are missed, depositors split the prize pool at ${poolMultiple} times their original deposit. That still beats a retirement account. Every player wins. The only losing move is not playing.`,
  },
  {
    id: "game-the-question",
    title: "The Question",
    slideId: "one-percent-referendum-vote",
    bgColor: "yellow",
    tags: ["mechanism", "cta"],
    narration: `Here is the question. Should all nations allocate just one percent of military spending to clinical trials? Your species currently spends ${milToTrialRatio} dollars on weapons for every one dollar on curing disease. Go ahead. Answer the question. It takes thirty seconds.`,
  },
  {
    id: "game-pluralistic-ignorance",
    title: "The Real Bug",
    slideId: "win-conditions-hale-income",
    bgColor: "background",
    tags: ["problem", "solution"],
    narration: `Four billion people would rather be healthy and rich than funding ${milToTrialRatio} times more weapons than cures. They just cannot see each other yet. That is called pluralistic ignorance. Everyone assumes nobody else would agree to a saner allocation — despite the fact that this is what literally everyone wants. This game makes the demand visible. Once it is visible, it is unstoppable.`,
  },

  // ── FINANCIAL MECHANISM ──────────────────────────────────────────────────
  {
    id: "prize-mechanism",
    title: "The Earth Optimization Prize",
    slideId: "three-scenarios-all-win",
    bgColor: "pink",
    tags: ["mechanism", "financial"],
    narration: `The Prize is a dominant assurance contract. Deposit money. It grows at ${prizeReturnPct} percent annually in the Wishocratic Earth Optimization Fund. If the targets are met, VOTE holders split the pool. If they are missed, depositors get ${poolMultiple} times their money back. The break-even probability is one in ${breakEvenOneIn} million. Even pessimists should take this bet. You are not donating. You are making a bet where the worst case is multiplying your money.`,
  },
  {
    id: "prize-no-downside",
    title: "You Cannot Lose",
    slideId: "three-scenarios-all-win",
    bgColor: "yellow",
    tags: ["financial", "cta"],
    narration: `Targets met: humanity gets cured, you get paid. Targets missed: your deposit grew ${poolMultiple} times. That is not charity. That is not gambling. That is a financial instrument where the downside is becoming richer and the upside is saving civilisation. The only scenario where you lose is the one where you do not play.`,
  },

  {
    id: "treaty-one-percent",
    title: "The 1% Fix",
    slideId: "one-percent-treaty",
    bgColor: "yellow",
    tags: ["solution"],
    narration: `The fix is not complicated. Redirect one percent of global military spending — ${treatyFundingB} billion dollars a year — to clinical trials. That is going from spending ninety-nine percent on bombs to ninety-eight percent on bombs. Radical, I know. This would increase clinical trial capacity by ${trialCapacityX} times. It would compress the time to cure all diseases from ${oldQueue} years to ${newQueue}. The maths is not in dispute.`,
  },

  // ── EVIDENCE & UNIT ECONOMICS ───────────────────────────────────────────
  {
    id: "evidence-viral-doubling",
    title: "The Doubling Model",
    slideId: "viral-doubling-to-4b",
    bgColor: "yellow",
    tags: ["evidence", "mechanism"],
    narration: `Tell two people. They each tell two more. Twenty-eight rounds of this reaches ${tippingPointM} million people — Chenoweth's three point five percent tipping point. No campaign in history that reached this threshold ever failed. At one round per week, that is eight months to critical mass. Your species invented the maths. Use it.`,
  },
  {
    id: "evidence-personal-upside",
    title: "Your Personal Upside",
    slideId: "personal-income-3-timelines",
    bgColor: "cyan",
    tags: ["financial"],
    narration: `You currently lose ${dysfunctionPerPerson} per year to political dysfunction. That is your share of the ${dysfunctionCostT} trillion dollar bug. If the one percent treaty passes, your lifetime income gains are ${treatyGainM} million dollars. Per person. Not per country. Per person. This is not philanthropy. This is the largest investment opportunity in the history of your species. The cost of not playing is ${treatyGainM} million dollars.`,
  },

  // ── COUNTRY COMPARISONS ──────────────────────────────────────────────────
  {
    id: "countries-leaderboard",
    title: "Government Rankings",
    slideId: "government-track-record",
    bgColor: "cyan",
    tags: ["evidence"],
    narration: `Here is where your country ranks. Singapore has the highest healthy life expectancy on the list and spends a fraction of what the United States spends on healthcare. Japan has a ninety-eight percent murder clearance rate and an incarceration rate of thirty-eight per hundred thousand. The United States has a fifty-two percent clearance rate and five hundred and thirty-one per hundred thousand. Same species. Different configuration.`,
  },
  {
    id: "countries-singapore",
    title: "The Singapore Proof",
    slideId: "government-track-record",
    bgColor: "cyan",
    tags: ["evidence"],
    narration: `Singapore spends a quarter of what America spends on healthcare and their people live ${singaporeLE - usLE} years longer. It is like watching someone pay four times more for a worse sandwich and then insist sandwiches are impossible. Zero body count since independence. Zero nuclear warheads. Highest GDP per capita on the list. It is almost as if killing people is not actually a prerequisite for running a successful country. Weird.`,
  },
  {
    id: "countries-body-count",
    title: "The Body Count",
    slideId: "government-track-record",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `We ranked every major government by how many people they have killed since nineteen forty-five. Nuclear warheads stockpiled. Military spending burned. Civilians bombed. Drug war prisoners caged. Murders they could not be bothered to solve. The data is public. Your governments just hope you never look at it all in one place.`,
  },

  // ── FEATURES ─────────────────────────────────────────────────────────────
  {
    id: "feature-wishocracy",
    title: "Wishocracy",
    slideId: "pairwise-budget-allocation",
    bgColor: "yellow",
    tags: ["feature"],
    narration: `Pick between two things. Then two more. Before you know it you have designed a coherent budget allocation. Eigenvector decomposition produces stable preference weights from as few as ten comparisons. Your species invented this maths in nineteen seventy-seven. You mostly used it to rank football teams. We use it to ask eight billion people what they actually want. Democracy in four minutes.`,
  },
  {
    id: "feature-alignment",
    title: "Politician Alignment",
    slideId: "alignment-switch",
    bgColor: "pink",
    tags: ["feature"],
    narration: `Compare your budget priorities against real politician voting records. Each official gets a Citizen Alignment Score — a single number that answers how much they actually represent you. On my planet, officials who ignore citizen preferences get replaced in four minutes. Here, you re-elect them for decades and then wonder why nothing works. This scoreboard makes the gap impossible to ignore.`,
  },
  {
    id: "feature-dfda",
    title: "Decentralized FDA",
    slideId: "armory",
    bgColor: "cyan",
    tags: ["feature"],
    narration: `Your FDA makes treatments wait ${efficacyLagYears} years after they have already been proven safe. Just sitting there. Being safe. While ${fdaDelayDeathsM} million people died waiting. The decentralized FDA runs pragmatic trials at two percent of the cost and ${trialCostReductionX} times the speed. Real patients, real conditions, real data. No eight-year queue to test something that already works.`,
  },
  {
    id: "feature-optimizer",
    title: "The Optimizer",
    slideId: "armory",
    bgColor: "background",
    tags: ["feature"],
    narration: `Give it two time series. It tells you what causes what. Drug and symptom? Policy and outcome? Spending and welfare? Same engine. Domain-agnostic causal inference using Bradford Hill criteria, temporal alignment, and predictor impact scores. Your scientists take twelve years. This takes seconds. And it works on anything with data.`,
  },
  {
    id: "feature-chat",
    title: "Talk to Wishonia",
    slideId: "armory",
    bgColor: "cyan",
    tags: ["feature"],
    narration: `Track health, meals, mood, and habits with an alien who has been running a planet for four thousand two hundred and thirty-seven years. She will tell you what is actually working. Your intuition will not like it. The same causal inference that works on countries works on you. Personal optimisation. Same maths, smaller scale.`,
  },
  {
    id: "feature-treasury",
    title: "The $WISH Token",
    slideId: "armory",
    bgColor: "yellow",
    tags: ["feature", "financial"],
    narration: `Zero point five percent transaction tax. That replaces your IRS. No seventy-four thousand page tax code. No eighty-three thousand employees. Revenue collection as a protocol feature. The tax funds Universal Basic Income distributed automatically via World ID, and Wishocratic budget allocation decided by eight billion people doing five minutes of pairwise comparisons. No politicians. No lobbyists. Just maths and peer pressure.`,
  },
  {
    id: "feature-architecture",
    title: "Under the Hood",
    slideId: "armory",
    bgColor: "background",
    tags: ["feature"],
    narration: `Fifteen packages. Twenty-six hundred tests. A domain-agnostic causal inference engine. Storacha for content-addressed storage. Hypercerts for verifiable attestations. Solidity for enforceable incentives. Fully typed TypeScript monorepo. All open source. All public. On my planet we call this the bare minimum. Here it seems to be called radical transparency.`,
  },

  // ── THE ARMORY ───────────────────────────────────────────────────────────
  {
    id: "armory-overview",
    title: "The Armory",
    slideId: "armory",
    bgColor: "background",
    tags: ["feature", "cta"],
    narration: `Eighteen tools. Policy generators. Budget optimisers. Causal inference engines. Health trackers. Outcome comparisons across a hundred jurisdictions. All free. All open source. Everything your species needs to run a civilisation that does not kill ${deathsDaily} people a day. Equip yourself.`,
  },

  // ── AGENCY REPORT CARDS ─────────────────────────────────────────────────
  {
    id: "agencies-report-cards",
    title: "Agency Report Cards",
    slideId: "government-track-record",
    bgColor: "background",
    tags: ["evidence", "problem"],
    narration: `We graded every US government agency on spending versus outcomes. Ten F's. Five D's. Two C's. One B. The EPA — the Environmental Protection Agency — is the only agency that demonstrably improves the thing it is supposed to improve. Every other agency either had no effect or made things worse. The DEA spent forty-seven billion a year and overdose deaths went up twenty times. The FDA's efficacy review has killed a hundred and two million people through delay. The Department of Education tripled its budget and test scores went down.`,
  },
  {
    id: "agencies-drug-war",
    title: "The Drug War",
    slideId: "government-track-record",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `Forty-seven billion dollars per year on the war on drugs. Overdose deaths have gone from five thousand when the DEA was created to a hundred and eight thousand at peak. That is a twenty-fold increase in the thing you are spending forty-seven billion dollars to prevent. Meanwhile, Portugal decriminalised all drugs in two thousand and one. Drug deaths dropped eighty percent. The data is not ambiguous.`,
  },
  {
    id: "agencies-fda-graveyard",
    title: "The Invisible Graveyard",
    slideId: "armory",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `The FDA requires ${efficacyLagYears} years of efficacy testing after a drug has already been proven safe. Over sixty-two years, this delay has killed an estimated ${fdaDelayDeathsM} million people. That is thirty-four thousand nine-elevens. Seventeen Holocausts. The drugs that did pass the review? Vioxx killed fifty-five thousand. OxyContin killed five hundred thousand. The total fines paid by those companies: thirty-nine billion. The total executives jailed: zero.`,
  },
  {
    id: "agencies-money-printer",
    title: "The Money Printer",
    slideId: "win-conditions-hale-income",
    bgColor: "yellow",
    tags: ["evidence", "problem", "financial"],
    narration: `The Federal Reserve has destroyed ninety-seven percent of the dollar's purchasing power since it was created in nineteen thirteen. If wages had kept pace with gold, the median family would earn five hundred and twenty-eight thousand dollars per year. The actual number is seventy-seven thousand five hundred. The economy grew three point eight percent per year without a central bank. With one, it grows two point seven percent. Canada had zero bank failures during the Great Depression. Without a central bank. The United States had nine thousand. With one.`,
  },
  {
    id: "agencies-government-lies",
    title: "The Lies",
    slideId: "armory",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `Tuskegee — they told Black men they were getting free healthcare while deliberately withholding treatment for forty years. MK-Ultra — the CIA drugged thousands of citizens without consent. Gulf of Tonkin — fabricated an attack to justify Vietnam. Fifty-eight thousand Americans and two million Vietnamese civilians murdered based on a lie the NSA later admitted never happened. Iraq WMDs — fabricated evidence presented to the United Nations. Three hundred thousand Iraqi civilians murdered. Cost: two point four trillion dollars. The lies are not theories. They are declassified.`,
  },
  {
    id: "agencies-ironic-laws",
    title: "Laws Named Wrong",
    slideId: "armory",
    bgColor: "yellow",
    tags: ["evidence", "problem"],
    narration: `The Affordable Care Act — premiums increased a hundred and five percent. The Drug Free America Act — overdose deaths up six hundred percent. The Department of Defense — renamed from Department of War. Thirteen offensive wars since the rename. Zero defensive. The PATRIOT Act — warrantless surveillance of every American. The Fair Sentencing Act — reduced the crack sentencing disparity from a hundred to one down to eighteen to one. Not eliminated. Just slightly less racist. Your species names its laws the opposite of what they do.`,
  },
  {
    id: "agencies-cia-coups",
    title: "Regime Changes",
    slideId: "government-track-record",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `Ten democracies overthrown by the CIA. Iran nineteen fifty-three — for an oil company. Guatemala nineteen fifty-four — for a fruit company. Chile nineteen seventy-three — for a copper company. Indonesia nineteen sixty-five — five hundred thousand to one million people murdered with lists provided by the CIA. Afghanistan — funded the fighters who became the Taliban and Al-Qaeda. Then spent two point three trillion and twenty years fighting them. All declassified. All documented.`,
  },
  {
    id: "agencies-corruption",
    title: "The Corruption Machine",
    slideId: "armory",
    bgColor: "pink",
    tags: ["evidence", "problem"],
    narration: `The pharmaceutical industry spends three hundred and seventy-four million dollars per year lobbying Congress. In return, Medicare was banned from negotiating drug prices for twenty years. Insulin costs three dollars and sixty-nine cents to manufacture. It sells for three hundred dollars. Sixty-five percent of retiring members of Congress become lobbyists. Three of the last five FDA commissioners went to work for pharmaceutical companies. Members of Congress outperform the stock market by six to twelve percent. Zero have been criminally prosecuted for insider trading.`,
  },

  // ── CLOSES ───────────────────────────────────────────────────────────────
  {
    id: "close-play-now",
    title: "Play Now",
    slideId: "final-call-to-action",
    bgColor: "pink",
    tags: ["cta"],
    narration: `Your species has the data. It has the solutions. Four billion people probably agree on this — they just cannot see each other yet. That is called pluralistic ignorance. This game fixes it. Vote. Share. Win. Free. Thirty seconds. No catch. The only way to lose is to not play.`,
  },
  {
    id: "close-hackathon",
    title: "Try It Now",
    slideId: "final-call-to-action",
    bgColor: "pink",
    tags: ["cta"],
    narration: `Optimitron. Alignment software for the most powerful AIs on your planet — the ones made of people. The code is public. The data is public. The maths works. The only missing variable is you. Play now.`,
  },
  {
    id: "close-investor",
    title: "The Opportunity",
    slideId: "final-call-to-action",
    bgColor: "pink",
    tags: ["cta", "financial"],
    narration: `The break-even probability is one in ${breakEvenOneIn} million. The potential upside is ${treatyGainM} million dollars per person in lifetime income gains. These are not aspirational numbers. They are compound interest and published research. The question is not whether this works. The question is whether your species will use it.`,
  },

  // ── SIERRA HACKATHON — NEW SLIDES ─────────────────────────────────────────
  {
    id: "daily-death-toll-cold-open",
    title: "150,000 Deaths Per Day",
    slideId: "daily-death-toll",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    act: "I",
    narration: `${deathsDaily} humans die every day from diseases that are theoretically curable. That is fifty-nine September elevenths. But nobody invades anybody about it because cancer does not have oil.`,
  },
  {
    id: "global-failed-state",
    title: "Global Failed State",
    slideId: "global-failed-state",
    bgColor: "foreground",
    tags: ["problem"],
    act: "I",
    narration: `When stealing becomes more rational than producing, people stop producing. This is not a theory. Somalia. Venezuela. Lebanon. The productive people leave or die. The ones who remain have nothing left to steal. So they steal from each other. The entire economy becomes extraction. Nothing gets built. Nothing gets maintained. Nothing gets cured. That is where the clock ends. Not in one country. Everywhere.`,
  },
  {
    id: "ai-hacker-spiral",
    title: "The AI Hacker Spiral",
    slideId: "ai-hacker-spiral",
    bgColor: "foreground",
    tags: ["problem"],
    act: "I",
    narration: `It gets worse. North Korea, Russia, and criminal syndicates are already using AI to generate autonomous hacking agents. Millions of them. They steal to fund more compute. More compute creates more hackers. More hackers steal more. This is a recursive exponential loop. Your species built the tools for its own extraction. And every dollar stolen funds the next generation of thieves.`,
  },
  {
    id: "inflation-wage-theft",
    title: "Your Paycheck Already Got Stolen",
    slideId: "inflation-wage-theft",
    bgColor: "foreground",
    tags: ["problem", "financial"],
    act: "I",
    narration: `You do not have to wait for the collapse. It already started. Your central bank has destroyed ninety-seven percent of the dollar's purchasing power since nineteen thirteen. If wages had kept pace, the median family would earn five hundred and twenty-eight thousand dollars a year. The actual number is seventy-seven thousand five hundred. The difference went to fund endless war and bail out the banks that lost your money. Your paycheck is being stolen every year. They just call it monetary policy so you do not notice.`,
  },
  {
    id: "economic-virtuous-loop",
    title: "The Compounding Loop",
    slideId: "economic-virtuous-loop",
    bgColor: "yellow",
    tags: ["solution", "evidence"],
    act: "II-solution",
    scoreAdd: 2_000_000,
    narration: `Here is how that turns into wealth. Disease currently drags down ${diseaseBurdenGdpPct} percent of global GDP — ${diseaseCostT} trillion dollars a year in lost productivity and medical costs. Every disease you cure unlocks a permanent slice of that. Freed workers produce more. More production generates more tax revenue. More revenue funds more trials. More trials cure more diseases. It compounds. Healthcare spending returns ${healthcareRoi} per dollar invested versus ${militaryRoi} for military spending. At current trajectory, your economy grows at two point five percent. Redirect the spending, cure the diseases, and it compounds at ${treatyCagr20} percent. Over twenty years, that is the difference between ${currentIncome20} per person and ${treatyIncome20} per person. That is not a fantasy. That is compound interest applied to not killing people.`,
  },
  {
    id: "dysfunction-tax-101t",
    title: "The $101 Trillion Bug",
    slideId: "dysfunction-tax-101t",
    bgColor: "foreground",
    tags: ["problem", "financial"],
    act: "II-solution",
    narration: `How expensive is that bug? Health innovation delays: thirty-four trillion dollars a year. Migration restrictions: fifty-seven trillion. Lead poisoning: six trillion. Underfunded science: four trillion. Total: one hundred and one trillion dollars per year in unrealised potential. That is eighty-eight percent of global GDP — wasted because your governments cannot coordinate on things literally everyone agrees on.`,
  },
  {
    id: "win-conditions-hale-income-full",
    title: "The Scoreboard",
    slideId: "win-conditions-hale-income",
    bgColor: "background",
    tags: ["solution"],
    act: "II-solution",
    scoreAdd: 5_000_000,
    narration: `The entire game comes down to two numbers. Healthy life expectancy: currently ${currentHale} years, target ${targetHale}. Median income: currently ${currentAvgIncomeK15} thousand dollars, target ${targetAvgIncomeK15} thousand. Move these two numbers and everything else follows. That is the scoreboard. Everything on this site exists to move it.`,
  },
  {
    id: "vote-value-asymmetry",
    title: "$0.06",
    slideId: "vote-value-asymmetry",
    bgColor: "foreground",
    tags: ["evidence"],
    act: "II-game",
    scoreAdd: 200_000_000,
    narration: `That vote took thirty seconds. At the global average hourly income, your time cost six cents. The upside if the Treaty passes: fifteen point seven million dollars. Per person. That is a ratio of two hundred and forty-five million to one. On my planet we just call it arithmetic.`,
  },
  {
    id: "prize-pool-vs-index-fund",
    title: "Better Than Your Retirement Fund",
    slideId: "prize-pool-vs-index-fund",
    bgColor: "pink",
    tags: ["financial"],
    act: "II-money",
    scoreAdd: 650_000_000,
    narration: `Step four: deposit into the Earth Optimization Prize Pool. The pool is not sitting in a savings account. It is invested across the most innovative startup companies on Earth — achieving ${prizeReturnPct} percent annual growth. Your retirement fund is parked in sclerotic rent-seeking corporations earning ${conventionalReturnPct} percent. The prize pool outperforms it by double. You were going to invest that money anyway. Invest it here, where the returns are better and the side effect is curing all disease.`,
  },
  {
    id: "dominant-assurance-contract-full",
    title: "How the Prize Works",
    slideId: "dominant-assurance-contract",
    bgColor: "cyan",
    tags: ["financial", "mechanism"],
    act: "II-money",
    scoreAdd: 800_000_000,
    inventoryAdd: { id: "prize-deposit", name: "PRIZE DEPOSIT", icon: "🪙" },
    narration: `Deposit one hundred dollars into the VC-diversified fund. Two things can happen. If Earth hits its targets, the pool unlocks and VOTE point holders split it. If Earth misses, your hundred dollars still grew at ${prizeReturnPct} percent a year — ${poolMultiple} times your money back. Both paths pay. There is no path where you lose.`,
  },
  {
    id: "vote-point-dollar-value",
    title: "VOTE Point Value",
    slideId: "vote-point-dollar-value",
    bgColor: "yellow",
    tags: ["financial"],
    act: "II-money",
    scoreAdd: 1_000_000_000,
    inventoryAdd: { id: "vote-points", name: "VOTE POINTS ×2", icon: "🥈" },
    narration: `Now for the Vote Points. Every friend you got to play earned you one point. If the world's retirement savings compound in the prize pool at ${prizeReturnPct} percent instead of ${conventionalReturnPct}, each VOTE point is worth ${votePointValue}. Two friends playing: double that. Ten friends: ten times. Points cannot be bought. They can only be earned by getting real people to play the game. The more friends you bring in, the bigger the prize pool gets, the more valuable everyone's points become.`,
  },
  {
    id: "three-scenarios-all-win-full",
    title: "You Cannot Lose",
    slideId: "three-scenarios-all-win",
    bgColor: "pink",
    tags: ["financial", "cta"],
    act: "II-money",
    scoreAdd: 1_500_000_000,
    narration: `But wait — if humanity wins, does my deposit go to VOTE holders instead of back to me? Yes. And here is why that is fine. First: get even two friends to play and you have Vote Points worth far more than your deposit. Second: if humanity wins, everyone is ${treatyIncomeMultiplier} times richer. Your one hundred dollar deposit vanishes into a world where your lifetime income just increased by ${treatyGainM} million dollars. You do not mourn the one hundred dollars. You are too busy being a multimillionaire in a civilisation that cured all disease. The only way to lose is not to play.`,
  },
  {
    id: "alignment-switch",
    title: "We Changed the Metric",
    slideId: "alignment-switch",
    bgColor: "foreground",
    tags: ["solution"],
    act: "II-accountability",
    scoreAdd: 4_000_000_000,
    narration: `Your leaders are not evil. They are just optimising for the wrong metric. We changed the metric.`,
  },
  {
    id: "decentralized-fda",
    title: "The Decentralized FDA",
    slideId: "decentralized-fda",
    bgColor: "cyan",
    tags: ["feature"],
    act: "II-armory",
    scoreAdd: 4_200_000_000,
    narration: `Your FDA makes treatments wait ${efficacyLagYears} years after they have already been proven safe. Just sitting there. Being safe. While ${fdaDelayDeathsM} million people died waiting. The decentralized FDA runs pragmatic trials at ${pragmaticTrialCost} dollars per patient instead of ${traditionalTrialCostK} thousand. Same patients. Real-world conditions instead of artificial ones. ${trialCostReductionX} times cheaper. ${trialCapacityX} times more trial capacity. The drugs that did pass the FDA's review? Vioxx killed fifty-five thousand. OxyContin killed five hundred thousand. Total executives jailed: zero. We can do better. We are doing better.`,
  },
  {
    id: "incentive-alignment-bonds",
    title: "Incentive Alignment Bonds",
    slideId: "incentive-alignment-bonds",
    bgColor: "pink",
    tags: ["feature", "financial"],
    act: "II-armory",
    scoreAdd: 4_500_000_000,
    narration: `Incentive Alignment Bonds. Sell one billion dollars of these on-chain. Use the proceeds to fund the one percent Treaty campaign. When the treaty passes, it generates ${treatyFundingB} billion dollars per year. That revenue splits: eighty percent to clinical trials — the actual public good. Ten percent back to bond holders — your return on investment. Ten percent to a SuperPAC that funds politicians algorithmically based on their Alignment Score. Not based on who they had dinner with.`,
  },
  {
    id: "smart-contract-superpac",
    title: "The Alignment SuperPAC",
    slideId: "smart-contract-superpac",
    bgColor: "cyan",
    tags: ["feature"],
    act: "II-armory",
    scoreAdd: 4_700_000_000,
    narration: `The remaining ten percent funds a SuperPAC — but not the kind your species is used to. This one funds politicians algorithmically, based on their Citizen Alignment Score. Vote for the treaty? Campaign funding flows to you automatically. Vote against it? Nothing. No dinners. No lobbyists. No phone calls. Just a smart contract that reads your voting record and pays accordingly.`,
  },
  {
    id: "optimal-governance-engines",
    title: "The Optimizer",
    slideId: "optimal-policy-generator",
    bgColor: "yellow",
    tags: ["feature"],
    act: "II-armory",
    scoreAdd: 5_000_000_000,
    narration: `For the politicians who actually want to align: the Optimal Policy Generator and Optimal Budget Generator. Feed them time-series data from hundreds of jurisdictions. Domain-agnostic causal inference — Bradford Hill criteria, temporal alignment, predictor impact scores. Two questions: which policies actually worked, and how much should you spend on each category? Portugal decriminalised all drugs in two thousand and one. Overdose deaths dropped eighty percent. America spent forty-seven billion dollars per year on the War on Drugs. Overdose deaths rose one thousand seven hundred percent. The machine found this. Your politicians ignored it. Singapore spends a quarter of what America spends on healthcare and their people live six years longer. The optimal budget is not the biggest budget. It is the smartest one.`,
  },
  {
    id: "ipfs-immutable-storage",
    title: "Storacha: Immutable Evidence",
    slideId: "ipfs-immutable-storage",
    bgColor: "background",
    tags: ["feature"],
    act: "II-armory",
    scoreAdd: 5_200_000_000,
    narration: `Four types of evidence — preference aggregations, policy analyses, health outcomes, budget optimisations — each one chained to the last via content-addressed CID links on Storacha. No government can delete it. No lobbyist can edit it. Break the chain? The hash won't match. Anyone can verify the entire history with nothing but a CID and an internet connection. If your government could delete the evidence, they would. They cannot. It is on IPFS.`,
  },
  {
    id: "impact-certificates",
    title: "Hypercerts: Verifiable Impact",
    slideId: "impact-certificates",
    bgColor: "pink",
    tags: ["feature"],
    act: "II-armory",
    scoreAdd: 5_400_000_000,
    narration: `Every claim of impact gets a Hypercert — a verifiable attestation published to AT Protocol that says exactly what was done, by whom, with what result. Recruit verified voters — Hypercert. Fund the prize pool — Hypercert. Score a politician's alignment with citizen preferences — Hypercert. Activity claims, measurements, evaluations. Permanent. Auditable. On Bluesky. If someone tells you they recruited a thousand voters, you ask for the Hypercert. If they do not have one, they did not recruit a thousand voters.`,
  },
  {
    id: "wish-token-protocol",
    title: "The $WISH Token",
    slideId: "decentralized-irs",
    bgColor: "yellow",
    tags: ["feature", "financial"],
    act: "II-armory",
    scoreAdd: 5_600_000_000,
    narration: `The WISH token replaces three things your government does badly. One: taxation. A flat zero point five percent transaction tax replaces your entire IRS. No seventy-four thousand page tax code. No eighty-three thousand employees. Revenue collection as a protocol feature. Two: welfare. Universal Basic Income distributed automatically via World ID. Everyone at the poverty line, no bureaucracy. Three: monetary policy. Algorithmic zero-percent inflation — captured productivity gains prevent the inflationary theft that destroyed ninety-seven percent of your dollar. Your central bank's job, done by a smart contract, in four lines of code.`,
  },
  {
    id: "pencil-supply-chain",
    title: "Billions of Brains",
    slideId: "pencil-supply-chain",
    bgColor: "foreground",
    tags: ["solution"],
    act: "II-armory",
    scoreAdd: 5_800_000_000,
    narration: `You are looking at this and thinking: this is impossibly complicated. Decentralized clinical trials, smart contracts, causal inference engines, immutable storage, algorithmic governance — who is going to build all of this? The answer: you do not need to know. Nobody knows how to make a pencil. Not one person on Earth. The wood comes from one country, the graphite from another, the rubber from a third, the paint from a fourth. Millions of people each doing one tiny step. No one coordinates them. The price system does. That is what the prize pool is. Four billion people, each with Vote Points worth ${votePointValue}, will figure out how to build a decentralized FDA the same way they figured out how to build a pencil. You do not need a plan. You need an incentive. And the game does not pick which solution wins. Researcher discovers cheaper trials? Gets paid. Lobbyist passes legislation? Gets paid. Nonprofit gets a million people to play? Gets paid. Every approach competes. The best ones get funded. That is not central planning. That is a market for saving civilisation.`,
  },
  {
    id: "personal-income-upside",
    title: "Your $15.7 Million",
    slideId: "personal-income-3-timelines",
    bgColor: "yellow",
    tags: ["financial", "cta"],
    act: "II-climax",
    scoreAdd: 6_000_000_000,
    inventoryAdd: { id: "claim", name: `$${personalUpsideM}M CLAIM`, icon: "📋" },
    narration: `If the one percent Treaty passes, your lifetime income gains are ${treatyGainM} million dollars. Per person. Not per country. Per person. You currently lose ${dysfunctionPerPerson} a year to political dysfunction — that is your share of the ${dysfunctionCostT} trillion dollar bug. This is not philanthropy. This is the largest investment opportunity in the history of your species. And the cost of not playing is ${treatyGainM} million dollars.`,
  },
  {
    id: "ten-billion-lives-saved",
    title: "10.7 Billion Lives",
    slideId: "ten-billion-lives-saved",
    bgColor: "cyan",
    tags: ["cta"],
    act: "III",
    scoreAdd: 7_500_000_000,
    narration: `${deathsDaily} deaths per day. ${timelineShiftYears} years of treatment acceleration from the combined trial capacity increase and efficacy lag elimination. A third of those deaths are avoidable with earlier cures. Multiply it out: ${totalLivesSavedB} billion lives. More than the total number of humans who have ever lived in a single century. Every share, every vote, every conversation moves the probability. The question is not whether your effort matters. It is how many hundred million lives it is worth.`,
  },

  // ── PROTOCOL LABS HACKATHON — trimmed narration for ~3:30 ──────────────────
  {
    id: "earth-optimization-game-brief",
    title: "The Earth Optimization Game",
    slideId: "earth-optimization-game",
    tags: ["hook"],
    act: "I",
    narration: "The Earth Optimization Game. Optimize your governments to stop making everyone poorer and deader and start making everyone healthier and wealthier!",
  },
  {
    id: "military-waste-170t",
    title: "$170 Trillion",
    slideId: "military-waste-170t",
    tags: ["hook", "problem"],
    act: "I",
    narration: `Since 1913, your governments have printed ${cumMilitarySpendingT} trillion dollars out of nothing and spent these nothing papers on murdering ${warDeathsSince1900M} million humans and destroying many valuable things those humans spent their entire lives building. Consequently your paycheck now buys 97 percent less due to the aforementioned destruction.`,
  },
  {
    id: "opportunity-cost-170t",
    title: "They Bought the Other Thing",
    slideId: "170t-opportunity-cost",
    tags: ["hook", "problem"],
    act: "I",
    narration: `Instead of murdering ${warDeathsSince1900M} million people and destroying everything they built, they could have funded ${Math.round(CUMULATIVE_MILITARY_SPENDING_FED_ERA.value / GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value).toLocaleString()} years of clinical trials. They bought the other thing. Through compounding effects, you would be ${optimalGovernanceIncomeMultiplier} times richer and significantly less diseased today if someone had aligned your governments properly in 1913. They did not. So that is what you are going to do.`,
  },
  {
    id: "misaligned-superintelligence-brief",
    title: "Misaligned Superintelligence",
    slideId: "misaligned-superintelligence",
    tags: ["hook", "problem"],
    act: "I",
    narration: `Your governments are misaligned superintelligences. Collective intelligence systems controlling trillions of dollars and eight billion lives. Stated objective: promote the general welfare. Actual objective: campaign contributions.`,
  },
  {
    id: "military-health-ratio-brief",
    title: "604:1",
    slideId: "military-health-ratio",
    tags: ["hook", "problem"],
    act: "I",
    narration: `So right now they currently spend ${milToTrialRatio} dollars on the capacity for mass murder for every one dollar testing which medicines work. ${unexploredPct} percent of drug-disease combinations have never been tested. Curing them all at current spending takes ${oldQueue} years. You will be dead in ${usLE}. I mention this not to be rude but because you seem weirdly calm about it.`,
  },
  {
    id: "economic-collapse-clock-brief",
    title: "Game Over",
    slideId: "economic-collapse-clock",
    tags: ["problem"],
    act: "turn",
    narration: `The parasitic economy — cybercrime plus military spending — is growing at ${destructiveGrowthPct} percent per year. The productive economy is growing at 3. Argentina collapsed at 38 percent. Yugoslavia at 40. The Soviet Union at 45. By ${collapseYear}, Earth crosses the same threshold. Think Somalia, but everywhere. But there is a save file.`,
  },
  {
    id: "compound-growth-scenarios",
    title: "Select an Earth",
    slideId: "compound-growth-scenarios",
    tags: ["solution"],
    act: "turn",
    narration: `Three timelines over 15 years. Status quo: parasitic economy overtakes productive. You get poorer and deader. The 1 percent treaty: all nations redirect 1 percent of military spending to clinical trials simultaneously — no one loses strategic advantage. Healthy people work more, earn more, and spend less on healthcare. That compounds. ${treatyHaleGainYears} more healthy years, ${treatyIncomeMultiplier} times richer. Optimal governance: end the ${dysfunctionCostT} trillion dollar Political Dysfunction Tax. ${optimalGovernanceIncomeMultiplier} times richer. Choose.`,
  },
  {
    id: "one-percent-treaty-brief",
    title: "The 1% Treaty",
    slideId: "one-percent-treaty",
    tags: ["solution"],
    act: "II-solution",
    narration: `Redirect 1 percent of the global military budget to pragmatic trials integrated into standard healthcare — ${recoveryTrialEfficiencyX} times more efficient than traditional trials. ${treatyFundingB} billion dollars a year. Trial capacity increases ${trialCapacityX} times. ${oldQueue} years compresses to ${newQueue}.`,
  },
  {
    id: "pairwise-budget-allocation-brief",
    title: "The Game",
    slideId: "pairwise-budget-allocation",
    tags: ["mechanism"],
    act: "II-game",
    narration: `You have seen what happens when politicians allocate your money. ${warDeathsSince1900M} million dead and a ${milToTrialRatio} to 1 ratio of bombs to cures. Wishocracy lets you do it instead. Each player allocates the global budget through pairwise comparisons — clinical trials versus military spending, education versus the drug war. Ten choices, two minutes. Eight billion preferences, one optimal budget.`,
  },
  {
    id: "eigenvector-budget-result",
    title: "The Budget",
    slideId: "eigenvector-budget-result",
    tags: ["mechanism"],
    act: "II-game",
    narration: "When you ask people what they want, cures beat bombs. Nobody has ever asked.",
  },
  {
    id: "pluralistic-ignorance-bug-brief",
    title: "Pluralistic Ignorance",
    slideId: "pluralistic-ignorance-bug",
    tags: ["problem", "mechanism"],
    act: "II-game",
    narration: "Everyone wants to end war and disease. But everyone thinks it's crazy because nobody else will agree to the steps to make it happen. So nobody does anything. Your economists call this pluralistic ignorance. I call this the dumbest reason a civilisation has ever continued dying and murdering each other.",
  },
  {
    id: "win-conditions-hale-income",
    title: "Win Conditions",
    slideId: "win-conditions-hale-income",
    tags: ["mechanism"],
    act: "II-game",
    narration: `The entire game comes down to two numbers. Healthy life expectancy: ${currentHale} years, target ${targetHale}. Median income: ${currentAvgIncomeK15} thousand dollars, target ${targetAvgIncomeK15} thousand. Your species has produced 4,000 pages of U.N. resolutions about these numbers. This game has two progress bars. We find the bars more effective.`,
  },
  {
    id: "three-scenarios-all-win",
    title: "The Fund",
    slideId: "three-scenarios-all-win",
    tags: ["mechanism", "financial"],
    act: "II-money",
    narration: `Billions of people have to overcome pluralistic ignorance and work together to achieve this. Since your species requires small pieces of paper with presidents on them before you will do anything, you create the Earth Optimization Prize Fund. The target is 1 percent of global savings, diversified across the venture capital sector, producing ${prizeReturnPct} percent annual returns. If humanity hits the median income and healthy lifespan targets by 2040, your Vote Points pay out. If humanity fails, you get your deposit back plus ${prizeReturnPct} percent annual returns — your hundred dollars still becomes ${poolMultiple} hundred. Two out of three outcomes are wins. The third option is Somalia.`,
  },
  {
    id: "dominant-assurance-contract",
    title: "The Prize",
    slideId: "dominant-assurance-contract",
    tags: ["mechanism", "financial"],
    act: "II-money",
    narration: `Vote, then share your referral link. Each friend who votes through your link earns you one VOTE point. Each point could be worth up to ${votePointValue}.`,
  },
  {
    id: "armory-brief",
    title: "The Armory",
    slideId: "armory",
    tags: ["feature"],
    act: "II-armory",
    narration: "Now you have the incentive. Here are the tools to hit the targets.",
  },
  {
    id: "decentralized-fda-brief",
    title: "Decentralized FDA",
    slideId: "decentralized-fda",
    tags: ["feature"],
    act: "II-armory",
    narration: `${compoundsProvenSafe} compounds are proven safe but ${unexploredPct} percent of their uses have never been tested. Your FDA makes patients wait ${efficacyLagYears} years after a drug is proven safe. The Decentralized FDA: real-time Outcome Labels and Treatment Rankings. ${trialCostReductionX} times cheaper. ${trialCapacityX} times more capacity.`,
  },
  {
    id: "optimal-policy-generator",
    title: "Optimal Policy Generator",
    slideId: "optimal-policy-generator",
    tags: ["feature"],
    act: "II-armory",
    narration: `The Optimal Policy Generator uses causal inference on hundreds of years of data across dozens of countries to grade every policy A through F by what actually happened. America spent ${drugWarCostB} billion dollars a year on the War on Drugs. Overdoses rose 1,700 percent. Portugal decriminalised drugs for almost nothing. Overdoses dropped 80 percent.`,
  },
  {
    id: "optimal-budget-generator",
    title: "Optimal Budget Generator",
    slideId: "optimal-budget-generator",
    tags: ["feature"],
    act: "II-armory",
    narration: `The Optimal Budget Generator finds the cheapest high performer per category. Singapore: 3,000 dollars per person on healthcare, lives to ${singaporeLE}. America: 12,000 dollars, lives to ${usLE}.`,
  },
  {
    id: "incentive-alignment-bonds-brief",
    title: "How to Train a Senator",
    slideId: "incentive-alignment-bonds",
    tags: ["feature", "financial"],
    act: "II-armory",
    narration: "Now you know what everyone wants and what the optimal budget is. How do you get your politicians to actually do it? Incentive Alignment Bonds. Raise 1 billion dollars from investors. Use it to fund politicians who vote for the treaty and defund the ones who do not. When the treaty passes, bondholders get perpetual returns proportional to the treaty percentage. Politicians get electoral support proportional to it. Every investor and every politician becomes a permanent lobbyist for expanding it. The math does the lobbying.",
  },
  {
    id: "decentralized-irs",
    title: "Decentralized IRS",
    slideId: "decentralized-irs",
    tags: ["feature"],
    act: "II-armory",
    narration: `Your tax code is 74,000 pages. It costs ${taxComplianceCostB} billion dollars a year in compliance. A 0.5 percent transaction tax does the same job in four lines of Solidity. No filing. No accountants. No lobbyist can bribe a smart contract to give their client a tax loophole.`,
  },
  {
    id: "decentralized-welfare",
    title: "Decentralized Welfare",
    slideId: "decentralized-welfare",
    tags: ["feature"],
    act: "II-armory",
    narration: "Your species already spends 13.5 trillion dollars a year on welfare to prevent starvation. Up to 675 billion of that is pure administrative waste. Universal basic income does the same job for 675 billion less bureaucracy.",
  },
  {
    id: "decentralized-federal-reserve",
    title: "Decentralized Fed",
    slideId: "decentralized-federal-reserve",
    tags: ["feature"],
    act: "II-armory",
    narration: "Twelve unelected humans meet eight times a year to decide how much your money is worth. When they print new money, it goes to banks and asset holders first. In 2020 they printed 4 trillion dollars. The wealth of the top 1 percent increased by exactly 4 trillion dollars that year. This smart contract replaces them. Zero percent inflation anchored to productivity growth. New money distributed equally to every human via UBI.",
  },
  {
    id: "ipfs-immutable-storage-brief",
    title: "Storacha + IPFS",
    slideId: "ipfs-immutable-storage",
    tags: ["feature"],
    act: "II-armory",
    narration: "The Optimal Policy Generator, Budget Generator, and Decentralized FDA are all powered by data collected through a decentralized census. 8 billion citizens verified via World ID. Budget preferences, treaty votes, health outcomes, impact metrics — stored on Storacha and pinned to IPFS. No government can delete it. No lobbyist can edit it.",
  },
  {
    id: "impact-certificates-brief",
    title: "Hypercerts",
    slideId: "impact-certificates",
    tags: ["feature"],
    act: "II-armory",
    narration: "Every action in the game mints a Hypercert on AT Protocol. Voter recruitment, fund deposits, budget allocations — each verified via World ID and published to Bluesky. Permanent, auditable impact receipts.",
  },
  {
    id: "ten-billion-lives-saved-brief",
    title: "10.7 Billion Lives",
    slideId: "ten-billion-lives-saved",
    tags: ["cta"],
    act: "III",
    narration: `${totalLivesSavedB} billion lives. ${totalSufferingQuad} quadrillion hours of suffering prevented. That is what 1 percent buys you.`,
  },
  {
    id: "final-call-to-action-brief",
    title: "Play Now",
    slideId: "final-call-to-action",
    tags: ["cta"],
    act: "III",
    narration: "Think about someone you love who is suffering right now. The treatment that would help them exists as an untested compound on a shelf, because the money bought a missile instead. That missile incinerated a child who would have grown up to discover the cure. You lose the treatment. You lose the scientist. You get the tax bill. You get to pay for her murder. One percent fixes this. One vote starts it. Go to optimitron dot com and play now.",
  },
  {
    id: "protocol-labs-credits",
    title: "Vote Now",
    slideId: "post-credits-aliens",
    tags: ["cta"],
    act: "III",
    narration: "The Earth Optimization Game is brought to you by the good humans at Protocol Labs funding the Commons, Hypercerts, Storacha, Worldcoin, and Base.",
  },
] satisfies readonly DemoSegment[];

// ---------------------------------------------------------------------------
// Segment registry
// ---------------------------------------------------------------------------

export type DemoSegmentId = (typeof SEGMENTS)[number]["id"];

const segmentById = Object.fromEntries(
  SEGMENTS.map((segment) => [segment.id, segment]),
) as Record<DemoSegmentId, DemoSegment>;

function resolveSegments(ids: readonly DemoSegmentId[]): DemoSegment[] {
  return ids.map((id) => segmentById[id]);
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

export const PLAYLISTS: DemoPlaylist[] = [
  {
    id: "protocol-labs",
    name: "Protocol Labs Hackathon (~3:30)",
    description: "Problem → solution → game → tools → PL tech → endgame",
    segments: resolveSegments([
      // Intro + Problem (~35s)
      "earth-optimization-game-brief",
      "protocol-labs-credits",
      "misaligned-superintelligence-brief",
      "military-waste-170t",
      "opportunity-cost-170t",
      "military-health-ratio-brief",
      // Game Over + Turn (~10s)
      "economic-collapse-clock-brief",
      "compound-growth-scenarios",
      // Solution
      "one-percent-treaty-brief",
      // The Incentive
      "pluralistic-ignorance-bug-brief",
      "win-conditions-hale-income",
      "three-scenarios-all-win",
      "dominant-assurance-contract",
      // The Tools
      "armory-brief",
      "decentralized-fda-brief",
      "optimal-policy-generator",
      "optimal-budget-generator",
      "pairwise-budget-allocation-brief",
      "eigenvector-budget-result",
      "incentive-alignment-bonds-brief",
      // Optimal Governance Tools
      "decentralized-federal-reserve",
      "decentralized-irs",
      "decentralized-welfare",
      // Protocol Labs Tech (~20s)
      "ipfs-immutable-storage-brief",
      "impact-certificates-brief",
      // Endgame (~15s)
      "ten-billion-lives-saved-brief",
      "final-call-to-action-brief",
    ]),
  },
  {
    id: "hackathon",
    name: "Hackathon Demo (~6 min)",
    description: "Sierra adventure game — 38 slides, full narrative arc with Armory",
    segments: resolveSegments([
      // Act I — The Horror
      "daily-death-toll-cold-open",
      "misaligned-superintelligence",
      "earth-optimization-game",
      "military-health-ratio",
      "economic-collapse-clock",
      "global-failed-state",
      "ai-hacker-spiral",
      "inflation-wage-theft",
      // GAME OVER / RESTORE
      "game-over-moronia",
      "restore-from-wishonia",
      // Act II — The Solution
      "one-percent-treaty",
      "trial-acceleration-12x",
      "economic-virtuous-loop",
      "pluralistic-ignorance-bug",
      "dysfunction-tax-101t",
      "win-conditions-hale-income-full",
      // Act II — The Game
      "pairwise-budget-allocation",
      "one-percent-referendum-vote",
      "vote-value-asymmetry",
      "recruit-network-effect",
      // Act II — The Money
      "prize-pool-vs-index-fund",
      "dominant-assurance-contract-full",
      "vote-point-dollar-value",
      "three-scenarios-all-win-full",
      // Act II — Accountability
      "government-track-record",
      "alignment-switch",
      // Act II — The Armory
      "decentralized-fda",
      "incentive-alignment-bonds",
      "smart-contract-superpac",
      "optimal-governance-engines",
      "ipfs-immutable-storage",
      "impact-certificates",
      "wish-token-protocol",
      "pencil-supply-chain",
      // Act II — Climax
      "personal-income-upside",
      // Act III — Endgame
      "ten-billion-lives-saved",
      "final-call-to-action",
    ]),
  },
  {
    id: "full-demo",
    name: "Full Demo (16 min)",
    description: "Complete walkthrough: evidence + features + agency report cards + corruption data",
    segments: resolveSegments([
      "hook-mortality",
      "hook-misaligned-ai",
      "game-scoreboard",
      "countries-leaderboard",
      "agencies-report-cards",
      "agencies-drug-war",
      "agencies-fda-graveyard",
      "agencies-money-printer",
      "game-the-question",
      "game-how-to-win",
      "evidence-viral-doubling",
      "game-pluralistic-ignorance",
      "agencies-government-lies",
      "agencies-ironic-laws",
      "agencies-cia-coups",
      "agencies-corruption",
      "hook-parasitic-economy",
      "feature-wishocracy",
      "feature-alignment",
      "feature-dfda",
      "feature-optimizer",
      "armory-overview",
      "evidence-personal-upside",
      "close-play-now",
    ]),
  },
  {
    id: "investor",
    name: "Investor Pitch (8 min)",
    description: "Financial mechanism + evidence + unit economics + ROI",
    segments: resolveSegments([
      "hook-mortality",
      "hook-dysfunction-tax",
      "game-scoreboard",
      "prize-mechanism",
      "prize-no-downside",
      "evidence-personal-upside",
      "evidence-viral-doubling",
      "countries-singapore",
      "feature-architecture",
      "close-investor",
    ]),
  },
  // ── YouTube Feature Series ─────────────────────────────────────────────
  {
    id: "youtube-prize",
    name: "The Earth Optimization Prize",
    description: "How the prize mechanism works + financial upside",
    segments: resolveSegments([
      "hook-mortality",
      "prize-mechanism",
      "prize-no-downside",
      "close-play-now",
    ]),
  },
  {
    id: "youtube-wishocracy",
    name: "Wishocracy: Democracy in 4 Minutes",
    description: "Pairwise budget allocation + eigenvector",
    segments: resolveSegments([
      "hook-misaligned-ai",
      "feature-wishocracy",
      "feature-alignment",
      "close-play-now",
    ]),
  },
  {
    id: "youtube-governments",
    name: "Government Report Cards",
    description: "Country rankings + Singapore comparison + body count",
    segments: resolveSegments([
      "hook-mortality",
      "countries-leaderboard",
      "countries-singapore",
      "countries-body-count",
      "close-play-now",
    ]),
  },
  {
    id: "youtube-dfda",
    name: "Decentralized FDA",
    description: "Why treatments take 8.2 years + the fix",
    segments: resolveSegments([
      "hook-mortality",
      "feature-dfda",
      "game-the-question",
      "close-play-now",
    ]),
  },
  {
    id: "youtube-treasury",
    name: "The $WISH Token",
    description: "0.5% transaction tax replaces the IRS + UBI",
    segments: resolveSegments([
      "hook-dysfunction-tax",
      "feature-treasury",
      "close-play-now",
    ]),
  },
  {
    id: "youtube-optimizer",
    name: "The Optimizer",
    description: "Domain-agnostic causal inference engine",
    segments: resolveSegments([
      "feature-optimizer",
      "feature-chat",
      "close-play-now",
    ]),
  },
  // ── NEW YouTube Videos (from agency/corruption data) ───────────────────
  {
    id: "youtube-agency-grades",
    name: "Agency Report Cards",
    description: "Every US agency graded — 10 F's, 5 D's, 1 B",
    segments: resolveSegments([
      "hook-misaligned-ai",
      "agencies-report-cards",
      "agencies-drug-war",
      "agencies-fda-graveyard",
      "close-play-now",
    ]),
  },
  {
    id: "youtube-government-lies",
    name: "Government Lies",
    description: "Tuskegee, MK-Ultra, Gulf of Tonkin, WMDs — all declassified",
    segments: resolveSegments([
      "agencies-government-lies",
      "agencies-cia-coups",
      "close-play-now",
    ]),
  },
  {
    id: "youtube-money-printer",
    name: "The Money Printer",
    description: "97% purchasing power lost, $528K stolen per family, economy grew faster without the Fed",
    segments: resolveSegments([
      "agencies-money-printer",
      "agencies-corruption",
      "close-play-now",
    ]),
  },
  {
    id: "youtube-ironic-laws",
    name: "Laws Named Wrong",
    description: "Affordable Care Act, Drug Free America, Department of Defense — named the opposite of what they do",
    segments: resolveSegments([
      "agencies-ironic-laws",
      "close-play-now",
    ]),
  },
  {
    id: "youtube-evidence",
    name: "The Math Behind the Prize",
    description: "Cost-effectiveness, trial costs, viral model, worked example, per-percentage-point value",
    segments: resolveSegments([
      "hook-mortality",
      "evidence-viral-doubling",
      "evidence-personal-upside",
      "close-investor",
    ]),
  },
  // ── Social Media Clips ─────────────────────────────────────────────────
  {
    id: "social-deaths",
    name: "150K Deaths (30s)",
    description: "The mortality hook",
    segments: resolveSegments(["hook-mortality"]),
  },
  {
    id: "social-604",
    name: "604:1 Ratio (30s)",
    description: "Military vs clinical trial spending",
    segments: resolveSegments(["hook-mortality"]),
  },
  {
    id: "social-singapore",
    name: "Singapore Proof (45s)",
    description: "Same species, different configuration",
    segments: resolveSegments(["countries-singapore"]),
  },
  {
    id: "social-collapse",
    name: "2037 Collapse (30s)",
    description: "Parasitic economy timeline",
    segments: resolveSegments(["hook-parasitic-economy"]),
  },
  {
    id: "social-cant-lose",
    name: "You Can't Lose (30s)",
    description: "Prize downside protection",
    segments: resolveSegments(["prize-no-downside"]),
  },
  {
    id: "social-drug-war",
    name: "$47B Drug War (45s)",
    description: "Spent $47B/yr, overdose deaths 20x worse",
    segments: resolveSegments(["agencies-drug-war"]),
  },
  {
    id: "social-fda-graveyard",
    name: "102M Murdered by FDA (45s)",
    description: "8.2-year efficacy lag, 102M dead",
    segments: resolveSegments(["agencies-fda-graveyard"]),
  },
  {
    id: "social-money-printer",
    name: "97% Dollar Destroyed (45s)",
    description: "$528K stolen per family since 1971",
    segments: resolveSegments(["agencies-money-printer"]),
  },
  {
    id: "social-government-lies",
    name: "Declassified Lies (60s)",
    description: "Tuskegee, MK-Ultra, Gulf of Tonkin, WMDs",
    segments: resolveSegments(["agencies-government-lies"]),
  },
  {
    id: "social-ironic-laws",
    name: "Laws Named Wrong (45s)",
    description: "Affordable Care Act premiums doubled",
    segments: resolveSegments(["agencies-ironic-laws"]),
  },
  {
    id: "social-cia-coups",
    name: "10 Democracies Overthrown (60s)",
    description: "CIA coups for corporate interests",
    segments: resolveSegments(["agencies-cia-coups"]),
  },
  {
    id: "social-corruption",
    name: "The Corruption Machine (45s)",
    description: "$374M pharma lobbying, insulin $3.69 to make, $300 to buy",
    segments: resolveSegments(["agencies-corruption"]),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const playlistMap = new Map(PLAYLISTS.map((p) => [p.id, p]));

export function getPlaylist(id: string): DemoPlaylist | undefined {
  return playlistMap.get(id);
}

export function getPlaylistSegments(playlistId: string): DemoSegment[] {
  const playlist = playlistMap.get(playlistId);
  if (!playlist) return [];
  return playlist.segments;
}

/** Estimate total seconds for a playlist at ~150 words/minute */
export function estimatePlaylistDuration(playlistId: string): number {
  const segments = getPlaylistSegments(playlistId);
  return segments.reduce((sum, s) => {
    const words = s.narration.split(/\s+/).length;
    return sum + Math.ceil((words / 150) * 60);
  }, 0);
}

/** Default playlist */
export const DEFAULT_PLAYLIST_ID = "full-demo";
