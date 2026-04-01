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
  BED_NETS_COST_PER_DALY,
  TREATY_VS_BED_NETS_MULTIPLIER,
  TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  CONTRIBUTION_LIVES_SAVED_PER_PCT_POINT,
  CONTRIBUTION_DALYS_PER_PCT_POINT,
  CONTRIBUTION_SUFFERING_HOURS_PER_PCT_POINT,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
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
const bedNetsMultiplier = Math.round(TREATY_VS_BED_NETS_MULTIPLIER.value).toLocaleString();
const riskAdjMultiplier = Math.round(TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER.value);
const treatyCostPerDaly = TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG.value.toFixed(5);
const bedNetsCost = BED_NETS_COST_PER_DALY.value.toFixed(0);
const livesPer1Pct = Math.round(CONTRIBUTION_LIVES_SAVED_PER_PCT_POINT.value / 1e6);
const dalysPer1Pct = (CONTRIBUTION_DALYS_PER_PCT_POINT.value / 1e9).toFixed(2);
const sufferingHrsPer1Pct = (CONTRIBUTION_SUFFERING_HOURS_PER_PCT_POINT.value / 1e12).toFixed(1);
const oldTrialCost = Math.round(TRADITIONAL_PHASE3_COST_PER_PATIENT.value).toLocaleString();
const newTrialCost = Math.round(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT.value).toLocaleString();
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
  /** Maps to a component in DemoPlayer */
  componentId: string;
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
  /** Ordered list of segment IDs */
  segmentIds: string[];
}

// ---------------------------------------------------------------------------
// Segment Library (~30 segments)
// ---------------------------------------------------------------------------

export const SEGMENTS: DemoSegment[] = [
  // ── HOOKS & PROBLEM ──────────────────────────────────────────────────────
  {
    id: "hook-deaths",
    title: "150,000 Deaths Per Day",
    componentId: "death-count",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `${deathsDaily} people die every day from diseases that are theoretically curable. That is fifty-nine September elevenths. Every single day. But nobody invades anybody about it because cancer does not have oil.`,
  },
  {
    id: "hook-ratio",
    title: "604:1",
    componentId: "military-pie",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `Your governments currently spend ${milToTrialRatio} dollars on the capacity for mass murder for every one dollar they spend testing which medicines work. Your chance of dying from terrorism: one in thirty million. Your chance of dying from disease: one hundred percent.`,
  },
  // ── SCRIPT-ALIGNED HACKATHON ─────────────────────────────────────────────
  {
    id: "script-1a-misaligned",
    title: "Misaligned Superintelligence",
    componentId: "terminal",
    bgColor: "foreground",
    tags: ["hook"],
    act: "I",
    narration: `Your government is a misaligned superintelligence. It controls trillions of dollars, billions of lives, and the allocation of your civilisation's entire productive capacity. And it is optimising for the wrong objective function.`,
  },
  {
    id: "script-1b-objective",
    title: "The Earth Optimization Game",
    componentId: "game-title",
    bgColor: "foreground",
    tags: ["hook"],
    act: "I",
    narration: `The objective of the Earth Optimisation Game is to align it — to force it to reallocate resources away from things that make you poorer and deader, toward things that make you healthier and wealthier.`,
  },
  {
    id: "script-2a-deaths",
    title: "150,000 Deaths Per Day",
    componentId: "death-count",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `${deathsDaily} humans die every day from diseases that are theoretically curable. That is fifty-nine September elevenths. But nobody invades anybody about it because cancer does not have oil.`,
  },
  {
    id: "script-2b-ratio",
    title: "604:1",
    componentId: "military-pie",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    act: "I",
    narration: `Your governments currently spend ${milToTrialRatio} dollars on the capacity for mass murder for every one dollar they spend testing which medicines work. Your chance of dying from terrorism: one in thirty million. Your chance of dying from disease: one hundred percent.`,
  },
  {
    id: "script-2c-clock",
    title: "The Clock",
    componentId: "collapse-clock",
    bgColor: "foreground",
    tags: ["problem"],
    act: "I",
    narration: `The parasitic economy — cybercrime, rent-seeking, military spending — grows at fifteen percent per year. The productive economy grows at three percent. In fifteen years, it becomes more rational to steal than to produce. This is the clock.`,
  },
  {
    id: "script-3a-moronia",
    title: "Moronia",
    componentId: "moronia",
    bgColor: "foreground",
    tags: ["problem"],
    act: "turn",
    narration: `Moronia was a planet that spent ${milToTrialRatio} times more on weapons than on curing disease. It no longer exists. Their allocation ratio correlates with yours at ninety-four point seven percent.`,
  },
  {
    id: "script-3b-wishonia",
    title: "Wishonia",
    componentId: "wishonia-slide",
    bgColor: "cyan",
    tags: ["solution"],
    act: "turn",
    scoreAdd: 0,
    narration: `Wishonia redirected one percent of its murder budget to clinical trials four thousand two hundred and ninety-seven years ago. That is where I am from. It is considerably nicer.`,
  },
  {
    id: "script-4a-fix",
    title: "The Fix",
    componentId: "one-percent-shift",
    bgColor: "yellow",
    tags: ["solution"],
    act: "II-solution",
    scoreAdd: 100_000,
    inventoryAdd: { id: "treaty", name: "1% TREATY", icon: "\u{1F4DC}" },
    narration: `The fix is not complicated. Redirect one percent of global military spending — twenty-seven billion dollars a year — to clinical trials. That is going from spending ninety-nine percent on bombs to ninety-eight percent on bombs. Radical, I know.`,
  },
  {
    id: "script-4b-acceleration",
    title: "12.3× Acceleration",
    componentId: "trial-acceleration",
    bgColor: "cyan",
    tags: ["solution", "evidence"],
    act: "II-solution",
    scoreAdd: 1_000_000,
    narration: `This would increase clinical trial capacity by ${trialCapacityX} times. It would compress the time to cure all diseases from ${oldQueue} years to ${newQueue} years. The maths is not in dispute.`,
  },
  {
    id: "script-4c-ignorance",
    title: "Pluralistic Ignorance",
    componentId: "pluralistic-ignorance",
    bgColor: "background",
    tags: ["problem"],
    act: "II-solution",
    narration: `The problem is not that nobody wants this. The problem is that everybody wants it but thinks nobody else will agree to it. This is called pluralistic ignorance, and it is your civilisation's most expensive bug.`,
  },
  {
    id: "script-5a-allocate",
    title: "Level 1: Allocate",
    componentId: "level-allocate",
    bgColor: "yellow",
    tags: ["mechanism", "cta"],
    act: "II-game",
    scoreAdd: 10_000_000,
    inventoryAdd: { id: "allocation", name: "ALLOCATION", icon: "\u{1F5F3}" },
    narration: `Step one: allocate. Indicate your preferred share of spending devoted to weapons versus clinical trials. Compare budget priorities head-to-head. Ten comparisons. Eigenvector decomposition. The same maths invented in nineteen seventy-seven that your species mostly uses to rank American football teams.`,
  },
  {
    id: "script-5b-vote",
    title: "Level 2: Vote",
    componentId: "level-vote",
    bgColor: "pink",
    tags: ["mechanism", "cta"],
    act: "II-game",
    scoreAdd: 100_000_000,
    inventoryAdd: { id: "vote", name: "VOTE", icon: "\u270A" },
    narration: `Step two: vote yes or no — should all governments redirect one percent of military spending to clinical trials?`,
  },
  {
    id: "script-5c-share",
    title: "Level 3: Recruit",
    componentId: "level-recruit",
    bgColor: "yellow",
    tags: ["mechanism", "cta"],
    act: "II-game",
    scoreAdd: 500_000_000,
    inventoryAdd: { id: "referral", name: "REFERRAL LINK", icon: "\u{1F517}" },
    narration: `Step three: get your shareable URL. Every friend who votes through your link earns you alignment points. Your network becomes your lobby. Decentralised. No headquarters. No PAC. Just maths and peer pressure.`,
  },
  {
    id: "script-6-prize",
    title: "The Prize",
    componentId: "prize-worked-example",
    bgColor: "pink",
    tags: ["financial", "mechanism"],
    narration: `Depositors deposit USDC into a smart contract and receive PRIZE claim tokens — their receipt for a share of the pool. If Earth hits its targets — median income up, healthy life years up — the funds unlock and flow to verified implementers. If Earth fails to hit its targets, PRIZE holders get their principal back. Plus the yield that accrued the entire time — roughly eleven times over fifteen years. You either fix civilisation or you eleven-x your money. The only way to lose is not to play.`,
  },
  {
    id: "script-8-leaderboard",
    title: "The Leaderboard",
    componentId: "government-leaderboard",
    bgColor: "background",
    tags: ["feature"],
    act: "II-accountability",
    scoreAdd: 3_000_000_000,
    inventoryAdd: { id: "alignment", name: "ALIGNMENT SCORE", icon: "\u{1F50D}" },
    narration: `Every politician ranked by the ratio of spending they have voted for: mass murder capacity versus clinical trial funding. A single number. Public. Immutable. On-chain. Your leaders are not evil. They are just optimising for the wrong metric. We changed the metric.`,
  },
  {
    id: "script-10-architecture",
    title: "Under the Hood",
    componentId: "architecture-stats",
    bgColor: "background",
    tags: ["feature"],
    narration: `Under the hood: fifteen packages, twenty-six hundred tests, domain-agnostic causal inference, full TypeScript monorepo. Storacha for immutable content-addressed storage. Hypercerts for verifiable attestations. Solidity for enforceable incentives. Everything is auditable. Nothing relies on trusting us.`,
  },
  {
    id: "script-11-close",
    title: "Play Now",
    componentId: "close",
    bgColor: "pink",
    tags: ["cta"],
    act: "III",
    scoreAdd: 8_000_000_000,
    narration: `Your governments are the most powerful artificial intelligences your species has ever built. They process more information, control more resources, and make more consequential decisions than any LLM. And they are misaligned. Optimitron. Alignment software for the most powerful AIs on your planet — the ones made of people.`,
  },

  // Legacy alias — playlists referencing the old combined hook still work
  {
    id: "hook-mortality",
    title: "150,000 Deaths Per Day",
    componentId: "death-count",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `${deathsDaily} people die every day from treatable diseases. Your governments spend ${milToTrialRatio} dollars on weapons and military systems for every one dollar they spend on clinical trials. That is not a policy disagreement. That is a configuration error in a collective intelligence system controlling eight billion lives.`,
  },
  {
    id: "hook-misaligned-ai",
    title: "Misaligned Superintelligences",
    componentId: "hook",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `Your governments are misaligned superintelligences — collective intelligence systems optimising for re-election instead of welfare. Same problem as any misaligned AI, except these ones have nuclear weapons and a trillion-dollar budget. I built alignment software. It works on my planet. Let us see if your species can handle it.`,
  },
  {
    id: "hook-dysfunction-tax",
    title: "The $101 Trillion Bug",
    componentId: "hook",
    bgColor: "foreground",
    tags: ["hook", "problem", "financial"],
    narration: `Your governments cost you ${dysfunctionCostT} trillion dollars a year in dysfunction. That is ${dysfunctionPerPerson} per person, per year. Every person. Including the ones who cannot afford lunch. On my planet, when a system kills ${deathsDaily} people a day and costs ${dysfunctionCostT} trillion a year, we do not call it politics. We call it a bug. And we fix it.`,
  },
  {
    id: "hook-parasitic-economy",
    title: "The Collapse Clock",
    componentId: "why-play",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `The parasitic economy — military spending plus cybercrime — is growing at fifteen percent per year. Productive GDP grows at three. At current rates, destruction exceeds fifty percent of GDP by twenty forty. Every civilisation that reached this threshold collapsed. Soviet Union. Yugoslavia. Argentina. Zimbabwe. This is not a prediction. It is compound interest. You are currently on this trajectory. You chose it by not choosing.`,
  },

  // ── THE GAME ─────────────────────────────────────────────────────────────
  {
    id: "game-scoreboard",
    title: "The Scoreboard",
    componentId: "scoreboard",
    bgColor: "background",
    tags: ["solution", "mechanism"],
    narration: `The entire game comes down to two numbers. Healthy life expectancy — how many years you actually live without disease dragging you down. And median income — how much a normal person can actually buy. Not GDP. Not billionaire wealth. The median. Move these two numbers and everything else follows. That is the scoreboard. Everything on this site exists to move it.`,
  },
  {
    id: "game-how-to-win",
    title: "How to Win",
    componentId: "how-to-win",
    bgColor: "cyan",
    tags: ["mechanism", "financial"],
    narration: `If the scoreboard metrics hit their targets in fifteen years, VOTE holders get paid. Each point could be worth ${votePointValue}. If the targets are missed, depositors split the prize pool at ${poolMultiple} times their original deposit. That still beats a retirement account. Every player wins. The only losing move is not playing.`,
  },
  {
    id: "game-how-to-play",
    title: "How to Play",
    componentId: "how-to-play",
    bgColor: "background",
    tags: ["mechanism", "cta"],
    narration: `Four steps. Vote and make your allocation — two minutes and you are a player. Get your referral link. Share it with two friends. They each share with two more. Twenty-eight rounds of this reaches ${tippingPointM} million people — the tipping point where no campaign in history has ever failed. Then deposit into the prize fund. If it works, you get paid. If it does not, you get ${poolMultiple} times your money back. You literally cannot lose your principal.`,
  },
  {
    id: "game-the-question",
    title: "The Question",
    componentId: "the-question",
    bgColor: "yellow",
    tags: ["mechanism", "cta"],
    narration: `Here is the question. Should all nations allocate just one percent of military spending to clinical trials? Your species currently spends ${milToTrialRatio} dollars on weapons for every one dollar on curing disease. Go ahead. Answer the question. It takes thirty seconds.`,
  },
  {
    id: "game-pluralistic-ignorance",
    title: "The Real Bug",
    componentId: "scoreboard",
    bgColor: "background",
    tags: ["problem", "solution"],
    narration: `Four billion people would rather be healthy and rich than funding ${milToTrialRatio} times more weapons than cures. They just cannot see each other yet. That is called pluralistic ignorance. Everyone assumes nobody else would agree to a saner allocation — despite the fact that this is what literally everyone wants. This game makes the demand visible. Once it is visible, it is unstoppable.`,
  },

  // ── FINANCIAL MECHANISM ──────────────────────────────────────────────────
  {
    id: "prize-mechanism",
    title: "The Earth Optimization Prize",
    componentId: "how-to-win",
    bgColor: "pink",
    tags: ["mechanism", "financial"],
    narration: `The Prize is a dominant assurance contract. Deposit money. It grows at seventeen point four percent annually in the Wishocratic Earth Optimization Fund. If the targets are met, VOTE holders split the pool. If they are missed, depositors get ${poolMultiple} times their money back. The break-even probability is one in fifteen thousand. Even pessimists should take this bet. You are not donating. You are making a bet where the worst case is multiplying your money.`,
  },
  {
    id: "prize-vote-points",
    title: "VOTE Points",
    componentId: "how-to-play",
    bgColor: "cyan",
    tags: ["mechanism", "financial"],
    narration: `Vote Points are earned by sharing your link. Each friend who votes gives you one point. Points are non-transferable and cannot be purchased. If targets are hit, each point could be worth ${votePointValue}. You are not recruiting. You are showing people the maths. Each person you tell proves one more person agrees and moves closer to the tipping point.`,
  },
  {
    id: "prize-no-downside",
    title: "You Cannot Lose",
    componentId: "how-to-win",
    bgColor: "yellow",
    tags: ["financial", "cta"],
    narration: `Targets met: humanity gets cured, you get paid. Targets missed: your deposit grew ${poolMultiple} times. That is not charity. That is not gambling. That is a financial instrument where the downside is becoming richer and the upside is saving civilisation. The only scenario where you lose is the one where you do not play.`,
  },

  {
    id: "treaty-one-percent",
    title: "The 1% Fix",
    componentId: "one-percent-shift",
    bgColor: "yellow",
    tags: ["solution"],
    narration: `The fix is not complicated. Redirect one percent of global military spending — twenty-seven billion dollars a year — to clinical trials. That is going from spending ninety-nine percent on bombs to ninety-eight percent on bombs. Radical, I know. This would increase clinical trial capacity by ${trialCapacityX} times. It would compress the time to cure all diseases from ${oldQueue} years to ${newQueue}. The maths is not in dispute.`,
  },

  // ── EVIDENCE & UNIT ECONOMICS ───────────────────────────────────────────
  {
    id: "evidence-cost-effectiveness",
    title: "Cost Per Life",
    componentId: "cost-effectiveness",
    bgColor: "cyan",
    tags: ["evidence", "financial"],
    narration: `The cost per disability-adjusted life year for this campaign is ${treatyCostPerDaly} dollars. Bed nets — the gold standard of cost-effective intervention — cost ${bedNetsCost} dollars per DALY. This is ${bedNetsMultiplier} times more cost-effective. Even if you adjust for political uncertainty at one percent success probability, it is still ${riskAdjMultiplier} times more cost-effective than bed nets. The maths is not ambiguous.`,
  },
  {
    id: "evidence-trial-cost",
    title: "Trial Costs",
    componentId: "trial-cost",
    bgColor: "background",
    tags: ["evidence"],
    narration: `A traditional Phase Three clinical trial costs ${oldTrialCost} dollars per patient. A pragmatic trial — same patients, real-world conditions instead of artificial ones — costs ${newTrialCost} dollars. That is a ${trialCapacityX} times increase in trial capacity for the same budget. The queue to cure all diseases drops from ${oldQueue} years to ${newQueue}. Not because of a miracle. Because of basic arithmetic applied to trial design.`,
  },
  {
    id: "evidence-historical-waste",
    title: "Historical Proof",
    componentId: "historical-waste",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `Your War on Terror cost eight trillion dollars. Terror attacks increased from roughly one thousand per year to seventeen thousand. Your War on Drugs costs ${drugWarCostB} billion dollars per year. Overdose deaths went from six thousand to a hundred and eight thousand. Your species has a pattern: spend more money, get worse results, declare victory, and increase the budget. On my planet, when something does not work, we stop doing it. Radical concept, apparently.`,
  },
  {
    id: "evidence-worked-example",
    title: "The Worked Example",
    componentId: "prize-worked-example",
    bgColor: "pink",
    tags: ["financial", "mechanism"],
    narration: `One hundred dollars deposited. Two friends recruited. If the targets are missed, your deposit grew to roughly one thousand one hundred dollars. If the targets are hit, your two Vote Points pay two times ${votePointValue} — that is three hundred and eighty-seven thousand dollars. The break-even probability is one in fifteen thousand. You do not need to be altruistic. You just need to be numerate.`,
  },
  {
    id: "evidence-viral-doubling",
    title: "The Doubling Model",
    componentId: "viral-doubling",
    bgColor: "yellow",
    tags: ["evidence", "mechanism"],
    narration: `Tell two people. They each tell two more. Twenty-eight rounds of this reaches ${tippingPointM} million people — Chenoweth's three point five percent tipping point. No campaign in history that reached this threshold ever failed. At one round per week, that is eight months to critical mass. Your species invented the maths. Use it.`,
  },
  {
    id: "evidence-per-pct-point",
    title: "The Value of One Percent",
    componentId: "per-pct-point",
    bgColor: "pink",
    tags: ["evidence", "mechanism"],
    narration: `Every percentage point you shift the probability is worth ${livesPer1Pct} million lives. ${dalysPer1Pct} billion disability-adjusted life years. ${sufferingHrsPer1Pct} trillion hours of suffering prevented. Every share, every vote, every conversation moves that probability. The question is not whether your effort matters. It is how many hundred million lives it is worth.`,
  },
  {
    id: "evidence-personal-upside",
    title: "Your Personal Upside",
    componentId: "personal-upside",
    bgColor: "cyan",
    tags: ["financial"],
    narration: `You currently lose ${dysfunctionPerPerson} per year to political dysfunction. That is your share of the ${dysfunctionCostT} trillion dollar bug. If the one percent treaty passes, your lifetime income gains are ${treatyGainM} million dollars. Per person. Not per country. Per person. This is not philanthropy. This is the largest investment opportunity in the history of your species. The cost of not playing is ${treatyGainM} million dollars.`,
  },

  // ── COUNTRY COMPARISONS ──────────────────────────────────────────────────
  {
    id: "countries-leaderboard",
    title: "Government Rankings",
    componentId: "government-leaderboard",
    bgColor: "cyan",
    tags: ["evidence"],
    narration: `Here is where your country ranks. Singapore has the highest healthy life expectancy on the list and spends a fraction of what the United States spends on healthcare. Japan has a ninety-eight percent murder clearance rate and an incarceration rate of thirty-eight per hundred thousand. The United States has a fifty-two percent clearance rate and five hundred and thirty-one per hundred thousand. Same species. Different configuration.`,
  },
  {
    id: "countries-singapore",
    title: "The Singapore Proof",
    componentId: "government-leaderboard",
    bgColor: "cyan",
    tags: ["evidence"],
    narration: `Singapore spends a quarter of what America spends on healthcare and their people live six years longer. It is like watching someone pay four times more for a worse sandwich and then insist sandwiches are impossible. Zero body count since independence. Zero nuclear warheads. Highest GDP per capita on the list. It is almost as if killing people is not actually a prerequisite for running a successful country. Weird.`,
  },
  {
    id: "countries-body-count",
    title: "The Body Count",
    componentId: "government-leaderboard",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `We ranked every major government by how many people they have killed since nineteen forty-five. Nuclear warheads stockpiled. Military spending burned. Civilians bombed. Drug war prisoners caged. Murders they could not be bothered to solve. The data is public. Your governments just hope you never look at it all in one place.`,
  },

  // ── FEATURES ─────────────────────────────────────────────────────────────
  {
    id: "feature-wishocracy",
    title: "Wishocracy",
    componentId: "wishocracy",
    bgColor: "yellow",
    tags: ["feature"],
    narration: `Pick between two things. Then two more. Before you know it you have designed a coherent budget allocation. Eigenvector decomposition produces stable preference weights from as few as ten comparisons. Your species invented this maths in nineteen seventy-seven. You mostly used it to rank football teams. We use it to ask eight billion people what they actually want. Democracy in four minutes.`,
  },
  {
    id: "feature-alignment",
    title: "Politician Alignment",
    componentId: "alignment",
    bgColor: "pink",
    tags: ["feature"],
    narration: `Compare your budget priorities against real politician voting records. Each official gets a Citizen Alignment Score — a single number that answers how much they actually represent you. On my planet, officials who ignore citizen preferences get replaced in four minutes. Here, you re-elect them for decades and then wonder why nothing works. This scoreboard makes the gap impossible to ignore.`,
  },
  {
    id: "feature-dfda",
    title: "Decentralized FDA",
    componentId: "tools",
    bgColor: "cyan",
    tags: ["feature"],
    narration: `Your FDA makes treatments wait eight point two years after they have already been proven safe. Just sitting there. Being safe. While a hundred and two million people died waiting. The decentralized FDA runs pragmatic trials at two percent of the cost and forty-four times the speed. Real patients, real conditions, real data. No eight-year queue to test something that already works.`,
  },
  {
    id: "feature-optimizer",
    title: "The Optimizer",
    componentId: "tools",
    bgColor: "background",
    tags: ["feature"],
    narration: `Give it two time series. It tells you what causes what. Drug and symptom? Policy and outcome? Spending and welfare? Same engine. Domain-agnostic causal inference using Bradford Hill criteria, temporal alignment, and predictor impact scores. Your scientists take twelve years. This takes seconds. And it works on anything with data.`,
  },
  {
    id: "feature-chat",
    title: "Talk to Wishonia",
    componentId: "tools",
    bgColor: "cyan",
    tags: ["feature"],
    narration: `Track health, meals, mood, and habits with an alien who has been running a planet for four thousand two hundred and thirty-seven years. She will tell you what is actually working. Your intuition will not like it. The same causal inference that works on countries works on you. Personal optimisation. Same maths, smaller scale.`,
  },
  {
    id: "feature-treasury",
    title: "The $WISH Token",
    componentId: "tools",
    bgColor: "yellow",
    tags: ["feature", "financial"],
    narration: `Zero point five percent transaction tax. That replaces your IRS. No seventy-four thousand page tax code. No eighty-three thousand employees. Revenue collection as a protocol feature. The tax funds Universal Basic Income distributed automatically via World ID, and Wishocratic budget allocation decided by eight billion people doing five minutes of pairwise comparisons. No politicians. No lobbyists. Just maths and peer pressure.`,
  },
  {
    id: "feature-architecture",
    title: "Under the Hood",
    componentId: "tools",
    bgColor: "background",
    tags: ["feature"],
    narration: `Fifteen packages. Twenty-six hundred tests. A domain-agnostic causal inference engine. Storacha for content-addressed storage. Hypercerts for verifiable attestations. Solidity for enforceable incentives. Fully typed TypeScript monorepo. All open source. All public. On my planet we call this the bare minimum. Here it seems to be called radical transparency.`,
  },

  // ── THE ARMORY ───────────────────────────────────────────────────────────
  {
    id: "armory-overview",
    title: "The Armory",
    componentId: "tools",
    bgColor: "background",
    tags: ["feature", "cta"],
    narration: `Eighteen tools. Policy generators. Budget optimisers. Causal inference engines. Health trackers. Outcome comparisons across a hundred jurisdictions. All free. All open source. Everything your species needs to run a civilisation that does not kill ${deathsDaily} people a day. Equip yourself.`,
  },

  // ── AGENCY REPORT CARDS ─────────────────────────────────────────────────
  {
    id: "agencies-report-cards",
    title: "Agency Report Cards",
    componentId: "government-leaderboard",
    bgColor: "background",
    tags: ["evidence", "problem"],
    narration: `We graded every US government agency on spending versus outcomes. Ten F's. Five D's. Two C's. One B. The EPA — the Environmental Protection Agency — is the only agency that demonstrably improves the thing it is supposed to improve. Every other agency either had no effect or made things worse. The DEA spent forty-seven billion a year and overdose deaths went up twenty times. The FDA's efficacy review has killed a hundred and two million people through delay. The Department of Education tripled its budget and test scores went down.`,
  },
  {
    id: "agencies-drug-war",
    title: "The Drug War",
    componentId: "government-leaderboard",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `Forty-seven billion dollars per year on the war on drugs. Overdose deaths have gone from five thousand when the DEA was created to a hundred and eight thousand at peak. That is a twenty-fold increase in the thing you are spending forty-seven billion dollars to prevent. Meanwhile, Portugal decriminalised all drugs in two thousand and one. Drug deaths dropped eighty percent. The data is not ambiguous.`,
  },
  {
    id: "agencies-fda-graveyard",
    title: "The Invisible Graveyard",
    componentId: "tools",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `The FDA requires eight point two years of efficacy testing after a drug has already been proven safe. Over sixty-two years, this delay has killed an estimated hundred and two million people. That is thirty-four thousand nine-elevens. Seventeen Holocausts. The drugs that did pass the review? Vioxx killed fifty-five thousand. OxyContin killed five hundred thousand. The total fines paid by those companies: thirty-nine billion. The total executives jailed: zero.`,
  },
  {
    id: "agencies-money-printer",
    title: "The Money Printer",
    componentId: "scoreboard",
    bgColor: "yellow",
    tags: ["evidence", "problem", "financial"],
    narration: `The Federal Reserve has destroyed ninety-seven percent of the dollar's purchasing power since it was created in nineteen thirteen. If wages had kept pace with gold, the median family would earn five hundred and twenty-eight thousand dollars per year. The actual number is seventy-seven thousand five hundred. The economy grew three point eight percent per year without a central bank. With one, it grows two point seven percent. Canada had zero bank failures during the Great Depression. Without a central bank. The United States had nine thousand. With one.`,
  },
  {
    id: "agencies-government-lies",
    title: "The Lies",
    componentId: "tools",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `Tuskegee — they told Black men they were getting free healthcare while deliberately withholding treatment for forty years. MK-Ultra — the CIA drugged thousands of citizens without consent. Gulf of Tonkin — fabricated an attack to justify Vietnam. Fifty-eight thousand Americans and two million Vietnamese civilians murdered based on a lie the NSA later admitted never happened. Iraq WMDs — fabricated evidence presented to the United Nations. Three hundred thousand Iraqi civilians murdered. Cost: two point four trillion dollars. The lies are not theories. They are declassified.`,
  },
  {
    id: "agencies-ironic-laws",
    title: "Laws Named Wrong",
    componentId: "tools",
    bgColor: "yellow",
    tags: ["evidence", "problem"],
    narration: `The Affordable Care Act — premiums increased a hundred and five percent. The Drug Free America Act — overdose deaths up six hundred percent. The Department of Defense — renamed from Department of War. Thirteen offensive wars since the rename. Zero defensive. The PATRIOT Act — warrantless surveillance of every American. The Fair Sentencing Act — reduced the crack sentencing disparity from a hundred to one down to eighteen to one. Not eliminated. Just slightly less racist. Your species names its laws the opposite of what they do.`,
  },
  {
    id: "agencies-cia-coups",
    title: "Regime Changes",
    componentId: "government-leaderboard",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `Ten democracies overthrown by the CIA. Iran nineteen fifty-three — for an oil company. Guatemala nineteen fifty-four — for a fruit company. Chile nineteen seventy-three — for a copper company. Indonesia nineteen sixty-five — five hundred thousand to one million people murdered with lists provided by the CIA. Afghanistan — funded the fighters who became the Taliban and Al-Qaeda. Then spent two point three trillion and twenty years fighting them. All declassified. All documented.`,
  },
  {
    id: "agencies-corruption",
    title: "The Corruption Machine",
    componentId: "tools",
    bgColor: "pink",
    tags: ["evidence", "problem"],
    narration: `The pharmaceutical industry spends three hundred and seventy-four million dollars per year lobbying Congress. In return, Medicare was banned from negotiating drug prices for twenty years. Insulin costs three dollars and sixty-nine cents to manufacture. It sells for three hundred dollars. Sixty-five percent of retiring members of Congress become lobbyists. Three of the last five FDA commissioners went to work for pharmaceutical companies. Members of Congress outperform the stock market by six to twelve percent. Zero have been criminally prosecuted for insider trading.`,
  },

  // ── CLOSES ───────────────────────────────────────────────────────────────
  {
    id: "close-play-now",
    title: "Play Now",
    componentId: "close",
    bgColor: "pink",
    tags: ["cta"],
    narration: `Your species has the data. It has the solutions. Four billion people probably agree on this — they just cannot see each other yet. That is called pluralistic ignorance. This game fixes it. Vote. Share. Win. Free. Thirty seconds. No catch. The only way to lose is to not play.`,
  },
  {
    id: "close-hackathon",
    title: "Try It Now",
    componentId: "close",
    bgColor: "pink",
    tags: ["cta"],
    narration: `Optimitron. Alignment software for the most powerful AIs on your planet — the ones made of people. The code is public. The data is public. The maths works. The only missing variable is you. Play now.`,
  },
  {
    id: "close-investor",
    title: "The Opportunity",
    componentId: "close",
    bgColor: "pink",
    tags: ["cta", "financial"],
    narration: `The break-even probability is one in fifteen thousand. The potential upside is fifteen point seven million dollars per person in lifetime income gains. The return on investment for the campaign is two hundred and fifty-nine thousand to one. These are not aspirational numbers. They are compound interest and published research. The question is not whether this works. The question is whether your species will use it.`,
  },

  // ── SIERRA HACKATHON — NEW SLIDES ─────────────────────────────────────────
  {
    id: "script-0-cold-open",
    title: "150,000 Deaths Per Day",
    componentId: "death-count",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    act: "I",
    narration: `${deathsDaily} humans die every day from diseases that are theoretically curable. That is fifty-nine September elevenths. But nobody invades anybody about it because cancer does not have oil.`,
  },
  {
    id: "script-2d-failed-state",
    title: "Global Failed State",
    componentId: "failed-state",
    bgColor: "foreground",
    tags: ["problem"],
    act: "I",
    narration: `When stealing becomes more rational than producing, people stop producing. This is not a theory. Somalia. Venezuela. Lebanon. The productive people leave or die. The ones who remain have nothing left to steal. So they steal from each other. The entire economy becomes extraction. Nothing gets built. Nothing gets maintained. Nothing gets cured. That is where the clock ends. Not in one country. Everywhere.`,
  },
  {
    id: "script-2e-ai-hackers",
    title: "The AI Hacker Spiral",
    componentId: "ai-spiral",
    bgColor: "foreground",
    tags: ["problem"],
    act: "I",
    narration: `It gets worse. North Korea, Russia, and criminal syndicates are already using AI to generate autonomous hacking agents. Millions of them. They steal to fund more compute. More compute creates more hackers. More hackers steal more. This is a recursive exponential loop. Your species built the tools for its own extraction. And every dollar stolen funds the next generation of thieves.`,
  },
  {
    id: "script-2f-paycheck-theft",
    title: "Your Paycheck Already Got Stolen",
    componentId: "paycheck-theft",
    bgColor: "foreground",
    tags: ["problem", "financial"],
    act: "I",
    narration: `You do not have to wait for the collapse. It already started. Your central bank has destroyed ninety-seven percent of the dollar's purchasing power since nineteen thirteen. If wages had kept pace, the median family would earn five hundred and twenty-eight thousand dollars a year. The actual number is seventy-seven thousand five hundred. The difference went to fund endless war and bail out the banks that lost your money. Your paycheck is being stolen every year. They just call it monetary policy so you do not notice.`,
  },
  {
    id: "script-4b2-compounding",
    title: "The Compounding Loop",
    componentId: "gdp-trajectory",
    bgColor: "yellow",
    tags: ["solution", "evidence"],
    act: "II-solution",
    scoreAdd: 2_000_000,
    narration: `Here is how that turns into wealth. Disease currently drags down thirteen percent of global GDP — fifteen trillion dollars a year in lost productivity and medical costs. Every disease you cure unlocks a permanent slice of that. Freed workers produce more. More production generates more tax revenue. More revenue funds more trials. More trials cure more diseases. It compounds. Healthcare spending returns three times more economic activity per dollar than military spending. At current trajectory, your economy grows at two point five percent. Redirect the spending, cure the diseases, and it compounds at seventeen point nine percent. Over twenty years, that is the difference between twelve thousand five hundred dollars per person and three hundred and thirty-nine thousand dollars per person. That is not a fantasy. That is compound interest applied to not killing people.`,
  },
  {
    id: "script-4c2-dysfunction-tax",
    title: "The $101 Trillion Bug",
    componentId: "dysfunction-tax",
    bgColor: "foreground",
    tags: ["problem", "financial"],
    act: "II-solution",
    narration: `How expensive is that bug? Health innovation delays: thirty-four trillion dollars a year. Migration restrictions: fifty-seven trillion. Lead poisoning: six trillion. Underfunded science: four trillion. Total: one hundred and one trillion dollars per year in unrealised potential. That is eighty-eight percent of global GDP — wasted because your governments cannot coordinate on things literally everyone agrees on.`,
  },
  {
    id: "script-4d-scoreboard",
    title: "The Scoreboard",
    componentId: "quest-objectives",
    bgColor: "background",
    tags: ["solution"],
    act: "II-solution",
    scoreAdd: 5_000_000,
    narration: `The entire game comes down to two numbers. Healthy life expectancy: currently sixty-three point three years, target sixty-nine point eight. Median income: currently eighteen thousand seven hundred dollars, target one hundred and forty-nine thousand. Move these two numbers and everything else follows. That is the scoreboard. Everything on this site exists to move it.`,
  },
  {
    id: "script-5b2-asymmetry",
    title: "$0.06",
    componentId: "asymmetry",
    bgColor: "foreground",
    tags: ["evidence"],
    act: "II-game",
    scoreAdd: 200_000_000,
    narration: `That vote took thirty seconds. At the global average hourly income, your time cost six cents. The upside if the Treaty passes: fifteen point seven million dollars. Per person. That is a ratio of two hundred and forty-five million to one. On my planet we just call it arithmetic.`,
  },
  {
    id: "script-6a-investment",
    title: "Better Than Your Retirement Fund",
    componentId: "prize-investment",
    bgColor: "pink",
    tags: ["financial"],
    act: "II-money",
    scoreAdd: 650_000_000,
    narration: `Step four: deposit into the Earth Optimization Prize Pool. The pool is not sitting in a savings account. It is invested across the most innovative startup companies on Earth — achieving seventeen percent annual growth. Your retirement fund is parked in sclerotic rent-seeking corporations earning eight percent. The prize pool outperforms it by double. You were going to invest that money anyway. Invest it here, where the returns are better and the side effect is curing all disease.`,
  },
  {
    id: "script-6b-mechanism",
    title: "How the Prize Works",
    componentId: "prize-mechanism",
    bgColor: "cyan",
    tags: ["financial", "mechanism"],
    act: "II-money",
    scoreAdd: 800_000_000,
    inventoryAdd: { id: "prize-deposit", name: "PRIZE DEPOSIT", icon: "🪙" },
    narration: `Deposit one hundred dollars into the VC-diversified fund. Two things can happen. If Earth hits its targets, the pool unlocks and VOTE point holders split it. If Earth misses, your hundred dollars still grew at seventeen percent a year — eleven times your money back. Both paths pay. There is no path where you lose.`,
  },
  {
    id: "script-6c-vote-value",
    title: "VOTE Point Value",
    componentId: "vote-point-value",
    bgColor: "yellow",
    tags: ["financial"],
    act: "II-money",
    scoreAdd: 1_000_000_000,
    inventoryAdd: { id: "vote-points", name: "VOTE POINTS ×2", icon: "🥈" },
    narration: `Now for the Vote Points. Every friend you got to play earned you one point. If the world's retirement savings compound in the prize pool at seventeen percent instead of eight, the pool reaches seven hundred and seventy-four trillion dollars. Split across four billion players, each VOTE point is worth one hundred and ninety-four thousand dollars. Two friends playing: three hundred and eighty-seven thousand. Ten friends: one point nine million. Points cannot be bought. They can only be earned by getting real people to play the game. The more friends you bring in, the bigger the prize pool gets, the more valuable everyone's points become.`,
  },
  {
    id: "script-6d-free-option",
    title: "You Cannot Lose",
    componentId: "prize-free-option",
    bgColor: "pink",
    tags: ["financial", "cta"],
    act: "II-money",
    scoreAdd: 1_500_000_000,
    narration: `But wait — if humanity wins, does my deposit go to VOTE holders instead of back to me? Yes. And here is why that is fine. First: get even two friends to play and you have Vote Points worth three hundred and eighty-seven thousand dollars — far more than your deposit. Second: if humanity wins, everyone is ten times richer. Your one hundred dollar deposit vanishes into a world where your lifetime income just increased by fifteen point seven million dollars. You do not mourn the one hundred dollars. You are too busy being a multimillionaire in a civilisation that cured all disease. The only way to lose is not to play.`,
  },
  {
    id: "script-8b-metric",
    title: "We Changed the Metric",
    componentId: "metric-changed",
    bgColor: "foreground",
    tags: ["solution"],
    act: "II-accountability",
    scoreAdd: 4_000_000_000,
    narration: `Your leaders are not evil. They are just optimising for the wrong metric. We changed the metric.`,
  },
  {
    id: "script-armory-dfda",
    title: "The Decentralized FDA",
    componentId: "dfda",
    bgColor: "cyan",
    tags: ["feature"],
    act: "II-armory",
    scoreAdd: 4_200_000_000,
    narration: `Your FDA makes treatments wait eight point two years after they have already been proven safe. Just sitting there. Being safe. While one hundred and two million people died waiting. The decentralized FDA runs pragmatic trials at nine hundred and twenty-nine dollars per patient instead of forty-one thousand. Same patients. Real-world conditions instead of artificial ones. Forty-four times cheaper. Twelve point three times more trial capacity. The drugs that did pass the FDA's review? Vioxx killed fifty-five thousand. OxyContin killed five hundred thousand. Total executives jailed: zero. We can do better. We are doing better.`,
  },
  {
    id: "script-armory-iab",
    title: "Incentive Alignment Bonds",
    componentId: "iab",
    bgColor: "pink",
    tags: ["feature", "financial"],
    act: "II-armory",
    scoreAdd: 4_500_000_000,
    narration: `Incentive Alignment Bonds. Sell one billion dollars of these on-chain. Use the proceeds to fund the one percent Treaty campaign. When the treaty passes, it generates twenty-seven billion dollars per year. That revenue splits: eighty percent to clinical trials — the actual public good. Ten percent back to bond holders — your return on investment. Ten percent to a SuperPAC that funds politicians algorithmically based on their Alignment Score. Not based on who they had dinner with.`,
  },
  {
    id: "script-armory-superpac",
    title: "The Alignment SuperPAC",
    componentId: "superpac",
    bgColor: "cyan",
    tags: ["feature"],
    act: "II-armory",
    scoreAdd: 4_700_000_000,
    narration: `The remaining ten percent funds a SuperPAC — but not the kind your species is used to. This one funds politicians algorithmically, based on their Citizen Alignment Score. Vote for the treaty? Campaign funding flows to you automatically. Vote against it? Nothing. No dinners. No lobbyists. No phone calls. Just a smart contract that reads your voting record and pays accordingly.`,
  },
  {
    id: "script-armory-optimizer",
    title: "The Optimizer",
    componentId: "optimizer",
    bgColor: "yellow",
    tags: ["feature"],
    act: "II-armory",
    scoreAdd: 5_000_000_000,
    narration: `For the politicians who actually want to align: the Optimal Policy Generator and Optimal Budget Generator. Feed them time-series data from hundreds of jurisdictions. Domain-agnostic causal inference — Bradford Hill criteria, temporal alignment, predictor impact scores. Two questions: which policies actually worked, and how much should you spend on each category? Portugal decriminalised all drugs in two thousand and one. Overdose deaths dropped eighty percent. America spent forty-seven billion dollars per year on the War on Drugs. Overdose deaths rose one thousand seven hundred percent. The machine found this. Your politicians ignored it. Singapore spends a quarter of what America spends on healthcare and their people live six years longer. The optimal budget is not the biggest budget. It is the smartest one.`,
  },
  {
    id: "script-armory-storacha",
    title: "Storacha: Immutable Evidence",
    componentId: "storacha",
    bgColor: "background",
    tags: ["feature"],
    act: "II-armory",
    scoreAdd: 5_200_000_000,
    narration: `Four types of evidence — preference aggregations, policy analyses, health outcomes, budget optimisations — each one chained to the last via content-addressed CID links on Storacha. No government can delete it. No lobbyist can edit it. Break the chain? The hash won't match. Anyone can verify the entire history with nothing but a CID and an internet connection. If your government could delete the evidence, they would. They cannot. It is on IPFS.`,
  },
  {
    id: "script-armory-hypercerts",
    title: "Hypercerts: Verifiable Impact",
    componentId: "hypercerts",
    bgColor: "pink",
    tags: ["feature"],
    act: "II-armory",
    scoreAdd: 5_400_000_000,
    narration: `Every claim of impact gets a Hypercert — a verifiable attestation published to AT Protocol that says exactly what was done, by whom, with what result. Recruit verified voters — Hypercert. Fund the prize pool — Hypercert. Score a politician's alignment with citizen preferences — Hypercert. Activity claims, measurements, evaluations. Permanent. Auditable. On Bluesky. If someone tells you they recruited a thousand voters, you ask for the Hypercert. If they do not have one, they did not recruit a thousand voters.`,
  },
  {
    id: "script-armory-wish",
    title: "The $WISH Token",
    componentId: "wish-token",
    bgColor: "yellow",
    tags: ["feature", "financial"],
    act: "II-armory",
    scoreAdd: 5_600_000_000,
    narration: `The WISH token replaces three things your government does badly. One: taxation. A flat zero point five percent transaction tax replaces your entire IRS. No seventy-four thousand page tax code. No eighty-three thousand employees. Revenue collection as a protocol feature. Two: welfare. Universal Basic Income distributed automatically via World ID. Everyone at the poverty line, no bureaucracy. Three: monetary policy. Algorithmic zero-percent inflation — captured productivity gains prevent the inflationary theft that destroyed ninety-seven percent of your dollar. Your central bank's job, done by a smart contract, in four lines of code.`,
  },
  {
    id: "script-armory-brains",
    title: "Billions of Brains",
    componentId: "i-pencil",
    bgColor: "foreground",
    tags: ["solution"],
    act: "II-armory",
    scoreAdd: 5_800_000_000,
    narration: `You are looking at this and thinking: this is impossibly complicated. Decentralized clinical trials, smart contracts, causal inference engines, immutable storage, algorithmic governance — who is going to build all of this? The answer: you do not need to know. Nobody knows how to make a pencil. Not one person on Earth. The wood comes from one country, the graphite from another, the rubber from a third, the paint from a fourth. Millions of people each doing one tiny step. No one coordinates them. The price system does. That is what the prize pool is. Four billion people, each with Vote Points worth one hundred and ninety-four thousand dollars, will figure out how to build a decentralized FDA the same way they figured out how to build a pencil. You do not need a plan. You need an incentive. The incentive is seven hundred and seventy-four trillion dollars. And the game does not pick which solution wins. Researcher discovers cheaper trials? Gets paid. Lobbyist passes legislation? Gets paid. Nonprofit gets a million people to play? Gets paid. Every approach competes. The best ones get funded. That is not central planning. That is a market for saving civilisation.`,
  },
  {
    id: "script-7-personal-upside",
    title: "Your $15.7 Million",
    componentId: "personal-upside",
    bgColor: "yellow",
    tags: ["financial", "cta"],
    act: "II-climax",
    scoreAdd: 6_000_000_000,
    inventoryAdd: { id: "claim", name: `$${personalUpsideM}M CLAIM`, icon: "📋" },
    narration: `If the one percent Treaty passes, your lifetime income gains are fifteen point seven million dollars. Per person. Not per country. Per person. You currently lose twelve thousand six hundred dollars a year to political dysfunction — that is your share of the one hundred and one trillion dollar bug. This is not philanthropy. This is the largest investment opportunity in the history of your species. And the cost of not playing is fifteen point seven million dollars.`,
  },
  {
    id: "script-10b-lives",
    title: "10.7 Billion Lives",
    componentId: "lives-saved",
    bgColor: "cyan",
    tags: ["cta"],
    act: "III",
    scoreAdd: 7_500_000_000,
    narration: `One hundred and fifty thousand deaths per day. Two hundred and twelve years of treatment acceleration from the combined trial capacity increase and efficacy lag elimination. A third of those deaths are avoidable with earlier cures. Multiply it out: ten point seven billion lives. More than the total number of humans who have ever lived in a single century. Every share, every vote, every conversation moves the probability. The question is not whether your effort matters. It is how many hundred million lives it is worth.`,
  },

  // ── PROTOCOL LABS HACKATHON — trimmed narration for ~3:30 ──────────────────
  {
    id: "pl-intro",
    title: "The Earth Optimization Game",
    componentId: "sierra-earth-optimization-game",
    tags: ["hook"],
    act: "I",
    narration: "The Earth Optimization Game. Optimize your governments to stop making everyone poorer and deader and start making everyone healthier and wealthier!",
  },
  {
    id: "pl-170t",
    title: "$170 Trillion",
    componentId: "sierra-military-waste-170t",
    tags: ["hook", "problem"],
    act: "I",
    narration: "Since 1913, your governments have printed 170 trillion dollars out of nothing and spent these nothing papers on murdering 97 million humans and destroying many valuable things those humans spent their entire lives building. Consequently your paycheck now buys 97 percent less due to the aforementioned destruction.",
  },
  {
    id: "pl-170t-cost",
    title: "They Bought the Other Thing",
    componentId: "sierra-170t-opportunity-cost",
    tags: ["hook", "problem"],
    act: "I",
    narration: `Instead of murdering 97 million people and destroying everything they built, they could have funded ${Math.round(CUMULATIVE_MILITARY_SPENDING_FED_ERA.value / GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value).toLocaleString()} years of clinical trials. They bought the other thing. Through compounding effects, you would be 33 times richer and significantly less diseased today if someone had aligned your governments in 1913. They did not. So that is what you are going to do.`,
  },
  {
    id: "pl-misaligned",
    title: "Misaligned Superintelligence",
    componentId: "sierra-misaligned-superintelligence",
    tags: ["hook", "problem"],
    act: "I",
    narration: "Your governments are misaligned superintelligences. Collective intelligence systems controlling 50 trillion dollars and 8 billion lives. Stated objective: promote the general welfare. Actual objective: campaign contributions.",
  },
  {
    id: "pl-ratio",
    title: "604:1",
    componentId: "sierra-military-health-ratio",
    tags: ["hook", "problem"],
    act: "I",
    narration: `So right now they currently spend ${milToTrialRatio} dollars on the capacity for mass murder for every one dollar testing which medicines work. 95 percent of diseases have zero FDA-approved treatments. Curing them all at current spending takes ${oldQueue} years. You will be dead in 80. I mention this not to be rude but because you seem weirdly calm about it.`,
  },
  {
    id: "pl-moronia",
    title: "Game Over",
    componentId: "sierra-economic-collapse-clock",
    tags: ["problem"],
    act: "turn",
    narration: `The parasitic economy — cybercrime plus military spending — is growing at 15 percent per year. The productive economy is growing at 3. Argentina collapsed at 38 percent. Yugoslavia at 40. The Soviet Union at 45. By ${collapseYear}, Earth crosses the same threshold. Think Somalia, but everywhere. But there is a save file.`,
  },
  {
    id: "pl-wishonia",
    title: "Select an Earth",
    componentId: "sierra-compound-growth-scenarios",
    tags: ["solution"],
    act: "turn",
    narration: `Three timelines over 15 years. Status quo: parasitic economy overtakes productive. You get poorer and deader. The 1 percent treaty: all nations redirect 1 percent of military spending to clinical trials simultaneously — no one loses strategic advantage. Healthy people work more, earn more, and spend less on healthcare. That compounds. ${treatyHaleGainYears} more healthy years, ${treatyIncomeMultiplier} times richer. Optimal governance: end the ${dysfunctionCostT} trillion dollar Political Dysfunction Tax. ${optimalGovernanceIncomeMultiplier} times richer. Choose.`,
  },
  {
    id: "pl-treaty",
    title: "The 1% Treaty",
    componentId: "sierra-one-percent-treaty",
    tags: ["solution"],
    act: "II-solution",
    narration: `Redirect 1 percent of the global military budget to pragmatic trials integrated into standard healthcare — 82 times more efficient than traditional trials. 27 billion dollars a year. Trial capacity increases ${trialCapacityX} times. ${oldQueue} years compresses to ${newQueue}.`,
  },
  {
    id: "pl-game",
    title: "The Game",
    componentId: "sierra-pairwise-budget-allocation",
    tags: ["mechanism"],
    act: "II-game",
    narration: "You have seen what happens when politicians allocate your money. 97 million dead and a 604 to 1 ratio of bombs to cures. Wishocracy lets you do it instead. Each player allocates the global budget through pairwise comparisons — clinical trials versus military spending, education versus the drug war. Ten choices, two minutes. Eight billion preferences, one optimal budget.",
  },
  {
    id: "pl-budget",
    title: "The Budget",
    componentId: "sierra-eigenvector-budget-result",
    tags: ["mechanism"],
    act: "II-game",
    narration: "When you ask people what they want, cures beat bombs. Nobody has ever asked.",
  },
  {
    id: "pl-ignorance",
    title: "Pluralistic Ignorance",
    componentId: "sierra-pluralistic-ignorance-bug",
    tags: ["problem", "mechanism"],
    act: "II-game",
    narration: "Everyone wants to end war and disease. But everyone thinks it's crazy because nobody else will agree to the steps to make it happen. So nobody does anything. Your economists call this pluralistic ignorance. I call this the dumbest reason a civilisation has ever continued dying and murdering each other.",
  },
  {
    id: "pl-targets",
    title: "Win Conditions",
    componentId: "sierra-win-conditions-hale-income",
    tags: ["mechanism"],
    act: "II-game",
    narration: "The entire game comes down to two numbers. Healthy life expectancy: 63.3 years, target 69.8. Median income: 18 thousand 7 hundred dollars, target 149 thousand. Your species has produced 4,000 pages of U.N. resolutions about these numbers. This game has two progress bars. We find the bars more effective.",
  },
  {
    id: "pl-fund",
    title: "The Fund",
    componentId: "sierra-three-scenarios-all-win",
    tags: ["mechanism", "financial"],
    act: "II-money",
    narration: `Billions of people have to overcome pluralistic ignorance and work together to achieve this. Since your species requires small pieces of paper with presidents on them before you will do anything, you create the Earth Optimization Prize Fund. The target is 1 percent of global savings, diversified across the venture capital sector, producing 17 percent annual returns. If humanity hits the median income and healthy lifespan targets by 2040, your Vote Points pay out. If humanity fails, you get your deposit back plus 17 percent annual returns — your hundred dollars still becomes eleven hundred. Two out of three outcomes are wins. The third option is Somalia.`,
  },
  {
    id: "pl-prize",
    title: "The Prize",
    componentId: "sierra-dominant-assurance-contract",
    tags: ["mechanism", "financial"],
    act: "II-money",
    narration: `Vote, then share your referral link. Each friend who votes through your link earns you one VOTE point. Each point could be worth up to ${votePointValue}.`,
  },
  {
    id: "pl-armory",
    title: "The Armory",
    componentId: "sierra-armory",
    tags: ["feature"],
    act: "II-armory",
    narration: "Now you have the incentive. Here are the tools to hit the targets.",
  },
  {
    id: "pl-dfda",
    title: "Decentralized FDA",
    componentId: "sierra-decentralized-fda",
    tags: ["feature"],
    act: "II-armory",
    narration: "9,500 compounds are proven safe but 99.7 percent of their uses have never been tested. Your FDA makes patients wait 8 years after a drug is proven safe. The Decentralized FDA: real-time Outcome Labels and Treatment Rankings. 44 times cheaper. 12 times more capacity.",
  },
  {
    id: "pl-opg",
    title: "Optimal Policy Generator",
    componentId: "sierra-optimal-policy-generator",
    tags: ["feature"],
    act: "II-armory",
    narration: `The Optimal Policy Generator uses causal inference on hundreds of years of data across dozens of countries to grade every policy A through F by what actually happened. America spent ${drugWarCostB} billion dollars a year on the War on Drugs. Overdoses rose 1,700 percent. Portugal decriminalised drugs for almost nothing. Overdoses dropped 80 percent.`,
  },
  {
    id: "pl-obg",
    title: "Optimal Budget Generator",
    componentId: "sierra-optimal-budget-generator",
    tags: ["feature"],
    act: "II-armory",
    narration: "The Optimal Budget Generator finds the cheapest high performer per category. Singapore: 3,000 dollars per person on healthcare, lives to 84. America: 12,000 dollars, lives to 78.",
  },
  {
    id: "pl-iab",
    title: "How to Train a Senator",
    componentId: "sierra-incentive-alignment-bonds",
    tags: ["feature", "financial"],
    act: "II-armory",
    narration: "Now you know what everyone wants and what the optimal budget is. How do you get your politicians to actually do it? Incentive Alignment Bonds. Raise 1 billion dollars from investors. Use it to fund politicians who vote for the treaty and defund the ones who do not. When the treaty passes, bondholders get perpetual returns proportional to the treaty percentage. Politicians get electoral support proportional to it. Every investor and every politician becomes a permanent lobbyist for expanding it. The math does the lobbying.",
  },
  {
    id: "pl-dirs",
    title: "Decentralized IRS",
    componentId: "sierra-decentralized-irs",
    tags: ["feature"],
    act: "II-armory",
    narration: "Your tax code is 74,000 pages. It costs 546 billion dollars a year in compliance. A 0.5 percent transaction tax does the same job in four lines of Solidity. No filing. No accountants. No loopholes. No lobbyist can bribe a smart contract to give their client a tax loophole.",
  },
  {
    id: "pl-dwelfare",
    title: "Decentralized Welfare",
    componentId: "sierra-decentralized-welfare",
    tags: ["feature"],
    act: "II-armory",
    narration: "Your species already spends 13.5 trillion dollars a year on welfare to prevent starvation. Up to 675 billion of that is pure administrative waste. Universal basic income does the same job for 675 billion less bureaucracy.",
  },
  {
    id: "pl-dfed",
    title: "Decentralized Fed",
    componentId: "sierra-decentralized-federal-reserve",
    tags: ["feature"],
    act: "II-armory",
    narration: "Twelve unelected humans meet eight times a year to decide how much your money is worth. When they print new money, it goes to banks and asset holders first. In 2020 they printed 4 trillion dollars. The wealth of the top 1 percent increased by exactly 4 trillion dollars that year. This smart contract replaces them. Zero percent inflation anchored to productivity growth. New money distributed equally to every human via UBI.",
  },
  {
    id: "pl-storacha",
    title: "Storacha + IPFS",
    componentId: "sierra-ipfs-immutable-storage",
    tags: ["feature"],
    act: "II-armory",
    narration: "The Optimal Policy Generator, Budget Generator, and Decentralized FDA are all powered by data collected through a decentralized census. 8 billion citizens verified via World ID. Budget preferences, treaty votes, health outcomes, impact metrics — stored on Storacha and pinned to IPFS. No government can delete it. No lobbyist can edit it.",
  },
  {
    id: "pl-hypercerts",
    title: "Hypercerts",
    componentId: "sierra-impact-certificates",
    tags: ["feature"],
    act: "II-armory",
    narration: "Every action in the game mints a Hypercert on AT Protocol. Voter recruitment, fund deposits, budget allocations — each verified via World ID and published to Bluesky. Permanent, auditable impact receipts.",
  },
  {
    id: "pl-lives",
    title: "10.7 Billion Lives",
    componentId: "sierra-ten-billion-lives-saved",
    tags: ["cta"],
    act: "III",
    narration: `${totalLivesSavedB} billion lives. ${totalSufferingQuad} quadrillion hours of suffering prevented. That is what 1 percent buys you.`,
  },
  {
    id: "pl-close",
    title: "Play Now",
    componentId: "sierra-final-call-to-action",
    tags: ["cta"],
    act: "III",
    narration: "Think about someone you love who is suffering right now. The treatment that would help them exists as an untested compound on a shelf, because the money bought a missile instead. That missile incinerated a child who would have grown up to discover the cure. You lose the treatment. You lose the scientist. You get the invoice. One percent fixes this. One vote starts it. Go to optimitron dot com and play now.",
  },
  {
    id: "pl-cta",
    title: "Vote Now",
    componentId: "sierra-post-credits-aliens",
    tags: ["cta"],
    act: "III",
    narration: "The Earth Optimization Game is brought to you by the good humans at Protocol Labs funding the Commons, Hypercerts, Storacha, Worldcoin, and Base.",
  },
];

// ---------------------------------------------------------------------------
// Segment lookup
// ---------------------------------------------------------------------------

const segmentMap = new Map(SEGMENTS.map((s) => [s.id, s]));

export function getSegment(id: string): DemoSegment | undefined {
  return segmentMap.get(id);
}

export function getSegments(ids: string[]): DemoSegment[] {
  return ids.map((id) => segmentMap.get(id)).filter(Boolean) as DemoSegment[];
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

export const PLAYLISTS: DemoPlaylist[] = [
  {
    id: "protocol-labs",
    name: "Protocol Labs Hackathon (~3:30)",
    description: "Problem → solution → game → tools → PL tech → endgame",
    segmentIds: [
      // Intro + Problem (~35s)
      "pl-intro",
      "pl-cta",
      "pl-misaligned",
      "pl-170t",
      "pl-170t-cost",
      "pl-ratio",
      // Game Over + Turn (~10s)
      "pl-moronia",
      "pl-wishonia",
      // Solution
      "pl-treaty",
      // The Incentive
      "pl-ignorance",
      "pl-targets",
      "pl-fund",
      "pl-prize",
      // The Tools
      "pl-armory",
      "pl-dfda",
      "pl-opg",
      "pl-obg",
      "pl-game",
      "pl-budget",
      "pl-iab",
      // Optimal Governance Tools
      "pl-dfed",
      "pl-dirs",
      "pl-dwelfare",
      // Protocol Labs Tech (~20s)
      "pl-storacha",
      "pl-hypercerts",
      // Endgame (~15s)
      "pl-lives",
      "pl-close",
    ],
  },
  {
    id: "hackathon",
    name: "Hackathon Demo (~6 min)",
    description: "Sierra adventure game — 38 slides, full narrative arc with Armory",
    segmentIds: [
      // Act I — The Horror
      "script-0-cold-open",
      "script-1a-misaligned",
      "script-1b-objective",
      "script-2b-ratio",
      "script-2c-clock",
      "script-2d-failed-state",
      "script-2e-ai-hackers",
      "script-2f-paycheck-theft",
      // GAME OVER / RESTORE
      "script-3a-moronia",
      "script-3b-wishonia",
      // Act II — The Solution
      "script-4a-fix",
      "script-4b-acceleration",
      "script-4b2-compounding",
      "script-4c-ignorance",
      "script-4c2-dysfunction-tax",
      "script-4d-scoreboard",
      // Act II — The Game
      "script-5a-allocate",
      "script-5b-vote",
      "script-5b2-asymmetry",
      "script-5c-share",
      // Act II — The Money
      "script-6a-investment",
      "script-6b-mechanism",
      "script-6c-vote-value",
      "script-6d-free-option",
      // Act II — Accountability
      "script-8-leaderboard",
      "script-8b-metric",
      // Act II — The Armory
      "script-armory-dfda",
      "script-armory-iab",
      "script-armory-superpac",
      "script-armory-optimizer",
      "script-armory-storacha",
      "script-armory-hypercerts",
      "script-armory-wish",
      "script-armory-brains",
      // Act II — Climax
      "script-7-personal-upside",
      // Act III — Endgame
      "script-10b-lives",
      "script-11-close",
    ],
  },
  {
    id: "full-demo",
    name: "Full Demo (16 min)",
    description: "Complete walkthrough: evidence + features + agency report cards + corruption data",
    segmentIds: [
      "hook-mortality",
      "hook-misaligned-ai",
      "game-scoreboard",
      "countries-leaderboard",
      "agencies-report-cards",
      "agencies-drug-war",
      "evidence-historical-waste",
      "agencies-fda-graveyard",
      "agencies-money-printer",
      "game-the-question",
      "evidence-cost-effectiveness",
      "evidence-trial-cost",
      "game-how-to-win",
      "evidence-worked-example",
      "game-how-to-play",
      "evidence-viral-doubling",
      "game-pluralistic-ignorance",
      "evidence-per-pct-point",
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
    ],
  },
  {
    id: "investor",
    name: "Investor Pitch (8 min)",
    description: "Financial mechanism + evidence + unit economics + ROI",
    segmentIds: [
      "hook-mortality",
      "hook-dysfunction-tax",
      "game-scoreboard",
      "evidence-historical-waste",
      "evidence-trial-cost",
      "evidence-cost-effectiveness",
      "prize-mechanism",
      "evidence-worked-example",
      "prize-vote-points",
      "prize-no-downside",
      "evidence-personal-upside",
      "evidence-viral-doubling",
      "evidence-per-pct-point",
      "countries-singapore",
      "feature-architecture",
      "close-investor",
    ],
  },
  // ── YouTube Feature Series ─────────────────────────────────────────────
  {
    id: "youtube-prize",
    name: "The Earth Optimization Prize",
    description: "How the prize mechanism works + financial upside",
    segmentIds: [
      "hook-mortality",
      "prize-mechanism",
      "prize-vote-points",
      "prize-no-downside",
      "close-play-now",
    ],
  },
  {
    id: "youtube-wishocracy",
    name: "Wishocracy: Democracy in 4 Minutes",
    description: "Pairwise budget allocation + eigenvector",
    segmentIds: [
      "hook-misaligned-ai",
      "feature-wishocracy",
      "feature-alignment",
      "close-play-now",
    ],
  },
  {
    id: "youtube-governments",
    name: "Government Report Cards",
    description: "Country rankings + Singapore comparison + body count",
    segmentIds: [
      "hook-mortality",
      "countries-leaderboard",
      "countries-singapore",
      "countries-body-count",
      "close-play-now",
    ],
  },
  {
    id: "youtube-dfda",
    name: "Decentralized FDA",
    description: "Why treatments take 8.2 years + the fix",
    segmentIds: [
      "hook-mortality",
      "feature-dfda",
      "game-the-question",
      "close-play-now",
    ],
  },
  {
    id: "youtube-treasury",
    name: "The $WISH Token",
    description: "0.5% transaction tax replaces the IRS + UBI",
    segmentIds: [
      "hook-dysfunction-tax",
      "feature-treasury",
      "close-play-now",
    ],
  },
  {
    id: "youtube-optimizer",
    name: "The Optimizer",
    description: "Domain-agnostic causal inference engine",
    segmentIds: [
      "feature-optimizer",
      "feature-chat",
      "close-play-now",
    ],
  },
  // ── NEW YouTube Videos (from agency/corruption data) ───────────────────
  {
    id: "youtube-agency-grades",
    name: "Agency Report Cards",
    description: "Every US agency graded — 10 F's, 5 D's, 1 B",
    segmentIds: [
      "hook-misaligned-ai",
      "agencies-report-cards",
      "agencies-drug-war",
      "agencies-fda-graveyard",
      "close-play-now",
    ],
  },
  {
    id: "youtube-government-lies",
    name: "Government Lies",
    description: "Tuskegee, MK-Ultra, Gulf of Tonkin, WMDs — all declassified",
    segmentIds: [
      "agencies-government-lies",
      "agencies-cia-coups",
      "close-play-now",
    ],
  },
  {
    id: "youtube-money-printer",
    name: "The Money Printer",
    description: "97% purchasing power lost, $528K stolen per family, economy grew faster without the Fed",
    segmentIds: [
      "agencies-money-printer",
      "agencies-corruption",
      "close-play-now",
    ],
  },
  {
    id: "youtube-ironic-laws",
    name: "Laws Named Wrong",
    description: "Affordable Care Act, Drug Free America, Department of Defense — named the opposite of what they do",
    segmentIds: [
      "agencies-ironic-laws",
      "close-play-now",
    ],
  },
  {
    id: "youtube-evidence",
    name: "The Math Behind the Prize",
    description: "Cost-effectiveness, trial costs, viral model, worked example, per-percentage-point value",
    segmentIds: [
      "hook-mortality",
      "evidence-cost-effectiveness",
      "evidence-trial-cost",
      "evidence-historical-waste",
      "evidence-worked-example",
      "evidence-viral-doubling",
      "evidence-per-pct-point",
      "evidence-personal-upside",
      "close-investor",
    ],
  },
  // ── Social Media Clips ─────────────────────────────────────────────────
  {
    id: "social-deaths",
    name: "150K Deaths (30s)",
    description: "The mortality hook",
    segmentIds: ["hook-mortality"],
  },
  {
    id: "social-604",
    name: "604:1 Ratio (30s)",
    description: "Military vs clinical trial spending",
    segmentIds: ["hook-mortality"],
  },
  {
    id: "social-singapore",
    name: "Singapore Proof (45s)",
    description: "Same species, different configuration",
    segmentIds: ["countries-singapore"],
  },
  {
    id: "social-collapse",
    name: "2037 Collapse (30s)",
    description: "Parasitic economy timeline",
    segmentIds: ["hook-parasitic-economy"],
  },
  {
    id: "social-cant-lose",
    name: "You Can't Lose (30s)",
    description: "Prize downside protection",
    segmentIds: ["prize-no-downside"],
  },
  {
    id: "social-drug-war",
    name: "$47B Drug War (45s)",
    description: "Spent $47B/yr, overdose deaths 20x worse",
    segmentIds: ["agencies-drug-war"],
  },
  {
    id: "social-fda-graveyard",
    name: "102M Murdered by FDA (45s)",
    description: "8.2-year efficacy lag, 102M dead",
    segmentIds: ["agencies-fda-graveyard"],
  },
  {
    id: "social-money-printer",
    name: "97% Dollar Destroyed (45s)",
    description: "$528K stolen per family since 1971",
    segmentIds: ["agencies-money-printer"],
  },
  {
    id: "social-government-lies",
    name: "Declassified Lies (60s)",
    description: "Tuskegee, MK-Ultra, Gulf of Tonkin, WMDs",
    segmentIds: ["agencies-government-lies"],
  },
  {
    id: "social-ironic-laws",
    name: "Laws Named Wrong (45s)",
    description: "Affordable Care Act premiums doubled",
    segmentIds: ["agencies-ironic-laws"],
  },
  {
    id: "social-cia-coups",
    name: "10 Democracies Overthrown (60s)",
    description: "CIA coups for corporate interests",
    segmentIds: ["agencies-cia-coups"],
  },
  {
    id: "social-corruption",
    name: "The Corruption Machine (45s)",
    description: "$374M pharma lobbying, insulin $3.69 to make, $300 to buy",
    segmentIds: ["agencies-corruption"],
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
  return getSegments(playlist.segmentIds);
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

// Keep backward compat — DEMO_SLIDES is the full demo playlist
export const DEMO_SLIDES = getPlaylistSegments(DEFAULT_PLAYLIST_ID);
export const ESTIMATED_TOTAL_SECONDS = estimatePlaylistDuration(DEFAULT_PLAYLIST_ID);
